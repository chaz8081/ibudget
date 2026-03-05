// Polyfills for @powersync/web's wa-sqlite WASM loader
// wa-sqlite uses __filename/__dirname to locate its .wasm binary
if (typeof globalThis.__filename === "undefined") {
  (globalThis as Record<string, unknown>).__filename = "";
}
if (typeof globalThis.__dirname === "undefined") {
  (globalThis as Record<string, unknown>).__dirname = "";
}
