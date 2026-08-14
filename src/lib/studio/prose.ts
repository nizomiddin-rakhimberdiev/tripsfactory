/**
 * The mechanical slips a browser's spell checker does not catch.
 *
 * The browser marks a misspelled word — that is what `lang` and `spellCheck`
 * on the fields are for, and it does that job better than anything shipped
 * here could. What it says nothing about is the punctuation damage that
 * arrives with copied and machine-translated copy: a doubled word across a
 * line break, two spaces where an editor pasted, a comma with a space in
 * front of it, a sentence starting lowercase.
 *
 * Every one of these is a warning, never a block. They are heuristics about
 * English prose, and prose has exceptions — a title in Title Case, a brand
 * written oddly on purpose. The editor decides; this only points.
 */
export type ProseWarning = { message: string; sample?: string };

/** Words that legitimately repeat in English, so they are not flagged. */
const MAY_REPEAT = new Set(["had", "that", "no", "very", "long", "far"]);

/** Abbreviations that end in a full stop without ending a sentence. */
const ABBREVIATIONS = /\b(?:mr|mrs|ms|dr|prof|st|no|vs|etc|e\.g|i\.e|approx)\.$/i;

export function proseWarnings(text: string): ProseWarning[] {
  const found: ProseWarning[] = [];
  if (!text.trim()) return found;

  const doubled = /\b(\w+)\s+\1\b/i.exec(text);
  if (doubled && !MAY_REPEAT.has(doubled[1].toLowerCase())) {
    found.push({
      message: "So'z takrorlangan",
      sample: doubled[0],
    });
  }

  if (/[^\n] {2,}\S/.test(text)) {
    found.push({ message: "Ikki marta bo'sh joy" });
  }

  const spaceBefore = /\s+([,.;:!?])/.exec(text);
  if (spaceBefore) {
    found.push({
      message: "Tinish belgisidan oldin bo'sh joy",
      sample: spaceBefore[1],
    });
  }

  // "word,word" — a missing space after punctuation. Decimals and times are
  // excluded by requiring a letter on both sides.
  const noSpaceAfter = /[a-z]([,;:])[a-z]/i.exec(text);
  if (noSpaceAfter) {
    found.push({
      message: "Tinish belgisidan keyin bo'sh joy yo'q",
      sample: noSpaceAfter[0],
    });
  }

  // Sentence starts. Split on a full stop followed by whitespace, ignoring the
  // abbreviations above so "Dr. Karimov" is not read as two sentences.
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;
    const previous = i > 0 ? sentences[i - 1].trim() : "";
    if (previous && ABBREVIATIONS.test(previous)) continue;
    const first = sentence[0];
    if (/[a-z]/.test(first)) {
      found.push({
        message: "Gap kichik harf bilan boshlangan",
        sample: sentence.slice(0, 28) + (sentence.length > 28 ? "…" : ""),
      });
      break;
    }
  }

  if (/\s$/.test(text) || /^\s/.test(text)) {
    found.push({ message: "Boshida yoki oxirida ortiqcha bo'sh joy" });
  }

  return found;
}
