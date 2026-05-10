# SFX synthesis — go-stone + temple bell

**Date:** 2026-05-11
**Status:** approved (design)

## Problem

The SFX system is fully wired (toggle in `/account`, `playSfx` calls in [NumberPad.tsx:51](../../../components/game/NumberPad.tsx) and [WinModal.tsx:48](../../../components/game/WinModal.tsx), preference persisted on `profiles.sfx_enabled`), but the audio assets in [public/sfx/](../../../public/sfx/) are placeholder stubs (≤6KB MP3s). Searching free SFX libraries for three cues that feel like a coherent set hasn't worked. We need real audio that matches the app's Japanese-zen aesthetic (kanji difficulty, ink-wash, sumi/bone palette).

## Approach

Synthesize all three cues programmatically with a self-contained Node script. The recipe is committed as code, so we can tune timbres by editing constants instead of re-searching libraries. Output overwrites the existing files at the existing paths — no changes to runtime code.

### Why synthesis over curation or AI generation
- **vs. library curation**: searching has already failed; matching a coherent feel across three cues is what synthesis gives us by design (shared parameters).
- **vs. AI sound models** (ElevenLabs etc.): roll-of-the-dice output, requires API access, not reproducible across runs.

### Why a self-contained script over an audio library
- The script is generator-only, run on demand. Carrying a heavyweight runtime audio dep in `package.json` for a one-shot tool is unjustified.
- Pure-JS synthesis (sine sums, filtered noise, exponential envelopes) is ~150 lines and stays inspectable.

## Aesthetic direction

**Go stone + temple bell.**

| Cue | Feel | Trigger |
| --- | --- | --- |
| `place` | tight wooden knock — a go stone hitting a kaya board | every number entry on the pad/keyboard |
| `solve-thunk` | mallet contact on bronze — short woody attack | 400ms after solve |
| `solve-tone` | temple-bell resonance — slow inharmonic decay | 600ms after solve (200ms after thunk) |

The 200ms thunk→tone gap is set in [WinModal.tsx:48-49](../../../components/game/WinModal.tsx) and is preserved.

## Architecture

### New file: `scripts/generate-sfx.ts`

Single-file generator. Run via a new npm script: `npm run generate-sfx` (`tsx scripts/generate-sfx.ts`).

**Synthesis primitives** (top of file, pure JS, no deps):

- `sine(freq: number, durSec: number, sampleRate = 44100): Float32Array`
- `noise(durSec: number, sampleRate = 44100): Float32Array` — uniform white noise, [-1, 1]
- `bandpass(samples: Float32Array, centerHz: number, Q: number, sampleRate = 44100): Float32Array` — biquad bandpass
- `expDecay(samples: Float32Array, tauSec: number, sampleRate = 44100): Float32Array` — multiplies samples by `exp(-t/tau)`
- `mix(layers: Array<{ samples: Float32Array; gain: number }>): Float32Array` — sum to longest, then return
- `normalize(samples: Float32Array, peak = 0.95): Float32Array` — scale so max-abs == `peak`

**Recipe functions** (one per cue):

```ts
function makePlace(): Float32Array { /* …recipe… */ }
function makeSolveThunk(): Float32Array { /* …recipe… */ }
function makeSolveTone(): Float32Array { /* …recipe… */ }
```

Each is a self-contained recipe that calls the primitives. Tunable constants live inside the function with one-line comments where the value is non-obvious (e.g. why a particular partial frequency was chosen).

**WAV writer** (~30 lines, no deps): 16-bit PCM, 44.1kHz, mono. Writes a temp `.wav` to `os.tmpdir()`.

**MP3 encoding**: shells out to `ffmpeg` via `child_process.spawnSync`. Preflight check on startup runs `ffmpeg -version`; if it errors, the script exits with a clear message ("install ffmpeg, e.g. `brew install ffmpeg`") and exit code 1.

**Output**: overwrites `public/sfx/place.mp3`, `public/sfx/solve-thunk.mp3`, `public/sfx/solve-tone.mp3`. Bitrate `-b:a 128k`, mono.

### `package.json` change

Add to `scripts`:
```json
"generate-sfx": "tsx scripts/generate-sfx.ts"
```

### Runtime code changes

**None.** [lib/sfx/index.ts](../../../lib/sfx/index.ts) already references the three paths with playback volumes 0.28 / 0.36 / 0.24. The script normalizes synthesis output to peak ~0.95 so the existing per-cue volumes give the intended balance.

## Sound recipes

### `place` — go-stone knock (~90ms)

| Layer | Source | Filter | Envelope | Gain |
| --- | --- | --- | --- | --- |
| Click | white noise, 90ms | bandpass 1.2kHz Q=4 | exp decay τ=8ms | 0.4 |
| Body | sine 220Hz, 90ms | — | exp decay τ=20ms | 0.6 |

Mix → normalize to 0.95.

The bandpass on the noise gives the dry "tock" attack; the 220Hz sine adds wooden body. Total length 90ms balances "hear it on every keystroke" against "not annoying when typing fast."

### `solve-thunk` — mallet on bronze (~250ms)

| Layer | Source | Filter | Envelope | Gain |
| --- | --- | --- | --- | --- |
| Strike | white noise, 250ms | bandpass 1.6kHz Q=2 | exp decay τ=25ms | 0.5 |
| Body | sum of sines at 320, 540, 720 Hz (each detuned ±1Hz random) | — | exp decay τ=60ms | 0.5 |

Mix → normalize to 0.95.

The bandpassed noise is the mallet's contact transient. The three sine partials are inharmonic (not integer multiples) — that's what gives metallic strikes their character vs. a clean tonal hit. Slight detune randomization keeps successive plays from sounding identical.

### `solve-tone` — temple-bell hum (~1.4s)

| Partial | Frequency | Decay τ | Detune | Gain |
| --- | --- | --- | --- | --- |
| Hum | 220 Hz | 0.5s | +0 cents | 1.0 |
| Strike | 440 Hz | 0.3s | -2 cents | 0.7 |
| Tierce | 528 Hz | 0.25s | +2 cents | 0.5 |
| Quint | 660 Hz | 0.15s | -1 cents | 0.35 |

Sum → normalize to 0.95. Total render length 1.4s.

The 528Hz tierce is a minor third above 440Hz — temple bells (bonshō) characteristically have a minor-third overtone above the strike, which gives the "haunted" quality. Per-partial decay times taper from longest (hum) to shortest (high partials), so the tone darkens as it rings out.

## Tuning workflow

1. `npm run generate-sfx` — generates the three MP3s.
2. Open the dev server (`npm run dev`), enable SFX in `/account`, play a number / solve a puzzle.
3. If something's off, edit the constants in `scripts/generate-sfx.ts` and re-run step 1.
4. Once the cues feel right, commit the regenerated MP3s alongside the updated script.

The script is deterministic except for the small detune randomization in `solve-thunk`. To make it fully deterministic, we can seed `Math.random` — but the variance is small and arguably desirable (each thunk is slightly different, like a real strike).

## Error handling

- **`ffmpeg` missing**: preflight `ffmpeg -version` fails → script prints install instruction and exits 1.
- **`public/sfx/` missing**: `mkdirSync(..., { recursive: true })` before writes.
- **Encode failure** (ffmpeg returns non-zero): print stderr, exit 1, don't leave half-written files (write to a temp path then rename on success).

## Testing

The synthesis script doesn't need new automated tests — the existing `tests/sfx/playSfx.test.ts` already covers the runtime layer and is unaffected (file paths and behavior unchanged). Verification is manual:

1. Run `npm run generate-sfx`.
2. Boot dev server, log in, enable SFX toggle, play a puzzle, verify all three cues fire and sound right.
3. Run `npm test` to confirm no regressions in the existing SFX tests.

If we wanted automated coverage of the script itself, we'd compare RMS / spectral-centroid features against committed snapshots — but that's overkill for a 3-cue, manually-tuned generator. Skip.

## Out of scope

- Adding new cue types (errors, hint, undo, pause). Existing toggle and three cues only.
- Changing the file format from MP3 to WAV/OGG.
- Default-on for new accounts (currently `default false` in [migration 0008](../../../supabase/migrations/0008_skins_tables.sql)).
- Anonymous-user SFX (currently gated to signed-in via `getSfxEnabledServer`).
- Per-skin SFX variants.
