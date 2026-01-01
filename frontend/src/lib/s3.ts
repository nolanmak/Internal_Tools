export type StorageType = 'temp' | 'media' | 'permanent';

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
  storageType?: StorageType;
  retention?: string;
}

export const STORAGE_OPTIONS: Record<StorageType, { label: string; description: string; maxSize: string }> = {
  temp: {
    label: '24 Hours',
    description: 'For API keys, secrets, and sensitive configs',
    maxSize: '5MB',
  },
  media: {
    label: '30 Days',
    description: 'For videos, images, and large files',
    maxSize: '500MB',
  },
  permanent: {
    label: 'Permanent',
    description: 'Files stored indefinitely',
    maxSize: '100MB',
  },
};

export async function uploadToS3(file: File, storageType: StorageType = 'temp'): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('storageType', storageType);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      fileUrl: result.fileUrl,
      storageType: result.storageType,
      retention: result.retention,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

export function isValidFileType(file: File): boolean {
  const allowedExtensions = ['.env', '.txt', '.text', '.log', '.json', '.yaml', '.yml', '.conf', '.config'];
  const allowedMimeTypes = ['text/plain', 'application/json', 'text/yaml', 'application/x-yaml'];

  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isValidExtension = allowedExtensions.includes(extension) || file.name === '.env';
  const isValidMimeType = allowedMimeTypes.includes(file.type) || file.type === '';

  return isValidExtension || isValidMimeType;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}