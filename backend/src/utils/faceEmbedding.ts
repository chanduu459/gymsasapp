import { Jimp, intToRGBA } from 'jimp';

const TARGET_WIDTH = 160;
const TARGET_HEIGHT = 160;
const EMBEDDING_BLOCKS_X = 16;
const EMBEDDING_BLOCKS_Y = 8;
const EPSILON = 1e-8;
const CENTER_CROP_RATIO = 0.75;

function l2Normalize(values: number[]): number[] {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (magnitude <= EPSILON) {
    return values.map(() => 0);
  }
  return values.map((value) => value / magnitude);
}

function centerCrop(image: any): any {
  const cropSize = Math.floor(Math.min(image.bitmap.width, image.bitmap.height) * CENTER_CROP_RATIO);
  const safeCropSize = Math.max(cropSize, 16);
  const x = Math.floor((image.bitmap.width - safeCropSize) / 2);
  const y = Math.floor((image.bitmap.height - safeCropSize) / 2);
  return image.crop({ x, y, w: safeCropSize, h: safeCropSize });
}

export async function buildFaceEmbeddingFromImage(buffer: Buffer): Promise<number[]> {
  const image = await Jimp.read(buffer);
  centerCrop(image)
    .resize({ w: TARGET_WIDTH, h: TARGET_HEIGHT })
    .greyscale()
    .normalize();

  const blockWidth = TARGET_WIDTH / EMBEDDING_BLOCKS_X;
  const blockHeight = TARGET_HEIGHT / EMBEDDING_BLOCKS_Y;
  const embedding: number[] = [];

  for (let blockY = 0; blockY < EMBEDDING_BLOCKS_Y; blockY++) {
    for (let blockX = 0; blockX < EMBEDDING_BLOCKS_X; blockX++) {
      const startX = Math.floor(blockX * blockWidth);
      const endX = Math.floor((blockX + 1) * blockWidth);
      const startY = Math.floor(blockY * blockHeight);
      const endY = Math.floor((blockY + 1) * blockHeight);

      let sum = 0;
      let count = 0;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const pixel = intToRGBA(image.getPixelColor(x, y));
          sum += pixel.r / 255;
          count++;
        }
      }

      embedding.push(count > 0 ? sum / count : 0);
    }
  }

  const mean = embedding.reduce((sum, value) => sum + value, 0) / embedding.length;
  const variance = embedding.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) / embedding.length;
  const standardDeviation = Math.sqrt(variance);

  const centered = embedding.map((value) => (value - mean) / (standardDeviation + EPSILON));
  return l2Normalize(centered).map((value) => Number(value.toFixed(6)));
}
