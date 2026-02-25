interface FaceMatchCandidate {
  id: string;
  face_embedding: unknown;
}

interface FaceMatchResult<T extends FaceMatchCandidate> {
  candidate: T;
  similarity: number;
  confidence: number;
}

const DEFAULT_MATCH_THRESHOLD = Number(process.env.FACE_EMBEDDING_MATCH_THRESHOLD || 0.25);

function parseEmbedding(value: unknown): number[] | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const parsed = value.map((entry) => Number(entry));
    return parsed.every((entry) => Number.isFinite(entry)) ? parsed : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = trimmed
        .slice(1, -1)
        .split(',')
        .map((entry) => Number(entry.trim()));
      return parsed.every((entry) => Number.isFinite(entry)) ? parsed : null;
    }

    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      const parsed = trimmed
        .slice(1, -1)
        .split(',')
        .map((entry) => Number(entry.trim()));
      return parsed.every((entry) => Number.isFinite(entry)) ? parsed : null;
    }

    try {
      const jsonValue = JSON.parse(trimmed) as unknown;
      if (Array.isArray(jsonValue)) {
        const parsed = jsonValue.map((entry) => Number(entry));
        return parsed.every((entry) => Number.isFinite(entry)) ? parsed : null;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (let index = 0; index < a.length; index++) {
    dotProduct += a[index] * b[index];
    aMagnitude += a[index] * a[index];
    bMagnitude += b[index] * b[index];
  }

  if (aMagnitude === 0 || bMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
}

export function getFaceEmbeddingMatchThreshold(): number {
  return DEFAULT_MATCH_THRESHOLD;
}

export function findBestFaceEmbeddingCandidate<T extends FaceMatchCandidate>(
  sourceEmbedding: number[],
  candidates: T[]
): FaceMatchResult<T> | null {
  let bestMatch: FaceMatchResult<T> | null = null;

  for (const candidate of candidates) {
    const candidateEmbedding = parseEmbedding(candidate.face_embedding);
    if (!candidateEmbedding || candidateEmbedding.length !== sourceEmbedding.length) {
      continue;
    }

    const similarity = cosineSimilarity(sourceEmbedding, candidateEmbedding);

    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = {
        candidate,
        similarity,
        confidence: Number((similarity * 100).toFixed(2)),
      };
    }
  }

  return bestMatch;
}

export function findBestFaceEmbeddingMatch<T extends FaceMatchCandidate>(
  sourceEmbedding: number[],
  candidates: T[],
  threshold = DEFAULT_MATCH_THRESHOLD
): FaceMatchResult<T> | null {
  const bestMatch = findBestFaceEmbeddingCandidate(sourceEmbedding, candidates);

  if (!bestMatch || bestMatch.similarity < threshold) {
    return null;
  }

  return bestMatch;
}
