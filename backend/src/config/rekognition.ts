import {
  RekognitionClient,
  SearchFacesByImageCommand,
  ListCollectionsCommand,
  CreateCollectionCommand,
  IndexFacesCommand,
  DeleteCollectionCommand,
} from '@aws-sdk/client-rekognition';
import axios from 'axios';

const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || '').trim();
const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY || '').trim();
const collectionId = 'gym-member-faces';

const rekognitionClient = accessKeyId && secretAccessKey
  ? new RekognitionClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

// Initialize collection on first startup
export async function initFaceCollection() {
  if (!rekognitionClient) {
    console.warn('Rekognition not configured. Set AWS_ACCESS_KEY and AWS_SECRET_KEY');
    return;
  }

  try {
    const listResult = await rekognitionClient.send(
      new ListCollectionsCommand({})
    );

    if (listResult.CollectionIds?.includes(collectionId)) {
      console.log(`Rekognition collection "${collectionId}" already exists`);
      return;
    }

    await rekognitionClient.send(
      new CreateCollectionCommand({
        CollectionId: collectionId,
      })
    );
    console.log(`Rekognition collection "${collectionId}" created successfully`);
  } catch (error: any) {
    console.error(`Failed to initialize Rekognition collection: ${error.message}`);
  }
}

export async function searchFaceInCollection(imageBuffer: Buffer): Promise<{ userId: string; confidence: number } | null> {
  if (!rekognitionClient) {
    throw new Error('Rekognition is not configured');
  }

  try {
    const result = await rekognitionClient.send(
      new SearchFacesByImageCommand({
        CollectionId: collectionId,
        Image: {
          Bytes: imageBuffer,
        },
        MaxFaces: 1,
        FaceMatchThreshold: 80,
      })
    );

    if (!result.FaceMatches || result.FaceMatches.length === 0) {
      return null;
    }

    const match = result.FaceMatches[0];
    const userId = match.Face?.ExternalImageId;
    const confidence = match.Similarity || 0;

    if (!userId) {
      return null;
    }

    return { userId, confidence };
  } catch (error: any) {
    console.error('Rekognition search failed:', error);
    throw error;
  }
}

export async function indexMemberFace(userId: string, imageBuffer: Buffer): Promise<void> {
  if (!rekognitionClient) {
    throw new Error('Rekognition is not configured');
  }

  try {
    await rekognitionClient.send(
      new IndexFacesCommand({
        CollectionId: collectionId,
        Image: {
          Bytes: imageBuffer,
        },
        ExternalImageId: userId,
        DetectionAttributes: ['DEFAULT'],
      })
    );
  } catch (error: any) {
    console.error('Failed to index face:', error);
    throw error;
  }
}

export async function indexMemberFaceFromUrl(userId: string, imageUrl: string): Promise<void> {
  if (!rekognitionClient) {
    throw new Error('Rekognition is not configured');
  }

  try {
    // Download image from S3 URL
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);

    // Index the face
    await indexMemberFace(userId, imageBuffer);
    console.log(`Successfully indexed face for user ${userId}`);
  } catch (error: any) {
    console.error(`Failed to index face from URL for user ${userId}:`, error);
    throw error;
  }
}
