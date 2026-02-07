'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPresignedUploadUrl, listUploadedFiles, type FileMetadata } from '@/lib/api';

interface MediaPickerModalProps {
  accessToken: string;
  onSelect: (url: string) => void;
  onClose: () => void;
  folder?: string;
}

export default function MediaPickerModal({ accessToken, onSelect, onClose, folder = 'images' }: MediaPickerModalProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2026';
  const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api/v1`;

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listUploadedFiles(folder, accessToken);
      setFiles(data || []);
    } catch {
      // Files listing may fail in local dev without S3
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, folder]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Get presigned URL
      const { uploadUrl, downloadUrl } = await getPresignedUploadUrl(
        folder,
        file.name,
        file.type,
        accessToken
      );

      // Upload directly to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      onSelect(downloadUrl);
    } catch (err) {
      // Fallback: upload via server
      try {
        const formData = new FormData();
        formData.append('file', file);

        // Always use freshest token from localStorage (React prop may be stale)
        let token = (typeof window !== 'undefined' && localStorage.getItem('auth_access_token')) || accessToken;
        let res = await fetch(`${API_BASE}/uploads/upload?folder=${folder}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        // On 401, attempt token refresh and retry once
        if (res.status === 401 && typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('auth_refresh_token');
          if (refreshToken) {
            try {
              const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
              });
              if (refreshRes.ok) {
                const data = await refreshRes.json();
                const newToken = data.idToken || data.accessToken;
                if (newToken) {
                  localStorage.setItem('auth_access_token', newToken);
                  localStorage.setItem('auth_refresh_token', data.refreshToken);
                  token = newToken;
                  const retryFormData = new FormData();
                  retryFormData.append('file', file);
                  res = await fetch(`${API_BASE}/uploads/upload?folder=${folder}`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: retryFormData,
                  });
                }
              }
            } catch {
              // refresh failed, keep original 401 response
            }
          }
        }

        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        onSelect(data.url);
      } catch (uploadErr) {
        setError(uploadErr instanceof Error ? uploadErr.message : 'Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onSelect(urlInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 shadow-xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Media</h3>
          <button onClick={onClose} aria-label="Close media picker" title="Close" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Upload section */}
        <div className="mb-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <div className="flex items-center gap-4">
            <label className="cursor-pointer px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium">
              {uploading ? 'Uploading...' : '📁 Upload File'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
            <span className="text-gray-500 dark:text-gray-400 text-sm">or</span>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste image URL..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <button
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm disabled:opacity-50"
              >
                Use URL
              </button>
            </div>
          </div>
        </div>

        {/* Existing files grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
          ) : files.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
              No files in media library. Upload a file or paste a URL above.
            </p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {files.map((file) => (
                <button
                  key={file.key}
                  onClick={() => {
                    // Construct URL from key
                    const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN;
                    const url = cdnDomain ? `https://${cdnDomain}/${file.key}` : file.key;
                    onSelect(url);
                  }}
                  className="aspect-square border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-orange-500 hover:ring-2 hover:ring-orange-200 transition-all"
                >
                  {file.contentType?.startsWith('image/') ? (
                    <img
                      src={file.key}
                      alt={file.key.split('/').pop() || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                      <span className="text-2xl">📄</span>
                      <span className="text-xs text-gray-500 truncate w-full text-center mt-1">
                        {file.key.split('/').pop()}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
