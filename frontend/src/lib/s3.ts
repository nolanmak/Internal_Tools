export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
}

export async function uploadToS3(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      fileUrl: result.fileUrl,
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