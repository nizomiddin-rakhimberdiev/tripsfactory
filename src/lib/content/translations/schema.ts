/**
 * Shape of a per-locale content translation overlay.
 * Files live at translations/{locale}.json and are produced by
 * `npm run translate` (AI pipeline) or hand-edited (reviewed translations).
 * Missing keys fall back to the EN base content.
 */
export interface TranslationOverlay {
  regions?: Record<string, { name?: string }>;
  countries?: Record<string, { name?: string; intro?: string }>;
  cities?: Record<
    string,
    { intro?: string; attractions?: string[] }
  >;
  tours?: Record<
    string,
    {
      title?: string;
      summary?: string;
      itinerary?: { title?: string; description?: string }[];
      included?: string[];
      excluded?: string[];
    }
  >;
  guides?: Record<
    string,
    { title?: string; sections?: { heading?: string; body?: string }[] }
  >;
}
