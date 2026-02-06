'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import {
  fetchUploadFolders,
  listUploadedFiles,
  getPresignedUploadUrl,
  deleteUploadedFile,
  UploadFolder,
  FileMetadata,
} from '@/lib/api';

const MIME_ICONS: Record<string, string> = {
  'image/jpeg': '🖼️',
  'image/jpg': '🖼️',
  'image/png': '🖼️',
  'image/webp': '🖼️',
  'image/gif': '🖼️',
  'application/pdf': '📄',
  'video/mp4': '🎬',
  'video/webm': '🎬',
  'video/quicktime': '🎬',
  'audio/mpeg': '🎵',
  'audio/wav': '🎵',
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileNameFromKey(key: string): string {
  return key.split('/').pop() || key;
}

function getFileExtension(key: string): string {
  return key.split('.').pop()?.toLowerCase() || '';
}

function isImageFile(contentType: string): boolean {
  return contentType.startsWith('image/');
}

export default function AdminMediaPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  const [folders, setFolders] = useState<UploadFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('images');
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'content_editor';
  const canDelete = user?.role === 'super_admin' || user?.role === 'admin';

  const loadFolders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await fetchUploadFolders(accessToken);
      setFolders(result.folders || []);
    } catch {
      // Use default folders if endpoint fails
      setFolders([
        { name: 'Images', key: 'images' },
        { name: 'PDFs', key: 'pdfs' },
        { name: 'Videos', key: 'videos' },
        { name: 'Thumbnails', key: 'thumbnails' },
      ]);
    }
  }, [accessToken]);

  const loadFiles = useCallback(async (folder: string) => {
    if (!accessToken) return;
    setLoadingFiles(true);
    try {
      const result = await listUploadedFiles(folder, accessToken);
      setFiles(Array.isArray(result) ? result : []);
    } catch {
      setFiles([]);
      setError('Failed to load files');
    } finally {
      setLoadingFiles(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin/media');
    } else if (!isLoading && isAuthenticated && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && accessToken) {
      setLoading(true);
      loadFolders().then(() => setLoading(false));
    }
  }, [isAuthenticated, isAdmin, accessToken, loadFolders]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && accessToken && selectedFolder) {
      loadFiles(selectedFolder);
    }
  }, [isAuthenticated, isAdmin, accessToken, selectedFolder, loadFiles]);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 5000); return () => clearTimeout(t); }
  }, [success]);

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }
  }, [error]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);

    try {
      // Get presigned URL
      const { uploadUrl } = await getPresignedUploadUrl(
        selectedFolder,
        file.name,
        file.type,
        accessToken
      );

      // Upload to S3 via presigned URL
      setUploadProgress('Uploading to storage...');
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      setSuccess(`${file.name} uploaded successfully!`);
      loadFiles(selectedFolder);
    } catch {
      setError('Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (key: string) => {
    if (!accessToken || !confirm(`Delete ${getFileNameFromKey(key)}?`)) return;
    try {
      await deleteUploadedFile(key, accessToken);
      setSuccess('File deleted');
      loadFiles(selectedFolder);
    } catch {
      setError('Failed to delete file');
    }
  };

  const handleCopyUrl = (key: string) => {
    const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_S3_URL || '';
    const url = cdnBase ? `${cdnBase}/${key}` : key;
    navigator.clipboard.writeText(url);
    setSuccess('URL copied to clipboard');
  };

  if (isLoading || loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-[70vh] py-8 bg-gradient-to-b from-amber-50/30 to-white dark:from-gray-900 dark:to-gray-800">
      <Container>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/admin" className="text-sm text-orange-600 hover:text-orange-700">← Admin</Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Media Library</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Upload and manage images, documents, and videos</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf,video/*,audio/*"
              title="Upload a file"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? uploadProgress : '+ Upload File'}
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">{error}</div>}
        {success && <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">{success}</div>}

        {/* Folder Tabs + View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto">
            {folders.map((folder) => (
              <button
                key={folder.key}
                onClick={() => setSelectedFolder(folder.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedFolder === folder.key
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {folder.name}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
              title="Grid view"
            >
              ▦
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>

        {/* File Count */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {loadingFiles ? 'Loading...' : `${files.length} file${files.length !== 1 ? 's' : ''} in ${folders.find(f => f.key === selectedFolder)?.name || selectedFolder}`}
        </p>

        {/* Loading */}
        {loadingFiles ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : files.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-4xl mb-4 block">📁</span>
            <p className="text-gray-500 dark:text-gray-400">No files in this folder. Upload your first file!</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {files.map((file) => {
              const fileName = getFileNameFromKey(file.key);
              const ext = getFileExtension(file.key);
              const icon = MIME_ICONS[file.contentType] || '📎';
              const isImage = isImageFile(file.contentType);

              return (
                <div
                  key={file.key}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-shadow"
                >
                  {/* Preview area */}
                  <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative">
                    {isImage ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <span className="text-4xl">{icon}</span>
                      </div>
                    ) : (
                      <span className="text-5xl">{icon}</span>
                    )}
                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleCopyUrl(file.key)}
                        className="p-2 bg-white rounded-lg text-xs hover:bg-gray-100 transition-colors"
                        title="Copy URL"
                      >
                        📋
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteFile(file.key)}
                          className="p-2 bg-white rounded-lg text-xs hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  {/* File info */}
                  <div className="p-3">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate" title={fileName}>
                      {fileName}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{ext}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">File</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Modified</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {files.map((file) => {
                  const fileName = getFileNameFromKey(file.key);
                  const icon = MIME_ICONS[file.contentType] || '📎';

                  return (
                    <tr key={file.key} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{icon}</span>
                          <span className="text-sm text-gray-900 dark:text-white truncate max-w-[300px]" title={fileName}>
                            {fileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 uppercase">
                        {getFileExtension(file.key)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(file.lastModified).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyUrl(file.key)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            Copy URL
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteFile(file.key)}
                              className="text-red-600 hover:text-red-800 text-xs font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Container>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
