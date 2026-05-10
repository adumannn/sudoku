export type SfxName = "place" | "solve-thunk" | "solve-tone";

type SfxConfig = {
  src: string;
  volume: number;
};

const SFX: Record<SfxName, SfxConfig> = {
  place: { src: "/sfx/place.mp3", volume: 0.28 },
  "solve-thunk": { src: "/sfx/solve-thunk.mp3", volume: 0.36 },
  "solve-tone": { src: "/sfx/solve-tone.mp3", volume: 0.24 },
};

const SFX_NAMES = Object.keys(SFX) as SfxName[];

let sfxEnabled = false;
let cache: Partial<Record<SfxName, HTMLAudioElement>> = {};

function canUseAudio(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function getAudio(name: SfxName): HTMLAudioElement | null {
  if (!canUseAudio()) return null;
  const existing = cache[name];
  if (existing) return existing;

  const config = SFX[name];
  const audio = new Audio(config.src);
  audio.preload = "auto";
  audio.volume = config.volume;
  cache[name] = audio;
  return audio;
}

export function setSfxEnabled(next: boolean): void {
  sfxEnabled = next;
}

export function getSfxEnabled(): boolean {
  return sfxEnabled;
}

export function preloadSfx(names: SfxName[] = SFX_NAMES): void {
  if (!sfxEnabled) return;
  for (const name of names) getAudio(name);
}

export function playSfx(name: SfxName): boolean {
  if (!sfxEnabled) return false;

  const audio = getAudio(name);
  if (!audio) return false;

  audio.currentTime = 0;
  const result = audio.play();
  if (result && typeof result.catch === "function") {
    void result.catch(() => {});
  }
  return true;
}

export function __resetSfxForTests(): void {
  sfxEnabled = false;
  cache = {};
}
