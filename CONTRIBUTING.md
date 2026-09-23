# Contributing to APEX // Coder Hub

Thanks for wanting to help fix and improve APEX! This project is a work in progress — bug reports and PRs are equally welcome.

## Getting started

```bash
git clone https://github.com/roarwing8/cli-coder-nexus.git
cd cli-coder-nexus
npm install
npm run dev
```

Dashboard runs at `http://localhost:3777`.

## Before you open an issue

1. Search [existing issues](https://github.com/roarwing8/cli-coder-nexus/issues) — it may already be reported
2. Use the **Bug report** or **Feature request** template
3. Include OS, Node.js version, and error logs — that's how we reproduce faster

## Making a pull request

1. Fork the repo and create a branch from `main`:
   ```bash
   git checkout -b fix/short-description
   ```
2. Make your change
3. Run tests and typecheck — both must pass:
   ```bash
   npm test
   npm run build
   ```
4. Open a PR against `main` with a clear description of the problem and fix
5. Link any related issues (e.g. `Fixes #12`)

## Code style

- TypeScript strict mode — no `any` unless unavoidable
- Match the existing code style in `src/`
- Keep PRs focused: one fix or feature per PR

## Where to help

Check issues labeled **`help wanted`** or **`bug`** for tasks where you can jump in.
