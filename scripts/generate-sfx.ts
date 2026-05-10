import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const SAMPLE_RATE = 44100;
const SFX_DIR = path.join(process.cwd(), "public", "sfx");

function sine(freq: number, durSec: number): Float32Array {
  const n = Math.round(durSec * SAMPLE_RATE);
  const out = new Float32Array(n);
  const omega = (2 * Math.PI * freq) / SAMPLE_RATE;
  for (let i = 0; i < n; i++) out[i] = Math.sin(omega * i);
  return out;
}

function noise(durSec: number): Float32Array {
  const n = Math.round(durSec * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.random() * 2 - 1;
  return out;
}

// RBJ biquad bandpass (constant-peak-gain form). Q is the bandwidth control:
// higher Q = narrower band. Coefficients applied as direct-form-I.
function bandpass(samples: Float32Array, centerHz: number, Q: number): Float32Array {
  const omega = (2 * Math.PI * centerHz) / SAMPLE_RATE;
  const sn = Math.sin(omega);
  const cs = Math.cos(omega);
  const alpha = sn / (2 * Q);

  const b0 = alpha;
  const b1 = 0;
  const b2 = -alpha;
  const a0 = 1 + alpha;
  const a1 = -2 * cs;
  const a2 = 1 - alpha;

  const out = new Float32Array(samples.length);
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const x0 = samples[i];
    const y0 =
      (b0 / a0) * x0 +
      (b1 / a0) * x1 +
      (b2 / a0) * x2 -
      (a1 / a0) * y1 -
      (a2 / a0) * y2;
    out[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return out;
}

function expDecay(samples: Float32Array, tauSec: number): Float32Array {
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    out[i] = samples[i] * Math.exp(-t / tauSec);
  }
  return out;
}

function mix(layers: Array<{ samples: Float32Array; gain: number }>): Float32Array {
  let len = 0;
  for (const l of layers) if (l.samples.length > len) len = l.samples.length;
  const out = new Float32Array(len);
  for (const { samples, gain } of layers) {
    for (let i = 0; i < samples.length; i++) out[i] += samples[i] * gain;
  }
  return out;
}

function normalize(samples: Float32Array, peak = 0.95): Float32Array {
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > max) max = a;
  }
  if (max === 0) return samples;
  const scale = peak / max;
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] * scale;
  return out;
}

function checkFfmpeg(): void {
  const result = spawnSync("ffmpeg", ["-version"], { stdio: "pipe" });
  if (result.error || result.status !== 0) {
    console.error("ffmpeg not found on PATH. Install it (e.g. `brew install ffmpeg`) and try again.");
    process.exit(1);
  }
}

function main(): void {
  checkFfmpeg();
  fs.mkdirSync(SFX_DIR, { recursive: true });

  // Self-check: build a 1-second 440Hz sine, normalize, verify length and peak.
  const probe = normalize(sine(440, 1.0));
  let maxAbs = 0;
  for (let i = 0; i < probe.length; i++) {
    const a = Math.abs(probe[i]);
    if (a > maxAbs) maxAbs = a;
  }
  console.log(
    `primitives ok: probe length=${probe.length} (expected ${SAMPLE_RATE}), peak=${maxAbs.toFixed(4)} (expected ~0.95)`,
  );
}

main();
