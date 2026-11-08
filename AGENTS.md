# Repository Guidelines

## Project Structure & Module Organization

BeeBites currently contains a React + TypeScript application built with Vite.

- `src/main.tsx` mounts the application; `src/App.tsx` contains the starter UI.
- `src/App.css` holds application styles; `src/index.css` defines global styles and theme variables.
- `src/assets/` contains imported images and SVGs. `public/` contains static assets referenced by root paths, such as `/icons.svg`.
- `index.html` is the HTML entry point. Root configuration files cover Vite, TypeScript, and ESLint.
- No test directory exists yet. Production output goes into ignored `dist/`.

## Build, Test, and Development Commands

Run commands from the repository root:

- `npm ci`: install dependencies using `package-lock.json`.
- `npm run dev`: start Vite with hot module replacement.
- `npm run build`: check TypeScript projects with `tsc -b`, then produce a production bundle.
- `npm run lint`: run ESLint across the project.
- `npm run preview`: serve the production build locally; run the build first.

## Coding Style & Naming Conventions

Follow the existing two-space indentation, single-quoted JavaScript/TypeScript strings, double-quoted JSX attributes, and omitted JavaScript semicolons. Retain semicolons in CSS.

Use function components and hooks. Name components and component files in PascalCase, such as `MenuCard.tsx`; use camelCase for variables and functions and `use` prefixes for custom hooks. Follow existing kebab-case CSS selectors.

ESLint enforces JavaScript, TypeScript, React Hooks, and React Refresh rules. No dedicated formatter is configured. TypeScript checks unused locals and parameters; remove unused code before submitting.

## Testing Guidelines

No automated test framework, `npm test` script, or coverage threshold is configured. For code changes, run `npm run lint` and `npm run build`, then manually verify affected interactions, responsive layouts, and light/dark styling with `npm run dev`.

If introducing automated tests, configure a runner and document its command. Prefer colocated `*.test.ts` or `*.test.tsx` files with behavior-focused assertions.

## Commit & Pull Request Guidelines

This checkout has no usable Git history, so an established commit convention cannot be verified. Use concise, imperative subjects, such as `Add menu card component`, and keep commits focused.

Pull requests should explain the change and its purpose, link relevant issues, and list validation performed. Include screenshots for visible UI changes. Update `package-lock.json` alongside dependency changes and exclude generated output.
