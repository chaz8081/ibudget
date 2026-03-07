/**
 * Generate iBudget app icons — envelope with dollar sign on blue background.
 * Run: node scripts/generate-icons.js
 */
const { createCanvas } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

const BLUE = "#2563eb";
const LIGHT_BLUE = "#E6F4FE";
const WHITE = "#ffffff";

function drawIcon(ctx, size, { withBackground = true, monochrome = false } = {}) {
  const s = size; // shorthand
  const cx = s / 2;
  const cy = s / 2;

  // Background
  if (withBackground) {
    const radius = s * 0.18;
    ctx.beginPath();
    ctx.roundRect(0, 0, s, s, radius);
    ctx.fillStyle = BLUE;
    ctx.fill();
  }

  // Colors
  const envelopeColor = monochrome ? "#000000" : WHITE;
  const coinFill = monochrome ? "#000000" : WHITE;
  const coinStroke = monochrome ? "#000000" : BLUE;
  const dollarColor = monochrome ? "#ffffff" : BLUE;

  // Envelope body — centered, ~60% of canvas
  const envW = s * 0.56;
  const envH = s * 0.38;
  const envX = cx - envW / 2;
  const envY = cy - envH / 2 + s * 0.04; // slight down offset for visual center
  const envR = s * 0.03; // corner radius

  ctx.beginPath();
  ctx.roundRect(envX, envY, envW, envH, envR);
  ctx.fillStyle = envelopeColor;
  ctx.globalAlpha = monochrome ? 1 : 0.95;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Envelope flap (triangle from top of envelope)
  ctx.beginPath();
  ctx.moveTo(envX + envR, envY);
  ctx.lineTo(cx, envY + envH * 0.45);
  ctx.lineTo(envX + envW - envR, envY);
  ctx.closePath();
  ctx.fillStyle = envelopeColor;
  ctx.globalAlpha = monochrome ? 0.7 : 0.8;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Flap outline for depth
  ctx.beginPath();
  ctx.moveTo(envX + envR * 0.5, envY + envR * 0.5);
  ctx.lineTo(cx, envY + envH * 0.48);
  ctx.lineTo(envX + envW - envR * 0.5, envY + envR * 0.5);
  ctx.strokeStyle = withBackground ? BLUE : (monochrome ? "#333333" : BLUE);
  ctx.lineWidth = s * 0.012;
  ctx.globalAlpha = monochrome ? 0.3 : 0.35;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Coin circle — bottom-right of envelope
  const coinR = s * 0.12;
  const coinCX = envX + envW - coinR * 0.4;
  const coinCY = envY + envH - coinR * 0.3;

  ctx.beginPath();
  ctx.arc(coinCX, coinCY, coinR, 0, Math.PI * 2);
  ctx.fillStyle = coinFill;
  ctx.fill();
  ctx.strokeStyle = coinStroke;
  ctx.lineWidth = s * 0.018;
  ctx.stroke();

  // Dollar sign in coin
  const dSize = coinR * 1.1;
  ctx.font = `bold ${dSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = dollarColor;
  ctx.fillText("$", coinCX, coinCY + dSize * 0.04);
}

function generateMainIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  drawIcon(ctx, size, { withBackground: true });
  return canvas.toBuffer("image/png");
}

function generateForeground(size) {
  // Android adaptive: icon on transparent background, with safe zone padding
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  // The drawable area for adaptive icons is the inner 66% (72dp of 108dp)
  // Draw the envelope centered in this safe zone
  const inset = size * 0.17; // ~18% inset on each side
  const drawSize = size - inset * 2;

  ctx.save();
  ctx.translate(inset, inset);
  drawIcon(ctx, drawSize, { withBackground: false });
  ctx.restore();
  return canvas.toBuffer("image/png");
}

function generateBackground(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, size, size);
  return canvas.toBuffer("image/png");
}

function generateMonochrome(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const inset = size * 0.17;
  const drawSize = size - inset * 2;

  ctx.save();
  ctx.translate(inset, inset);
  drawIcon(ctx, drawSize, { withBackground: false, monochrome: true });
  ctx.restore();
  return canvas.toBuffer("image/png");
}

const assetsDir = path.join(__dirname, "..", "assets");

const outputs = [
  { name: "icon.png", size: 1024, gen: generateMainIcon },
  { name: "splash-icon.png", size: 200, gen: generateMainIcon },
  { name: "favicon.png", size: 48, gen: generateMainIcon },
  { name: "android-icon-foreground.png", size: 432, gen: generateForeground },
  { name: "android-icon-background.png", size: 432, gen: generateBackground },
  { name: "android-icon-monochrome.png", size: 432, gen: generateMonochrome },
];

for (const { name, size, gen } of outputs) {
  const buf = gen(size);
  const filePath = path.join(assetsDir, name);
  fs.writeFileSync(filePath, buf);
  console.log(`Generated ${name} (${size}x${size})`);
}

console.log("\nDone! All icon assets generated.");
