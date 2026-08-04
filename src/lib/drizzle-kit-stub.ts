/**
 * Stand-in for `drizzle-kit/api` in the Workers bundle.
 *
 * `@payloadcms/drizzle` reaches for drizzle-kit through `createRequire`, which
 * Turbopack rewrites to a hashed specifier it deliberately cannot resolve.
 * esbuild then fails the Worker bundle on it — the build never gets past
 * "Could not resolve drizzle-kit-<hash>/api".
 *
 * Nothing at request time needs it. drizzle-kit is the schema tool: Payload
 * calls it to generate migrations and to push schema in development, both of
 * which run locally against D1 through wrangler, never inside a Worker.
 *
 * So the alias in next.config.ts points here instead, and these throw rather
 * than return something plausible — if a code path ever does reach for
 * drizzle-kit in production, a clear error beats a silent no-op that corrupts
 * a schema.
 */
const unavailable = (name: string) => (): never => {
  throw new Error(
    `drizzle-kit is not available on Workers (called ${name}). ` +
      `Run schema changes locally with wrangler instead.`,
  );
};

export const generateSQLiteDrizzleJson = unavailable(
  "generateSQLiteDrizzleJson",
);
export const generateSQLiteMigration = unavailable("generateSQLiteMigration");
export const pushSQLiteSchema = unavailable("pushSQLiteSchema");
