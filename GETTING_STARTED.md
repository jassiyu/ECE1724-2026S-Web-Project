# Getting Started

Run the project locally after cloning. You need **Node.js** (v18+) and **PostgreSQL**.

## 1. Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`: set `DATABASE_URL` to your PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/ticketing`). Create the database if it doesn’t exist.

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Backend runs at **http://localhost:3000**. Optional: set `S3_*` in `.env` for file uploads (or leave as-is for local MinIO).

## 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** and proxies `/api` and `/socket.io` to the backend.

## 3. Quick check

- Backend: open http://localhost:3000/health → `{"status":"ok"}`.
- Frontend: open http://localhost:5173 → event list and login/register.

## 4. Poster upload (events)

Poster upload uses **presigned URLs**: the backend returns a temporary URL, and the browser uploads the file directly to S3/MinIO. If upload fails:

- **Logged in:** Create/Edit Event and poster upload require an authenticated user (Organizer). Log in first.
- **Backend .env:** `S3_BUCKET` must be set (e.g. `ticketing-assets`). Other `S3_*` vars are needed for presign and download.
- **MinIO (local):** If you use `S3_ENDPOINT=http://localhost:9000`, run MinIO and create the bucket (e.g. `ticketing-assets`). Otherwise the browser’s PUT to the presigned URL will fail (connection refused or 404).
- **CORS:** The bucket must allow `PUT` from your frontend origin (e.g. `http://localhost:5173`). In MinIO: Bucket → Manage → Access Rules → add a rule allowing that origin and `Content-Type` if needed.
- **Error in UI:** The app now shows the real error (e.g. status code or backend message). Check the red message under the poster input after a failed upload.
