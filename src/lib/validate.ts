/**
 * The rules the booking form and the API both apply.
 *
 * One file rather than two implementations, because a form that accepts what
 * the server rejects is worse than no validation: the visitor is told nothing
 * is wrong and then the request fails at the end. Everything here runs in both
 * places.
 */

/**
 * A phone number, internationally.
 *
 * Guests are Japanese, German, Spanish — a rule built around +998 would turn
 * away the people this is for. So: strip everything a person might type for
 * readability, then check what is left against E.164, which is the actual
 * standard the world's numbers are issued under. Between 8 and 15 digits, and
 * the first one is never zero.
 *
 *   +998 90 123 45 67   →  998901234567    ✓
 *   +1 (555) 123-4567   →  15551234567     ✓
 *   +49 30 901820       →  4930901820      ✓
 *   901234              →  too short       ✗
 *   +0 123 456 789      →  leading zero    ✗
 */
const PHONE_NOISE = /[\s\-(). ‐-―]/g;
const E164 = /^\+?[1-9]\d{7,14}$/;

export function normalizePhone(value: string): string {
  return value.trim().replace(PHONE_NOISE, "");
}

export function isValidPhone(value: string): boolean {
  return E164.test(normalizePhone(value));
}

/**
 * An email address.
 *
 * Deliberately not the RFC — that grammar accepts things no mail server does
 * and rejecting a real address is the expensive mistake. This asks for the
 * shape a person recognises: something, an @, a domain with a dot in it, and
 * no spaces anywhere.
 */
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= 200 && EMAIL.test(trimmed);
}

/** The most a booking form will take before it becomes a conversation. */
export const MAX_GUESTS = 100;

/** Where the dropdown stops and the free field begins. */
export const GUESTS_DROPDOWN_MAX = 10;

export function isValidGuests(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= MAX_GUESTS;
}
