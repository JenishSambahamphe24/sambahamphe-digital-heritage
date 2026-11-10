const CONSONANTS: Record<string, string> = {
  क: "k",
  ख: "kh",
  ग: "g",
  घ: "gh",
  ङ: "ng",
  च: "ch",
  छ: "chh",
  ज: "j",
  झ: "jh",
  ञ: "ny",
  ट: "t",
  ठ: "th",
  ड: "d",
  ढ: "dh",
  ण: "n",
  त: "t",
  थ: "th",
  द: "d",
  ध: "dh",
  न: "n",
  प: "p",
  फ: "ph",
  ब: "b",
  भ: "bh",
  म: "m",
  य: "y",
  र: "r",
  ल: "l",
  व: "w",
  श: "sh",
  ष: "sh",
  स: "s",
  ह: "h",
};
const VOWELS: Record<string, string> = {
  अ: "a",
  आ: "a",
  इ: "i",
  ई: "i",
  उ: "u",
  ऊ: "u",
  ऋ: "ri",
  ए: "e",
  ऐ: "ai",
  ओ: "o",
  औ: "au",
};
const MATRAS: Record<string, string> = {
  "ा": "a",
  "ि": "i",
  "ी": "i",
  "ु": "u",
  "ू": "u",
  "ृ": "ri",
  "े": "e",
  "ै": "ai",
  "ो": "o",
  "ौ": "au",
};
const NASALS: Record<string, string> = { "ं": "n", "ँ": "n", "ः": "h" };
const VIRAMA = "्";
const NUKTA = "़";
const DEVANAGARI_ZERO = 0x0966;

// A loose Latin form for search, not a scholarly transliteration: "सम्बाहाङ्फे"
// becomes "sambahangphe", close enough for trigram matching against
// "Sambahamphe". Limbu-script names fall back to their written form.
export class RomanizationHelper {
  static romanize(text: string): string {
    const latin = RomanizationHelper.fromDevanagari(text.normalize("NFC"))
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return latin || text.trim().toLowerCase();
  }

  private static fromDevanagari(text: string): string {
    const chars = [...text].filter((char) => char !== NUKTA);
    let out = "";
    for (let index = 0; index < chars.length; index += 1) {
      const char = chars[index] ?? "";
      const next = chars[index + 1];
      const consonant = CONSONANTS[char];
      if (consonant !== undefined) {
        out += consonant;
        const wordEnds = next === undefined || !RomanizationHelper.isDevanagari(next);
        const followedByMark =
          next !== undefined && (next === VIRAMA || MATRAS[next] !== undefined);
        // Nepali drops the inherent vowel at the end of a word: राम → "ram".
        if (!followedByMark && !(wordEnds && out.length > consonant.length)) {
          out += "a";
        }
        continue;
      }
      if (char === VIRAMA) {
        continue;
      }
      const code = char.codePointAt(0) ?? 0;
      if (code >= DEVANAGARI_ZERO && code <= DEVANAGARI_ZERO + 9) {
        out += String(code - DEVANAGARI_ZERO);
        continue;
      }
      out += VOWELS[char] ?? MATRAS[char] ?? NASALS[char] ?? char;
    }
    return out;
  }

  private static isDevanagari(char: string): boolean {
    const code = char.codePointAt(0) ?? 0;
    return code >= 0x0900 && code <= 0x097f;
  }
}
