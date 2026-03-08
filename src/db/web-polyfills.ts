// Polyfills for @powersync/web's wa-sqlite WASM loader on Metro web.
//
// Metro rewrites `import.meta.url` → `require('url').pathToFileURL(__filename).href`.
// The Node.js `url` module's `pathToFileURL` doesn't exist in browsers, so we shim it
// along with `__filename`/`__dirname` which the transform also references.
if (typeof globalThis.__filename === "undefined") {
  (globalThis as Record<string, unknown>).__filename = "";
}
if (typeof globalThis.__dirname === "undefined") {
  (globalThis as Record<string, unknown>).__dirname = "";
}

// Shim the 'url' module that Metro injects for import.meta.url transforms.
// Metro rewrites `import.meta.url` → `require('url').pathToFileURL(__filename).href`.
// wa-sqlite derives its WASM directory from this: `new URL(".", scriptName).href`.
// We return the page's base URL so WASM resolves correctly both in dev
// (localhost:8081) and production (e.g., chaz8081.github.io/ibudget/).
const urlModule = require("url");
if (typeof urlModule.pathToFileURL !== "function") {
  urlModule.pathToFileURL = (_path: string) => {
    const base = globalThis.location?.href?.replace(/\/[^/]*$/, "/") || "http://localhost:8081/";
    return new URL(base);
  };
}
