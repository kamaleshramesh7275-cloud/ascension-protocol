import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resizeIcons() {
  try {
    const faviconPath = path.resolve(__dirname, '../client/public/favicon.png');
    const icon192Path = path.resolve(__dirname, '../client/public/pwa-192x192.png');
    const icon512Path = path.resolve(__dirname, '../client/public/pwa-512x512.png');

    console.log("Loading favicon...");
    const image = await Jimp.read(faviconPath);

    console.log("Resizing to 192x192...");
    const img192 = image.clone().resize({ w: 192, h: 192 });
    await img192.write(icon192Path);

    console.log("Resizing to 512x512...");
    const img512 = image.clone().resize({ w: 512, h: 512 });
    await img512.write(icon512Path);

    console.log("Successfully generated real PWA icons!");
  } catch (err) {
    console.error("Error generating icons:", err);
  }
}

resizeIcons();
