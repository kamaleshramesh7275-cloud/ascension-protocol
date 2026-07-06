import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This is a 1x1 black transparent PNG, just as a placeholder
const pixelBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const icon192Path = path.resolve(__dirname, '../client/public/pwa-192x192.png');
const icon512Path = path.resolve(__dirname, '../client/public/pwa-512x512.png');

fs.writeFileSync(icon192Path, Buffer.from(pixelBase64, 'base64'));
fs.writeFileSync(icon512Path, Buffer.from(pixelBase64, 'base64'));

console.log("Created placeholder icons");
