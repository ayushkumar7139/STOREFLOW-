import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a standard POSIX zip archive with forward slashes (/) for Netlify & Linux deployment compatibility.
 */
function createPosixZip(sourceDir, outPath) {
  const files = [];

  function walk(dir, baseDir) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath, baseDir);
      } else {
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        files.push({ fullPath, relativePath });
      }
    }
  }

  walk(sourceDir, sourceDir);

  const entries = [];
  let localHeadersLength = 0;
  const chunks = [];

  for (const file of files) {
    const content = fs.readFileSync(file.fullPath);
    const fileNameBuffer = Buffer.from(file.relativePath, 'utf8');

    const crc = crc32(content);
    const compressed = zlib.deflateRawSync(content);

    const localHeader = Buffer.alloc(30 + fileNameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(fileNameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    fileNameBuffer.copy(localHeader, 30);

    const entryOffset = localHeadersLength;
    chunks.push(localHeader, compressed);
    localHeadersLength += localHeader.length + compressed.length;

    entries.push({
      relativePath: file.relativePath,
      fileNameBuffer,
      crc,
      compressedSize: compressed.length,
      uncompressedSize: content.length,
      offset: entryOffset
    });
  }

  const cdChunks = [];
  let cdSize = 0;

  for (const entry of entries) {
    const cdHeader = Buffer.alloc(46 + entry.fileNameBuffer.length);
    cdHeader.writeUInt32LE(0x02014b50, 0);
    cdHeader.writeUInt16LE(30, 4); // Made by Unix
    cdHeader.writeUInt16LE(20, 6);
    cdHeader.writeUInt16LE(0, 8);
    cdHeader.writeUInt16LE(8, 10);
    cdHeader.writeUInt16LE(0, 12);
    cdHeader.writeUInt16LE(0, 14);
    cdHeader.writeUInt32LE(entry.crc, 16);
    cdHeader.writeUInt32LE(entry.compressedSize, 20);
    cdHeader.writeUInt32LE(entry.uncompressedSize, 24);
    cdHeader.writeUInt16LE(entry.fileNameBuffer.length, 28);
    cdHeader.writeUInt16LE(0, 30);
    cdHeader.writeUInt16LE(0, 32);
    cdHeader.writeUInt16LE(0, 34);
    cdHeader.writeUInt16LE(0, 36);
    cdHeader.writeUInt32LE(0, 38);
    cdHeader.writeUInt32LE(entry.offset, 42);
    entry.fileNameBuffer.copy(cdHeader, 46);

    cdChunks.push(cdHeader);
    cdSize += cdHeader.length;
  }

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(localHeadersLength, 16);
  eocd.writeUInt16LE(0, 20);

  const finalBuffer = Buffer.concat([...chunks, ...cdChunks, eocd]);
  fs.writeFileSync(outPath, finalBuffer);
  console.log(`Created POSIX Zip: ${outPath} (${finalBuffer.length} bytes, ${files.length} files)`);
}

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const distDir = path.join(__dirname, 'dist');
const netlifyZipPath = path.join(__dirname, '..', 'storeflow-netlify-deploy.zip');

const redirectsPath = path.join(distDir, '_redirects');
if (!fs.existsSync(redirectsPath)) {
  fs.writeFileSync(redirectsPath, '/*    /index.html   200\n');
}

createPosixZip(distDir, netlifyZipPath);
