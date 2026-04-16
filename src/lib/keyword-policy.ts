/**
 * Blocks sexual / adult-theme keywords. Date courses must stay public and family-friendly.
 */

export const COURSE_KEYWORD_BLOCKED_MESSAGE =
  "\ud0a4\uc6cc\ub4dc\uc5d0 \uc0ac\uc6a9\ud560 \uc218 \uc5c6\ub294 \ud45c\ud604\uc774 \ud3ec\ud568\ub418\uc5b4 \uc788\uc5b4\uc694. " +
  "\uc7a5\uc18c\u00b7\ubd84\uc704\uae30\u00b7\uc77c\uc815 \ubc00\ub3c4 \ub4f1 \ucf54\uc2a4\uc640 \uad00\ub828\ub41c \ub0b4\uc6a9\ub9cc \uc785\ub825\ud574 \uc8fc\uc138\uc694.";

const BANNED_KO_SUBSTRINGS = [
  "\uc139\uc2a4",
  "\uc131\uad00\uacc4",
  "\uc131\ub9e4\ub9e4",
  "\ub9e4\ucd98",
  "\ud3ec\ub978\ub178",
  "\uc57c\ub3d9",
  "\ub538\ub538\uc774",
  "\uc6d0\uc870\uad50\uc81c",
  "\ubb34\uc0ad\uc81c",
];

const BANNED_LATIN_REGEX =
  /\b(s+x+|s3x|seks|sex|porn|xxx|nsfw|fuck|fck|dick|cock|pussy|penis|vagina|nude|naked|blow\s*job|blowjob|anal|hentai|orgy|milf|dildo|deepthroat|cumshot|creampie)\b/i;

function foldForScan(s: string): string {
  return s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

export function isCourseKeywordBlocked(keyword: string): boolean {
  const t = keyword.trim();
  if (!t) return false;

  const compact = foldForScan(t);
  for (const sub of BANNED_KO_SUBSTRINGS) {
    const subC = foldForScan(sub);
    if (compact.includes(subC) || t.includes(sub)) {
      return true;
    }
  }

  if (BANNED_LATIN_REGEX.test(t)) {
    return true;
  }

  return false;
}
