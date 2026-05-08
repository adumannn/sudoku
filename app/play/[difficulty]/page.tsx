import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { GameShell } from "@/components/game/GameShell";
import { Difficulty } from "@/lib/sudoku/types";

const VALID = ["easy", "medium", "hard", "expert"] as const;

export default async function Page({ params }: { params: { difficulty: string } }) {
  if (!VALID.includes(params.difficulty as Difficulty)) notFound();
  const sb = createServerClient();
  const { data } = await sb
    .from("puzzles")
    .select("id,givens,solution")
    .eq("difficulty", params.difficulty)
    .order("created_at", { ascending: false })
    .limit(50);
  if (!data?.length) notFound();
  const pick = data[Math.floor(Math.random() * data.length)];
  return <GameShell difficulty={params.difficulty as Difficulty} puzzle={pick} />;
}
