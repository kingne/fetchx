# Repository Guidelines

## Project Structure & Module Organization
Core library code lives in `src/`. `src/core.ts` implements the `Http` class, `src/index.ts` builds the default exported instance, and `src/type.ts`, `src/default.ts`, and `src/utils.ts` hold shared types, defaults, and helpers. Tests live in `test/`, currently with request coverage in `test/get.test.ts`. Build output is written to `dist/`; treat it as generated code and do not edit it manually.

## Build, Test, and Development Commands
Use Bun for all local work:

- `bun install` installs dependencies.
- `bun run build` bundles `src/index.ts` into `dist/`.
- `bun test` runs the test suite with Bun’s test runner.

There is no separate lint or typecheck script yet. When adding one, wire it through `package.json` so contributors have a single entry point.

## Coding Style & Naming Conventions
This package is written in TypeScript with `strict` mode enabled in [`tsconfig.json`](/Users/wangning/mynpm/fetchx/tsconfig.json). Follow the existing style in `src/`: 2-space indentation, semicolons, double quotes, and explicit exported types where they improve API clarity. Use `PascalCase` for classes and type aliases that model primary concepts (`Http`, `Config`), and `camelCase` for functions, methods, and variables (`buildURL`, `mergeConfig`).

Keep modules focused. New transport logic belongs in `src/core.ts` or a dedicated helper in `src/utils.ts`; public API surface should be re-exported through `src/index.ts`.

## Testing Guidelines
Add tests under `test/` with the `*.test.ts` suffix. Prefer Bun’s built-in test APIs: `describe`, `it`, and `expect`. Current tests hit a live external endpoint; new tests should favor deterministic inputs and avoid third-party network dependencies when possible. Cover request methods, config merging, middleware behavior, and error handling before changing public behavior.

## Commit & Pull Request Guidelines
Git history is minimal, but the existing commit style is short and imperative (`init project`). Continue with concise subjects such as `add middleware test` or `fix header merge`. Pull requests should include a brief description, the user-facing impact, test notes (`bun test` output or rationale if skipped), and linked issues when relevant. Include request/response examples when changing the HTTP API.
