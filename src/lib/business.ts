/**
 * The operator's real-world details, in one place.
 *
 * These appear in five unrelated surfaces — the contact page, the footer, the
 * privacy policy, the terms, and the schema.org organisation block. Keeping one
 * copy means a changed phone number is a one-line edit rather than a hunt, and
 * that the machine-readable claims can never drift from the visible ones.
 *
 * Everything here was supplied by the business. Nothing is derived or guessed:
 * if a field is absent below it is because the value is not known, and the code
 * that consumes it omits the field rather than inventing one.
 */

/** Registered entity. Used where a legal name is required, not for marketing. */
export const LEGAL_NAME = "ООО TRIPS FACTORY";

/** Trading name, used everywhere the visitor sees us. */
export const BRAND_NAME = "TripsFactory";

/**
 * Primary number, Tashkent.
 *
 * A later message gave this as +99888269775 — eight digits after the country
 * code where an Uzbek mobile has nine, so it is a dropped character rather than
 * a different line. The nine-digit form supplied first is kept until confirmed;
 * a phone number that does not connect is worse on a contact page than none.
 */
export const PHONE = {
  /** E.164, for tel: links — no spaces, the form a dialler expects. */
  href: "+998882697755",
  /** Grouped for reading. */
  display: "+998 88 269 77 55",
};

/** Second line, UAE. */
export const PHONE_AE = {
  href: "+971555413508",
  display: "+971 55 541 3508",
};

/** Taxpayer identification number (ИНН), shown where a legal identity is due. */
export const TAX_ID = "312944685";

export const EMAIL = "sales@tripsfactory.com";

export const TELEGRAM = "https://t.me/tripsfactory_uzb";

/**
 * Opening hours as stated by the business. Days were not specified, so no
 * openingHoursSpecification is emitted in structured data — claiming a
 * seven-day week we were never told about would be a fabrication, and Google
 * shows opening hours to people deciding whether to call right now.
 */
export const HOURS = { from: "09:00", to: "19:00", timezone: "Asia/Tashkent" };

export const ADDRESS = {
  street: "Podshobog MFY, Sayohat ko'chasi, berk ko'chasi, 2-uy",
  district: "Mirzo Ulugbek tumani",
  city: "Toshkent shahri",
  countryCode: "UZ",
};

export const ADDRESS_LINE = [
  ADDRESS.street,
  ADDRESS.district,
  ADDRESS.city,
].join(", ");

/**
 * Public profiles, for schema.org `sameAs` and the footer.
 *
 * The Instagram URLs arrived with `?igsh=` share tokens attached — those
 * identify the share session that produced the link, not the profile, and they
 * do not belong in a canonical reference. Stripped.
 */
export const SOCIAL = [
  { label: "Instagram", url: "https://www.instagram.com/tripsfactory.uz" },
  { label: "Telegram", url: TELEGRAM },
  { label: "YouTube", url: "https://www.youtube.com/@TripsFactory" },
] as const;

/**
 * Every profile the business runs, including the second Instagram account,
 * which is listed here but not in the footer — `sameAs` is where a search
 * engine reconciles identities, and more is better; a footer with two entries
 * both labelled "Instagram" only makes a visitor hesitate.
 */
export const SAME_AS = [
  "https://www.instagram.com/tripsfactory.uz",
  "https://www.instagram.com/tripsfactory_tours",
  TELEGRAM,
  "https://www.youtube.com/@TripsFactory",
];
