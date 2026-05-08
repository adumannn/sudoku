// Convert a positive integer (0..9999) to its sino-japanese reading.
// Used in the masthead streak ("二十一日") and other ornamental numbers.
const DIGITS = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

export function kanjiNum(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "〇";
  n = Math.floor(n);
  if (n === 0) return DIGITS[0];
  if (n < 10) return DIGITS[n];
  if (n < 20) return n === 10 ? "十" : `十${DIGITS[n - 10]}`;
  if (n < 100) {
    const t = Math.floor(n / 10);
    const r = n % 10;
    const tens = t === 1 ? "十" : `${DIGITS[t]}十`;
    return r === 0 ? tens : `${tens}${DIGITS[r]}`;
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    const hund = h === 1 ? "百" : `${DIGITS[h]}百`;
    return r === 0 ? hund : `${hund}${kanjiNum(r)}`;
  }
  const k = Math.floor(n / 1000);
  const r = n % 1000;
  const thou = k === 1 ? "千" : `${DIGITS[k]}千`;
  return r === 0 ? thou : `${thou}${kanjiNum(r)}`;
}

const WEEKDAY_JP = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
const WEEKDAY_EN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function dateLine(d = new Date()): string {
  const jp = WEEKDAY_JP[d.getDay()];
  const en = WEEKDAY_EN[d.getDay()];
  const day = d.getDate();
  const month = d
    .toLocaleString("en-US", { month: "long" })
    .toLowerCase();
  return `${jp} · ${en} · ${day} ${month} · ${d.getFullYear()}`;
}
