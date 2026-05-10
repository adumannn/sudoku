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

function writeWav(samples: Float32Array, filePath: string): void {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (SAMPLE_RATE * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

function encodeMp3(wavPath: string, mp3Path: string): void {
  // Encode to a temp .mp3 first, then rename — so a mid-encode failure
  // can't leave a truncated file at the destination path.
  const tmpMp3 = path.join(os.tmpdir(), `sudoku-sfx-${path.basename(mp3Path)}.tmp.mp3`);
  const result = spawnSync(
    "ffmpeg",
    ["-y", "-i", wavPath, "-codec:a", "libmp3lame", "-b:a", "128k", "-ac", "1", tmpMp3],
    { stdio: "pipe" },
  );
  if (result.status !== 0) {
    console.error(result.stderr?.toString() ?? "ffmpeg failed");
    try {
      fs.unlinkSync(tmpMp3);
    } catch {}
    process.exit(1);
  }
  fs.renameSync(tmpMp3, mp3Path);
}

function render(name: string, samples: Float32Array): void {
  const wavPath = path.join(os.tmpdir(), `sudoku-sfx-${name}.wav`);
  const mp3Path = path.join(SFX_DIR, `${name}.mp3`);
  writeWav(samples, wavPath);
  encodeMp3(wavPath, mp3Path);
  fs.unlinkSync(wavPath);
  const sizeKb = (fs.statSync(mp3Path).size / 1024).toFixed(1);
  console.log(`generated ${path.relative(process.cwd(), mp3Path)} (${sizeKb} KB)`);
}

function makePlace(): Float32Array {
  const dur = 0.09;
  // Bandpassed noise at ~1.2kHz gives the dry "tock" attack.
  const click = expDecay(bandpass(noise(dur), 1200, 4), 0.008);
  // 220Hz sine adds wooden body under the click.
  const body = expDecay(sine(220, dur), 0.020);
  return normalize(
    mix([
      { samples: click, gain: 0.4 },
      { samples: body, gain: 0.6 },
    ]),
  );
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
  render("place", makePlace());
}

main();
