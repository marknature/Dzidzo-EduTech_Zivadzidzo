# Contributing

This repository has two independent applications, not a monorepo workspace. Install and verify them from their own directories:

```powershell
cd backend
npm ci
npm run verify:migrations
npm test -- --runInBand

cd ..\frontend
npm ci
npx expo export --platform web --output-dir dist-ci --no-bytecode
```

The migration check is local and static: it never connects to Supabase or reads environment values. Apply remote migrations only through the reviewed procedure in [`backend/migrations/README.md`](backend/migrations/README.md).

Work schema-first: a prediction prompt may not be written until its JSON Schema exists and has been reviewed. Any prompt or schema change must update its examples and regression fixtures in the same pull request.

Tag every persisted prediction as `{model-snapshot}::{head}_v{n}`. Increase `n` whenever either that head’s prompt or schema changes, so evaluations remain comparable.
