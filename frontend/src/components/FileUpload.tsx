'use client';

import { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Copy, LogOut } from 'lucide-react';
import { uploadToS3, isValidFileType, formatFileSize } from '@/lib/s3';
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
}

export default function FileUpload({ onLogout }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState('');
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
    const validFiles = files.filter(file => {
      if (!isValidFileType(file)) {
        setError(`Invalid file type: ${file.name}. Only .env, .txt, .json, .yaml, .log, and .conf files are allowed.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError(`File too large: ${file.name}. Maximum size is 5MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setError('');

    for (const file of validFiles) {
      try {
        const result = await uploadToS3(file);

        if (result.success && result.fileUrl) {
          const uploadedFile: UploadedFile = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            url: result.fileUrl,
            uploadTime: new Date(),
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
            <p className="text-slate-400">Secure temporary file sharing • Files auto-delete in 24 hours</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
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
            <p className="text-slate-400 mb-4">
              Drag and drop your .env, .txt, .json, .yaml, .log, or .conf files here
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
              accept=".env,.txt,.text,.log,.json,.yaml,.yml,.conf,.config"
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
                    <File className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-slate-400 text-sm">
                        {formatFileSize(file.size)} • Uploaded {file.uploadTime.toLocaleTimeString()}
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
            <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
              <p className="text-yellow-200 text-sm">
                ⚠️ These files will be automatically deleted from the server after 24 hours.
                Make sure to download or copy them before then.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}