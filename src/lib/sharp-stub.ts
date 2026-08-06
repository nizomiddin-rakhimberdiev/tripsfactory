/**
 * Stand-in for `sharp` in the Workers bundle.
 *
 * sharp is a native library. On a platform without its binary it falls back to
 * `@img/sharp-wasm32`, which calls `WebAssembly.compile` at load time — and
 * Workers refuses dynamic Wasm compilation outright. The rejection surfaced as
 * `CompileError: Wasm code generation disallowed by embedder` in the worker log
 * and as a 500 on /admin, which is how this was found: the login screen
 * rendered, and every page behind it failed.
 *
 * Nothing here needs it:
 *
 * - Payload only uses sharp when a collection declares `imageSizes`, and none
 *   do. `payload.config.ts` never passes `sharp` to `buildConfig`, so
 *   `config.sharp` is undefined and the resize path is never entered.
 * - Next used it for its image optimizer, which this project replaced with the
 *   Cloudflare loader — resizing happens at delivery through /cdn-cgi/image/.
 *
 * It throws rather than returning a no-op. If something does start needing
 * sharp, a clear error at the call site beats an image that silently comes out
 * the wrong size.
 */
function unavailable(): never {
  throw new Error(
    "sharp is not available in the Workers runtime. Image resizing happens at " +
      "delivery through Cloudflare (see src/lib/cf-image-loader.ts). If a " +
      "collection now needs `imageSizes`, that work has to move to a build " +
      "step or to Cloudflare Images — it cannot run here.",
  );
}

const sharp = new Proxy(unavailable, {
  get: () => unavailable,
  apply: () => unavailable(),
});

export default sharp;
