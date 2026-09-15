const ROMAN_NUMERALS = [
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
];

const PRE_PRIMARY_RANKS: Record<string, number> = {
    NURSERY: 1,
    LKG: 2,
    UKG: 3,
};

/**
 * Maps a school's pedagogical class name (e.g. "NURSERY", "LKG", "UKG", "I".."XII")
 * to its canonical rank, so classes can be sorted correctly even when the names
 * aren't alphabetically ordered. Returns null for names that don't match a known
 * pattern (e.g. custom class names) — callers should append these at the end.
 */
export const getCanonicalClassRank = (name: string): number | null => {
    const normalized = name.trim().toUpperCase();

    if (normalized in PRE_PRIMARY_RANKS) {
        return PRE_PRIMARY_RANKS[normalized];
    }

    const romanIndex = ROMAN_NUMERALS.indexOf(normalized);
    if (romanIndex !== -1) {
        return PRE_PRIMARY_RANKS.UKG + 1 + romanIndex;
    }

    return null;
};
