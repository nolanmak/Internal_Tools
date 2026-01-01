import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-providers';

// Use named profile for local dev, falls back to env vars / IAM role in production
const isDev = process.env.NODE_ENV === 'development';

const s3Client = new S3Client({
  region: 'us-east-1',
  ...(isDev && { credentials: fromIni({ profile: 'shadowshare' }) }),
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'internal-tools-credentials';

// Storage type configuration
type StorageType = 'temp' | 'media' | 'permanent';

const STORAGE_CONFIG: Record<StorageType, { prefix: string; maxSize: number; allowedExtensions: string[]; retention: string }> = {
  temp: {
    prefix: 'temp/',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedExtensions: ['.env', '.txt', '.text', '.log', '.json', '.yaml', '.yml', '.conf', '.config'],
    retention: '24 hours',
  },
  media: {
    prefix: 'media/',
    maxSize: 500 * 1024 * 1024, // 500MB for videos
    allowedExtensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.mp3', '.wav', '.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip'],
    retention: '30 days',
  },
  permanent: {
    prefix: 'permanent/',
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedExtensions: ['*'], // Allow all file types
    retention: 'permanent',
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const storageType = (formData.get('storageType') as StorageType) || 'temp';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate storage type
    if (!STORAGE_CONFIG[storageType]) {
      return NextResponse.json({ error: 'Invalid storage type' }, { status: 400 });
    }

    const config = STORAGE_CONFIG[storageType];

    // Validate file type based on storage type
    const fileName = file.name.toLowerCase();
    const fileExtension = '.' + (fileName.split('.').pop() || '');
    const isValidFile = config.allowedExtensions.includes('*') ||
      config.allowedExtensions.some(ext => fileName.endsWith(ext)) ||
      fileName === '.env';

    if (!isValidFile) {
      return NextResponse.json({
        error: `Invalid file type for ${storageType} storage. Allowed: ${config.allowedExtensions.join(', ')}`
      }, { status: 400 });
    }

    // Validate file size based on storage type
    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      return NextResponse.json({
        error: `File too large. Maximum size for ${storageType} storage is ${maxSizeMB}MB.`
      }, { status: 400 });
    }

    // Generate unique filename with timestamp and storage prefix
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = Math.random().toString(36).substring(2, 8);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${config.prefix}${timestamp}-${randomId}-${sanitizedName}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'text/plain',
      Metadata: {
        originalName: file.name,
        uploadTime: new Date().toISOString(),
      },
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Generate the file URL
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      storageType,
      retention: config.retention,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}