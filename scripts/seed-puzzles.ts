import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { generate } from "../lib/sudoku/generator";
import { dateSeed } from "../lib/sudoku/seed";
import { DIFFICULTY } from "../lib/sudoku/difficulty";
import { Difficulty } from "../lib/sudoku/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) { console.error("Missing Supabase env"); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

const diffs: Difficulty[] = ["easy", "medium", "hard", "expert"];

async function seedPuzzles() {
  for (const diff of diffs) {
    const rows: any[] = [];
    for (let i = 0; i < 50; i++) {
      const seed = Math.floor(Math.random() * 2 ** 31);
      const { givens, solution } = generate(diff, seed);
      const clues = givens.split("").filter((c) => c !== "0").length;
      rows.push({ difficulty: diff, givens, solution, clues });
      process.stdout.write(`.`);
    }
    const { error } = await sb.from("puzzles").insert(rows);
    if (error) throw error;
    console.log(` ${diff}: 50 inserted`);
  }
}

async function seedDailies() {
  const rows: any[] = [];
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const dailyDifficulties: Difficulty[] = ["easy","medium","medium","hard","hard","expert","easy"];
  for (let d = 0; d < 30; d++) {
    const date = new Date(today); date.setUTCDate(date.getUTCDate() + d);
    const iso = date.toISOString().slice(0, 10);
    const diff = dailyDifficulties[d % 7];
    const { givens, solution } = generate(diff, dateSeed(iso));
    rows.push({ date: iso, givens, solution, difficulty: diff, min_seconds: DIFFICULTY[diff].minSeconds });
    process.stdout.write(`.`);
  }
  const { error } = await sb.from("daily_puzzles").insert(rows);
  if (error) throw error;
  console.log(" 30 daily challenges inserted");
}

(async () => {
  await seedPuzzles();
  await seedDailies();
  console.log("Done.");
})().catch((e) => { console.error(e); process.exit(1); });
