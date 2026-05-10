import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetSfxForTests,
  getSfxEnabled,
  playSfx,
  preloadSfx,
  setSfxEnabled,
} from "@/lib/sfx";

class AudioStub {
  static instances: AudioStub[] = [];
  static playImpl = vi.fn(() => Promise.resolve());
  src: string;
  preload = "";
  volume = 1;
  currentTime = 0;
  play = vi.fn(() => AudioStub.playImpl());

  constructor(src: string) {
    this.src = src;
    AudioStub.instances.push(this);
  }
}

describe("playSfx", () => {
  beforeEach(() => {
    AudioStub.instances = [];
    AudioStub.playImpl = vi.fn(() => Promise.resolve());
    vi.stubGlobal("Audio", AudioStub);
    __resetSfxForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    __resetSfxForTests();
  });

  it("defaults to muted and does not construct or play audio", () => {
    expect(getSfxEnabled()).toBe(false);
    expect(playSfx("place")).toBe(false);
    expect(AudioStub.instances).toHaveLength(0);
  });

  it("does not preload while muted", () => {
    preloadSfx();
    expect(AudioStub.instances).toHaveLength(0);
  });

  it("plays and rewinds the requested sound when enabled", () => {
    setSfxEnabled(true);

    expect(playSfx("place")).toBe(true);
    expect(AudioStub.instances).toHaveLength(1);
    expect(AudioStub.instances[0].src).toBe("/sfx/place.mp3");
    expect(AudioStub.instances[0].volume).toBe(0.28);
    expect(AudioStub.instances[0].currentTime).toBe(0);
    expect(AudioStub.instances[0].play).toHaveBeenCalledTimes(1);

    expect(playSfx("place")).toBe(true);
    expect(AudioStub.instances).toHaveLength(1);
    expect(AudioStub.instances[0].play).toHaveBeenCalledTimes(2);
  });

  it("returns false when enabled without browser Audio support", () => {
    vi.stubGlobal("Audio", undefined);
    setSfxEnabled(true);

    expect(playSfx("place")).toBe(false);
    expect(AudioStub.instances).toHaveLength(0);
  });

  it("swallows rejected play promises", async () => {
    const playError = new Error("blocked autoplay");
    AudioStub.playImpl = vi.fn(() => Promise.reject(playError));
    setSfxEnabled(true);

    expect(playSfx("place")).toBe(true);
    await Promise.resolve();

    expect(AudioStub.playImpl).toHaveBeenCalledTimes(1);
    expect(AudioStub.instances[0].play).toHaveBeenCalledTimes(1);
  });

  it("preloads all three sounds when enabled", () => {
    setSfxEnabled(true);
    preloadSfx();

    expect(AudioStub.instances.map((a) => a.src).sort()).toEqual([
      "/sfx/place.mp3",
      "/sfx/solve-thunk.mp3",
      "/sfx/solve-tone.mp3",
    ]);
  });
});
