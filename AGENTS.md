# Licheskis Cook Assistant — Codex Agents Guidelines

## Project Overview

Licheskis Cook Assistant is a React + Firebase Functions application for intelligent meal planning based on hormonal cycles. The frontend is in React, with backend logic in Firebase Cloud Functions (Node.js/Express). The database is Firestore.

## Environment & Setup

- All code should be compatible with the environment described in the [Codex documentation](https://platform.openai.com/docs/codex/overview#environment-configuration).
- Dependencies are installed via `npm install` in both the project root and `/functions` folders.
- Do **not** assume the presence of any global dependencies unless explicitly mentioned.
- If extra dependencies or environment variables are needed, document them in the instructions or include them in the agent config.

## Code Style & Conventions

- **Language:** All user-facing UI must be in English.
- **Coding Standards:** Follow idiomatic JavaScript/React/Node.js practices.
- **Formatting:** Respect the existing codebase’s formatting and indentation style.
- **No code logic changes** unless explicitly requested.
- **Testing:** Jest is the default testing framework. All new code should be testable with Jest.
- **UI Text:** All user-facing text must be clear, concise, and natural for English-speaking users.

## Patterns & Restrictions

- **Alerts/Toasts:** All user notifications must use the Toast system (`useToast`, `ToastProvider`, etc.). Never use `alert()` or window dialogs.
- **Redirects:** All redirects (navigation based on auth, permissions, etc.) must happen inside `useEffect`, not during render.
- **Translations:** When translating UI, only user-facing strings should be changed. Never modify variable names, function names, or logic unless requested.
- **Refactoring:** Always show before/after snippets for text/UI changes or structural refactors.

## Agent Usage Examples

- **Translating UI text:** Only translate user-facing Portuguese strings to English, and leave all code/logic unchanged.
- **Adding features:** Follow React/Node.js best practices and ensure all notifications and redirects use the established Toast+Effect pattern.
- **Testing/Setup:** Any scripts or instructions must be compatible with the Codex environment (see official docs).
- **Code audit:** When searching for anti-patterns (e.g., `alert()` in render), suggest a fix using the Toast+Effect pattern.

## What NOT to do

- Do not update code logic, API contracts, or database schema unless requested.
- Do not add dependencies without explicit instruction.
- Do not assume global binaries or OS-specific behavior.

## Review & Reporting

- For all automated changes, always output a summary:
    - List of affected files and lines
    - Before/after for each major change
    - TODO comments for anything that needs manual review

## Contact

If any instruction is unclear or ambiguous, leave a TODO comment and escalate for manual review.

