/**
 * Stand-in for `undici` in the Workers bundle.
 *
 * undici is Node's HTTP client. Its request parser is llhttp, shipped as
 * WebAssembly and compiled at load time — and Workers refuses dynamic Wasm
 * compilation, so importing it threw
 * `CompileError: Wasm code generation disallowed by embedder` and took /admin
 * down with a 500. The login screen rendered; everything behind it did not.
 *
 * The identifying detail, for whoever meets this next: the wasm module's
 * imports are `wasm_on_url`, `wasm_on_status`, `wasm_on_headers_complete` —
 * llhttp's callbacks. Nothing in this project imports undici directly; it
 * arrives through `payload` and through `@payloadcms/storage-vercel-blob`.
 *
 * Payload uses exactly two names from it — `fetch` and `Agent` — to pull a
 * remote file in when a document is created from a URL. On Workers the
 * platform's own `fetch` does that job, and `Agent` configures Node socket
 * pooling that has no meaning here, so it is accepted and ignored.
 */

/** The runtime's own fetch — on Workers this is the native implementation. */
export const fetch: typeof globalThis.fetch = (...args) =>
  globalThis.fetch(...args);

/**
 * Accepts undici's options and does nothing with them.
 *
 * Passing one to `fetch` is a no-op here rather than an error: connection
 * pooling, keep-alive and TLS options are the runtime's business on Workers,
 * and failing an upload over a setting that cannot apply would be worse than
 * ignoring it.
 */
export class Agent {
  constructor(_options?: unknown) {}
}

export default { fetch, Agent };
