/** Send one write per locale (Payload stores localized fields per locale). */
export async function sendPerLocale(
  method: "PATCH" | "POST",
  endpoint: string,
  bodies: Record<string, unknown>,
): Promise<boolean> {
  const results = await Promise.all(
    Object.entries(bodies).map(([loc, body]) =>
      fetch(`${endpoint}?locale=${loc}&depth=0`, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }),
    ),
  );
  return results.every((r) => r.ok);
}
