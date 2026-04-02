# AI Interaction Record

The entries below document representative AI interactions that influenced the project in a meaningful way. They were selected because they show judgment, verification, and adaptation rather than trivial rewriting.

---

## Diagnosing QR scanner compatibility and fallback behavior
 
### Prompt (you sent to AI)
 
```text
We are building a React + TypeScript + Vite event ticketing app. The staff page needs to scan QR codes in the browser, but we also want a manual token entry fallback in case camera access is unreliable. Which approach or library is safer for this stack, and how should we prevent the same QR code from triggering multiple validations while the camera is still active?
