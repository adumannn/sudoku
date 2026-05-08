// lib/kanji-bank.ts
import type { KanjiEntry } from "@/lib/seal/types";

/**
 * Curated bank of evocative kanji. Themes are advisory (no UI surface in v1)
 * and used by the seed script to ensure variety across consecutive days.
 *
 * Starter set — extend with Joyo kanji (target: ~600 entries) before public launch.
 * Reserved kanji for solstices/equinoxes/year-boundary are listed in RESERVED.
 */
export const KANJI_BANK: KanjiEntry[] = [
  { kanji: "月", romaji: "tsuki",  meaning: "moon",     themes: ["sky", "weekday"] },
  { kanji: "火", romaji: "hi",     meaning: "fire",     themes: ["element", "weekday"] },
  { kanji: "水", romaji: "mizu",   meaning: "water",    themes: ["element", "weekday"] },
  { kanji: "木", romaji: "ki",     meaning: "tree",     themes: ["nature", "weekday"] },
  { kanji: "金", romaji: "kane",   meaning: "metal",    themes: ["element", "weekday"] },
  { kanji: "土", romaji: "tsuchi", meaning: "earth",    themes: ["element", "weekday"] },
  { kanji: "日", romaji: "hi",     meaning: "sun",      themes: ["sky", "weekday"] },
  { kanji: "山", romaji: "yama",   meaning: "mountain", themes: ["nature"] },
  { kanji: "川", romaji: "kawa",   meaning: "river",    themes: ["nature"] },
  { kanji: "海", romaji: "umi",    meaning: "sea",      themes: ["nature"] },
  { kanji: "空", romaji: "sora",   meaning: "sky",      themes: ["sky"] },
  { kanji: "雲", romaji: "kumo",   meaning: "cloud",    themes: ["sky"] },
  { kanji: "雨", romaji: "ame",    meaning: "rain",     themes: ["weather"] },
  { kanji: "雪", romaji: "yuki",   meaning: "snow",     themes: ["weather", "winter"] },
  { kanji: "風", romaji: "kaze",   meaning: "wind",     themes: ["weather"] },
  { kanji: "花", romaji: "hana",   meaning: "flower",   themes: ["nature", "spring"] },
  { kanji: "葉", romaji: "ha",     meaning: "leaf",     themes: ["nature"] },
  { kanji: "鳥", romaji: "tori",   meaning: "bird",     themes: ["nature"] },
  { kanji: "石", romaji: "ishi",   meaning: "stone",    themes: ["nature"] },
  { kanji: "光", romaji: "hikari", meaning: "light",    themes: ["abstract"] },
  { kanji: "影", romaji: "kage",   meaning: "shadow",   themes: ["abstract"] },
  { kanji: "朝", romaji: "asa",    meaning: "morning",  themes: ["time"] },
  { kanji: "夜", romaji: "yoru",   meaning: "night",    themes: ["time"] },
  { kanji: "星", romaji: "hoshi",  meaning: "star",     themes: ["sky"] },
  { kanji: "音", romaji: "oto",    meaning: "sound",    themes: ["abstract"] },
  { kanji: "道", romaji: "michi",  meaning: "path",     themes: ["abstract"] },
  { kanji: "心", romaji: "kokoro", meaning: "heart",    themes: ["abstract"] },
  { kanji: "気", romaji: "ki",     meaning: "spirit",   themes: ["abstract"] },
  { kanji: "力", romaji: "chikara",meaning: "strength", themes: ["abstract"] },
  { kanji: "白", romaji: "shiro",  meaning: "white",    themes: ["color"] },
  { kanji: "黒", romaji: "kuro",   meaning: "black",    themes: ["color"] },
  { kanji: "赤", romaji: "aka",    meaning: "red",      themes: ["color"] },
  { kanji: "青", romaji: "ao",     meaning: "blue",     themes: ["color"] },
  { kanji: "古", romaji: "furu",   meaning: "old",      themes: ["abstract"] },
  { kanji: "新", romaji: "atara",  meaning: "new",      themes: ["abstract"] },
  { kanji: "静", romaji: "shizu",  meaning: "quiet",    themes: ["abstract"] },
  { kanji: "動", romaji: "dou",    meaning: "moving",   themes: ["abstract"] },
  { kanji: "東", romaji: "higashi",meaning: "east",     themes: ["direction"] },
  { kanji: "西", romaji: "nishi",  meaning: "west",     themes: ["direction"] },
  { kanji: "南", romaji: "minami", meaning: "south",    themes: ["direction"] },
  { kanji: "北", romaji: "kita",   meaning: "north",    themes: ["direction"] },
  { kanji: "松", romaji: "matsu",  meaning: "pine",     themes: ["nature"] },
  { kanji: "竹", romaji: "take",   meaning: "bamboo",   themes: ["nature"] },
  { kanji: "梅", romaji: "ume",    meaning: "plum",     themes: ["nature", "spring"] },
  { kanji: "茶", romaji: "cha",    meaning: "tea",      themes: ["culture"] },
  { kanji: "禅", romaji: "zen",    meaning: "zen",      themes: ["culture"] },
  { kanji: "和", romaji: "wa",     meaning: "harmony",  themes: ["abstract"] },
  { kanji: "間", romaji: "ma",     meaning: "interval", themes: ["abstract"] },
  { kanji: "美", romaji: "bi",     meaning: "beauty",   themes: ["abstract"] },
  { kanji: "真", romaji: "shin",   meaning: "truth",    themes: ["abstract"] },
  { kanji: "誠", romaji: "makoto", meaning: "sincerity",themes: ["abstract"] },
  { kanji: "勇", romaji: "yuu",    meaning: "courage",  themes: ["abstract"] },
  { kanji: "希", romaji: "ki",     meaning: "hope",     themes: ["abstract"] },
  { kanji: "信", romaji: "shin",   meaning: "trust",    themes: ["abstract"] },
  { kanji: "知", romaji: "chi",    meaning: "knowing",  themes: ["abstract"] },
  { kanji: "学", romaji: "gaku",   meaning: "study",    themes: ["abstract"] },
  { kanji: "書", romaji: "sho",    meaning: "writing",  themes: ["culture"] },
  { kanji: "歌", romaji: "uta",    meaning: "song",     themes: ["culture"] },
  { kanji: "夢", romaji: "yume",   meaning: "dream",    themes: ["abstract"] },
  { kanji: "歩", romaji: "aru",    meaning: "walk",     themes: ["motion"] },
  // TODO: extend to ~600 entries from a Joyo kanji list before launch.
];

/** Reserved fixtures for special calendar dates. */
export const RESERVED: { monthDay: string; entry: KanjiEntry }[] = [
  { monthDay: "01-01", entry: { kanji: "元", romaji: "gen",     meaning: "origin",      themes: ["new-year"] } },
  { monthDay: "03-20", entry: { kanji: "春", romaji: "haru",    meaning: "spring",      themes: ["season"] } },
  { monthDay: "06-21", entry: { kanji: "夏", romaji: "natsu",   meaning: "summer",      themes: ["season"] } },
  { monthDay: "09-22", entry: { kanji: "秋", romaji: "aki",     meaning: "autumn",      themes: ["season"] } },
  { monthDay: "12-21", entry: { kanji: "冬", romaji: "fuyu",    meaning: "winter",      themes: ["season"] } },
];

export function findReserved(date: string): KanjiEntry | null {
  const md = date.slice(5); // 'MM-DD'
  return RESERVED.find((r) => r.monthDay === md)?.entry ?? null;
}
