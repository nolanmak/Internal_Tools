'use client';

import { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Copy, LogOut, Clock, Film, Archive } from 'lucide-react';
import { uploadToS3, formatFileSize, StorageType, STORAGE_OPTIONS } from '@/lib/s3';
import { clearAuthSession } from '@/lib/auth';

interface FileUploadProps {
  onLogout: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  url: string;
  uploadTime: Date;
  storageType: StorageType;
  retention: string;
}

const STORAGE_ICONS: Record<StorageType, React.ReactNode> = {
  temp: <Clock className="h-5 w-5" />,
  media: <Film className="h-5 w-5" />,
  permanent: <Archive className="h-5 w-5" />,
};

export default function FileUpload({ onLogout }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState('');
  const [storageType, setStorageType] = useState<StorageType>('temp');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    clearAuthSession();
    onLogout();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    for (const file of files) {
      try {
        const result = await uploadToS3(file, storageType);

        if (result.success && result.fileUrl) {
          const uploadedFile: UploadedFile = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            url: result.fileUrl,
            uploadTime: new Date(),
            storageType: result.storageType || storageType,
            retention: result.retention || STORAGE_OPTIONS[storageType].label,
          };

          setUploadedFiles(prev => [uploadedFile, ...prev]);
        } else {
          setError(result.error || 'Upload failed');
        }
      } catch (error) {
        setError('Upload failed. Please try again.');
        console.error('Upload error:', error);
      }
    }

    setUploading(false);
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">ShadowShare</h1>
            <p className="text-slate-400">Secure file sharing with flexible retention options</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>

        {/* Storage Type Selector */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Storage Duration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(STORAGE_OPTIONS) as StorageType[]).map((type) => (
              <button
                key={type}
                onClick={() => setStorageType(type)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  storageType === type
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                }`}
              >
                <div className="flex items-center mb-2">
                  <span className={storageType === type ? 'text-purple-400' : 'text-slate-400'}>
                    {STORAGE_ICONS[type]}
                  </span>
                  <span className={`ml-2 font-semibold ${storageType === type ? 'text-white' : 'text-slate-300'}`}>
                    {STORAGE_OPTIONS[type].label}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{STORAGE_OPTIONS[type].description}</p>
                <p className="text-xs text-slate-500 mt-1">Max: {STORAGE_OPTIONS[type].maxSize}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8 mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Upload Files</h3>
            <p className="text-slate-400 mb-2">
              {storageType === 'temp' && 'Drag and drop .env, .txt, .json, .yaml, .log, or .conf files'}
              {storageType === 'media' && 'Drag and drop videos, images, PDFs, or zip files'}
              {storageType === 'permanent' && 'Drag and drop any file type'}
            </p>
            <p className="text-purple-400 text-sm mb-4">
              Retention: {STORAGE_OPTIONS[storageType].label} • Max size: {STORAGE_OPTIONS[storageType].maxSize}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-6 py-3 border border-slate-600 text-white bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <File className="h-4 w-4 mr-2" />
                  Choose Files
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={
                storageType === 'temp' ? '.env,.txt,.text,.log,.json,.yaml,.yml,.conf,.config' :
                storageType === 'media' ? '.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.png,.jpg,.jpeg,.gif,.pdf,.zip' :
                '*'
              }
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {error && (
            <div className="mt-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center space-x-3">
                    <span className={
                      file.storageType === 'temp' ? 'text-yellow-400' :
                      file.storageType === 'media' ? 'text-blue-400' :
                      'text-green-400'
                    }>
                      {STORAGE_ICONS[file.storageType]}
                    </span>
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-slate-400 text-sm">
                        {formatFileSize(file.size)} • {file.retention} • Uploaded {file.uploadTime.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(file.url)}
                      className="p-2 text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 text-slate-400 hover:text-red-400 border border-slate-600 hover:border-red-500 rounded-lg transition-colors"
                      title="Remove from list"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
              <p className="text-slate-300 text-sm">
                <span className="text-yellow-400">⏱ 24 Hours:</span> Auto-deleted after 1 day<br />
                <span className="text-blue-400">🎬 30 Days:</span> Auto-deleted after 30 days<br />
                <span className="text-green-400">📦 Permanent:</span> Stored indefinitely
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}