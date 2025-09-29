Infoverse Frontend Best Practices

Coding conventions
- Use function components and hooks only. Avoid legacy lifecycles.
- Prefer descriptive names: variables as nouns, functions as verbs.
- Keep components small and focused; extract UI primitives to `src/components/ui/`.

State management
- Keep API and auth state in contexts/hooks. Avoid prop drilling by colocating state or using context.
- Derive data when possible instead of storing duplicates.

API calls
- Use `src/services/api.js` for axios instance with interceptors.
- Use `src/hooks/useApi.js` to standardize loading, error, and cancellation.

Performance
- Memoize expensive computations with `useMemo` and event handlers with `useCallback`.
- Wrap presentational components with `React.memo` when props are stable.
- Avoid anonymous functions in render when passed deep in trees.

Error handling
- Surface actionable error messages; log details to console only in development.

Styling
- Use existing Tailwind setup and keep classNames deterministic; extract repeated styles to components.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
