/// <reference types="vite/client" />

// @lepid-labs/styles 1.0.0 on npm exports bare CSS subpaths without a `types`
// condition, and TypeScript 6 wants side-effect imports to resolve to a typed
// module. Drop this once a release ships css.d.ts (main already has it).
declare module "@lepid-labs/styles/*";
