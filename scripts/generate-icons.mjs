import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const BUILD_DIR = 'build';
const ICONSET_DIR = join(BUILD_DIR, 'Qwill.iconset');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ICO_SIZES = [16, 32, 48, 64, 128, 256];
const ICNS_SIZES = [
  ['icp4', 16],
  ['icp5', 32],
  ['icp6', 64],
  ['ic07', 128],
  ['ic08', 256],
  ['ic09', 512],
  ['ic10', 1024]
];

mkdirSync(BUILD_DIR, { recursive: true });
rmSync(ICONSET_DIR, { recursive: true, force: true });

const iconPng = renderPng(1024);
writeFileSync(join(BUILD_DIR, 'icon.png'), iconPng);

const icoImages = ICO_SIZES.map((size) => ({ size, png: renderPng(size) }));
writeFileSync(join(BUILD_DIR, 'icon.ico'), createIco(icoImages));

const icnsImages = ICNS_SIZES.map(([type, size]) => ({ type, png: renderPng(size) }));
writeFileSync(join(BUILD_DIR, 'icon.icns'), createIcns(icnsImages));

function renderPng(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const radius = size * 0.21;
  const center = size / 2;
  const pageX = size * 0.22;
  const pageY = size * 0.15;
  const pageW = size * 0.56;
  const pageH = size * 0.7;
  const pageRadius = size * 0.055;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (y * size + x) * 4;
      const dx = x - center;
      const dy = y - center;
      const cornerMask = roundedRectAlpha(x, y, 0, 0, size, size, radius);
      const diagonal = (x + y) / (size * 2);
      const base = mixColor([91, 111, 88], [125, 155, 121], diagonal);

      setPixel(pixels, idx, base, Math.round(255 * cornerMask));
      if (cornerMask === 0) continue;

      const glow = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (size * 0.72));
      blendPixel(pixels, idx, [250, 250, 248], glow * 0.08);

      const shadow = roundedRectAlpha(x, y, pageX + size * 0.025, pageY + size * 0.035, pageW, pageH, pageRadius);
      if (shadow > 0) {
        blendPixel(pixels, idx, [21, 25, 22], shadow * 0.18);
      }

      const page = roundedRectAlpha(x, y, pageX, pageY, pageW, pageH, pageRadius);
      if (page > 0) {
        blendPixel(pixels, idx, [250, 250, 248], page);
      }

      const fold = triangleAlpha(x, y, pageX + pageW * 0.74, pageY, pageX + pageW, pageY, pageX + pageW, pageY + pageH * 0.22);
      if (fold > 0) {
        blendPixel(pixels, idx, [228, 232, 222], fold * 0.8);
      }

      const stem = roundedRectAlpha(x, y, pageX + pageW * 0.44, pageY + pageH * 0.26, size * 0.085, pageH * 0.48, size * 0.04);
      if (stem > 0) {
        blendPixel(pixels, idx, [59, 47, 30], stem * 0.92);
      }

      const nib = diamondAlpha(x, y, pageX + pageW * 0.48, pageY + pageH * 0.78, size * 0.1, size * 0.13);
      if (nib > 0) {
        blendPixel(pixels, idx, [59, 47, 30], nib * 0.92);
      }

      const mark = ellipseStrokeAlpha(x, y, pageX + pageW * 0.52, pageY + pageH * 0.48, pageW * 0.16, pageH * 0.18, size * 0.035);
      if (mark > 0) {
        blendPixel(pixels, idx, [91, 111, 88], mark * 0.75);
      }
    }
  }

  return createPng(size, size, pixels);
}

function createPng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const rawRow = y * (width * 4 + 1);
    raw[rawRow] = 0;
    rgba.copy(raw, rawRow + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    createChunk('IHDR', createIhdr(width, height)),
    createChunk('IDAT', deflateSync(raw, { level: 9 })),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

function createIhdr(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return data;
}

function createIco(images) {
  const headerSize = 6 + images.length * 16;
  const header = Buffer.alloc(headerSize);
  let offset = headerSize;

  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  for (let i = 0; i < images.length; i += 1) {
    const image = images[i];
    const entry = 6 + i * 16;
    header[entry] = image.size === 256 ? 0 : image.size;
    header[entry + 1] = image.size === 256 ? 0 : image.size;
    header[entry + 2] = 0;
    header[entry + 3] = 0;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += image.png.length;
  }

  return Buffer.concat([header, ...images.map((image) => image.png)]);
}

function createIcns(images) {
  const chunks = images.map(({ type, png }) => {
    const chunk = Buffer.alloc(8 + png.length);
    chunk.write(type, 0, 4, 'ascii');
    chunk.writeUInt32BE(chunk.length, 4);
    png.copy(chunk, 8);
    return chunk;
  });
  const totalLength = 8 + chunks.reduce((length, chunk) => length + chunk.length, 0);
  const header = Buffer.alloc(8);
  header.write('icns', 0, 4, 'ascii');
  header.writeUInt32BE(totalLength, 4);

  return Buffer.concat([header, ...chunks]);
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(8 + data.length + 4);

  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);

  return chunk;
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function roundedRectAlpha(x, y, left, top, width, height, radius) {
  const right = left + width;
  const bottom = top + height;
  if (x < left || x >= right || y < top || y >= bottom) return 0;

  const cx = clamp(x, left + radius, right - radius);
  const cy = clamp(y, top + radius, bottom - radius);
  const distance = Math.hypot(x - cx, y - cy);
  return smoothEdge(radius - distance);
}

function triangleAlpha(x, y, ax, ay, bx, by, cx, cy) {
  const area = edge(ax, ay, bx, by, cx, cy);
  const w1 = edge(x, y, bx, by, cx, cy) / area;
  const w2 = edge(ax, ay, x, y, cx, cy) / area;
  const w3 = edge(ax, ay, bx, by, x, y) / area;
  return w1 >= 0 && w2 >= 0 && w3 >= 0 ? 1 : 0;
}

function diamondAlpha(x, y, cx, cy, width, height) {
  const distance = Math.abs(x - cx) / (width / 2) + Math.abs(y - cy) / (height / 2);
  return smoothEdge(1 - distance);
}

function ellipseStrokeAlpha(x, y, cx, cy, rx, ry, strokeWidth) {
  const distance = Math.abs(Math.hypot((x - cx) / rx, (y - cy) / ry) - 1);
  return smoothEdge(strokeWidth / Math.max(rx, ry) - distance);
}

function edge(ax, ay, bx, by, cx, cy) {
  return (cx - ax) * (by - ay) - (cy - ay) * (bx - ax);
}

function smoothEdge(value) {
  if (value <= -1) return 0;
  if (value >= 1) return 1;
  return (value + 1) / 2;
}

function setPixel(buffer, index, [r, g, b], a) {
  buffer[index] = r;
  buffer[index + 1] = g;
  buffer[index + 2] = b;
  buffer[index + 3] = a;
}

function blendPixel(buffer, index, [r, g, b], alpha) {
  const sourceAlpha = clamp(alpha, 0, 1);
  const inverseAlpha = 1 - sourceAlpha;
  buffer[index] = Math.round(r * sourceAlpha + buffer[index] * inverseAlpha);
  buffer[index + 1] = Math.round(g * sourceAlpha + buffer[index + 1] * inverseAlpha);
  buffer[index + 2] = Math.round(b * sourceAlpha + buffer[index + 2] * inverseAlpha);
}

function mixColor(a, b, amount) {
  return a.map((value, index) => Math.round(value * (1 - amount) + b[index] * amount));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
