import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'ap-south-1';
const bucketName = process.env.AWS_BUCKET_NAME;
const facesFolder = process.env.AWS_MEMBER_FACES_FOLDER || 'faces-gym-members';

const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || '').trim();
const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY || '').trim();

const s3Client = accessKeyId && secretAccessKey
  ? new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

export async function uploadMemberFaceImage(tenantId: string, userId: string, file: Express.Multer.File) {
  if (!bucketName || !s3Client) {
    throw new Error('S3 upload is not configured. Set AWS_BUCKET_NAME, AWS_ACCESS_KEY/AWS_ACCESS_KEY_ID and AWS_SECRET_KEY/AWS_SECRET_ACCESS_KEY');
  }

  const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const objectKey = `${facesFolder}/${tenantId}/${userId}-${Date.now()}-${safeName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${objectKey}`;
  return { imageUrl, objectKey };
}
