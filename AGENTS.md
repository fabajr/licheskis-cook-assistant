# Licheskis Cook Assistant — Codex Agents Guidelines

## Project Overview

Licheskis Cook Assistant is a React + Firebase Functions application for intelligent meal planning based on hormonal cycles.  
Frontend: React  
Backend: Firebase Cloud Functions (Node.js/Express)  
Database: Firestore

---

## Environment & Setup

- All code and scripts must be compatible with the [Codex environment configuration](https://platform.openai.com/docs/codex/overview#environment-configuration).
- **Dependencies must be installed via:**
    - `npm install` (in the project root)
    - `cd functions && npm install` (in the `/functions` folder)
- Do **not** assume the presence of any global dependencies unless explicitly stated.
- Any additional dependencies or required environment variables must be documented or included in the agent configuration.
- The setup script must always install dependencies in both the root and `/functions` (unless otherwise instructed).

---

## Code Style & Conventions

- **Language:** All user-facing UI must be in English.
- **Coding Standards:** Use idiomatic JavaScript/React/Node.js.
- **Formatting:** Respect the existing formatting and indentation.
- **No code logic changes** unless explicitly requested and authorized.
- **Testing:** Use Jest as the standard testing framework; all code must be testable with Jest.
- **UI Text:** All user-facing strings should be clear, concise, and natural in English.

---

## Notifications & Navigation

- **Alerts/Toasts:**  
  - All user notifications must use the Toast system (`useToast`, `ToastProvider`, etc.).
  - Never use `alert()` or window dialogs in UI code.
- **Redirects/Navigation:**  
  - All navigation/redirect logic (e.g., auth or permissions) must occur inside `useEffect` hooks.
  - Never trigger navigation during component render.
- **Pattern:**  
  - Use a unified toast + redirect pattern when possible.  
  - Consider utilities like `redirectWithToast(path, message, type)` for consistency.

---

## Translation & UI Text

- Only translate or change **user-facing strings** (labels, messages, placeholders, button text, etc.).
- Do **not** change variable names, function names, or any code logic when translating.
- Ensure all UI text is idiomatic and clear in English.
- If you find unclear or context-dependent strings, add a `TODO` comment for manual review.

---

## Logic Changes, Business Rules, and Agent Responsibility

### General Policy

- **Agents must not** modify business logic, API contracts, data models, or critical workflows unless the request is explicit, detailed, and unambiguous in granting permission to do so.
- Any task that involves a possible change in how data flows, is stored, processed, or how user actions are handled, **requires explicit approval** from the user/request.

### When in Doubt

- If a prompt or instruction is ambiguous, incomplete, or could be interpreted as requiring a logic change, the agent **must not proceed** without clarification.
- The agent should either:
  - Output a clear warning to the user, OR
  - Leave a `TODO` or `REVIEW` comment in the relevant code section.

### Standard Warning/Comment Examples

- For unclear changes:
    ```js
    // TODO: This change appears to affect business logic. Please review and confirm before proceeding.
    ```
- For API or data model changes:
    ```js
    // REVIEW: This modification may impact the API contract or database schema. Manual approval required.
    ```
- For functional flow alterations:
    ```js
    // TODO: This may alter the application's workflow. Please provide explicit instructions if this is intended.
    ```

### Explicitly Allowed Changes

- Agents **may**:
  - Translate or update user-facing UI text.
  - Refactor code for style or clarity, provided the logic is unchanged.
  - Add, update, or remove comments.
  - Update test descriptions/messages that do not affect the test logic.

### Never Assume

- Do **not** assume permission to:
  - Change logic based on implied intent.
  - Refactor or "improve" logic for efficiency or readability unless requested.
  - Update APIs or data structure for "best practices" unless instructed.

### Escalation

- If any task or request appears to contradict these guidelines, the agent must:
  - Stop and output a request for clarification, and/or
  - Add a clear comment in the code highlighting the area in question.

---

## Reporting & Output

- For all automated or bulk changes, always output a summary:
    - List of affected files and lines
    - Before/after code snippets for major changes
    - TODO or REVIEW comments for manual review where necessary

---

## Contact

If any instruction is unclear or ambiguous, or a task may impact logic, leave a `TODO` or `REVIEW` comment and escalate for manual review by a maintainer.

---

## Tests

All Jest/unit tests must run with all Firebase services (auth, storage, firestore) mocked.
The real Firebase API should never be called during tests.
See /src/__mocks__/firebase.js for the complete mock implementation.

---