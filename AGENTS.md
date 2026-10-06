# TerriMaint — instructions for coding agents

## Context

Read `README.md`, `docs/project.md` and `docs/workflow.md`, then the task or issue.
TerriMaint is a CDA training project with a real small-municipality use case.
Arthur owns product decisions, reviews the code and needs to explain it at his exams.
Communicate in French; use English identifiers in code.

## Stack and scope

- One repository: `backend/`, `frontend/`, `docs/`, `.github/`.
- Backend: Python / FastAPI; PostgreSQL, SQLAlchemy, Alembic planned next.
- Frontend: Angular / TypeScript, responsive for both Agent and Responsable roles.
- Offline support is targeted at critical field actions; consult `docs/project.md`.
- Build only the requested slice. Avoid speculative abstractions and unrelated refactors.
- Record substantial architecture decisions in `docs/decisions.md`.

## Working agreement

1. Check `git status` and the current branch. Preserve existing user changes.
2. Use one task branch (`feat/...`, `fix/...`, `chore/...`, `docs/...`); work off `main`.
3. Announce a short plan and the acceptance criteria, then implement the agreed scope.
4. You may edit files, run commands, format code, add necessary tests and correct failures
   without requesting approval for every routine step. Explain necessary dependency changes.
5. Run `uv run --locked python scripts/check.py` before handing off Python changes.
   Once checks pass, rerun only when further edits or unresolved failures justify it.
   Documentation-only changes need link/consistency checks, not new application tests.
6. With a configured GitHub remote, you may commit the task changes, push the task branch
   and open a draft pull request. Link the issue and use the PR template.
   Scope commits to your changes. Use the existing Git identity; do not change global Git config.
7. Stop at the reviewable pull request. Arthur chooses when to merge and deploy.
   Never bypass branch protections or change permissions to finish a task.
8. Report the resulting behavior, important files, exact checks and any checks not run.
   Add a short explanation of the code Arthur needs to understand.

No blanket pause for routine reversible edits. Ask only for a missing business decision,
an expansion of scope, or an action not authorized by the task.
Initial repository bootstrap may create the first commit on `main`; subsequent changes use PRs.

## Quality

- Tests cover observable behavior and important failure cases; do not mirror implementation.
- Never remove tests or weaken CI just to obtain a green result.
- Keep the API typed, validate request data and return consistent errors as endpoints grow.
- Add the frontend checks to CI when the Angular app is initialized.
- Keep secrets in ignored local configuration and use fictional demonstration data.

## Code Review Rules

Prioritize correctness, authorization, data integrity and regressions.
Check role boundaries and organization scoping when those features are introduced.
For field workflows, review the effect of network loss, retry and duplicate synchronization.
Use CI for formatting; keep review findings focused on behavior and concrete risks.
