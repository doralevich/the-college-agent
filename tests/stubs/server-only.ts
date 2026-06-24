// Stand-in for the `server-only` package, which exists only as a Next.js build-time marker
// (it throws if a server module is pulled into a client bundle). Under Vitest there is no
// bundler, so this no-op lets server modules import without resolution errors.
export {};
