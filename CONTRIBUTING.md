# Contributing

Install workspace dependencies from the repository root, then use the root scripts: `npm run lint`, `npm run typecheck`, and `npm run test:prompt-regression`. Scope a workspace command with the package manager’s workspace flag when needed (`apps/mobile`, `apps/api`, or `packages/shared`).

Work schema-first: a prediction prompt may not be written until its JSON Schema exists and has been reviewed. Any prompt or schema change must update its examples and regression fixtures in the same pull request.

Tag every persisted prediction as `{model-snapshot}::{head}_v{n}`. Increase `n` whenever either that head’s prompt or schema changes, so evaluations remain comparable.
