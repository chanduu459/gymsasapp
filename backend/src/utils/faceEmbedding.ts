import { createHash } from 'node:crypto';

export function buildFaceEmbeddingFromImage(buffer: Buffer): number[] {
  const dimensions = 128;
  const embedding: number[] = [];

  let seed = buffer;
  while (embedding.length < dimensions) {
    const digest = createHash('sha256').update(seed).digest();
    for (const byte of digest) {
      embedding.push(Number((byte / 255).toFixed(6)));
      if (embedding.length >= dimensions) {
        break;
      }
    }
    seed = digest;
  }

  return embedding;
}
