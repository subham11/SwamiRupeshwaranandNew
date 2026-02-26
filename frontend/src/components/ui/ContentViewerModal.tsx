'use client';

import { useEffect, useCallback, useState } from 'react';

interface ContentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
  /** accent color for buttons/header — 'orange' or 'amber' */
  accent?: 'orange' | 'amber';
}

function getFileType(url: string): 'pdf' | 'image' | 'other' {
  const lower = url.toLowerCase().split('?')[0]; // strip query params
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(jpe?g|png|gif|webp|svg|bmp|avif)$/.test(lower)) return 'image';
  return 'other';
}

export default function ContentViewerModal({
  isOpen,
  onClose,
  fileUrl,
  title,
  accent = 'orange',
}: ContentViewerModalProps) {
  const [iframeError, setIframeError] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setIframeError(false);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const fileType = getFileType(fileUrl);

  const accentClasses = {
    orange: {
      header: 'bg-orange-600',
      downloadBtn: 'bg-orange-600 hover:bg-orange-700',
      openBtn: 'border-orange-300 text-orange-700 hover:bg-orange-50',
    },
    amber: {
      header: 'bg-amber-600',
      downloadBtn: 'bg-amber-600 hover:bg-amber-700',
      openBtn: 'border-amber-300 text-amber-700 hover:bg-amber-50',
    },
  }[accent];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex flex-col w-[95vw] max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 ${accentClasses.header} text-white`}>
          <h2 className="text-lg font-semibold truncate pr-4">{title}</h2>
          <div className="flex items-center gap-2 shrink-0">
            {/* Download */}
            <a
              href={fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-lg transition"
              title="Download"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Download</span>
            </a>
            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-100">
          {fileType === 'pdf' && !iframeError && (
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-full border-0"
              title={title}
              onError={() => setIframeError(true)}
            />
          )}

          {fileType === 'pdf' && iframeError && (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
              <div className="text-6xl">📄</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  PDF preview not available
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Your browser may not support inline PDF viewing.
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white ${accentClasses.downloadBtn} rounded-lg transition`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in New Tab
                </a>
                <a
                  href={fileUrl}
                  download
                  className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border ${accentClasses.openBtn} rounded-lg transition`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            </div>
          )}

          {fileType === 'image' && (
            <div className="flex items-center justify-center min-h-full p-4">
              <img
                src={fileUrl}
                alt={title}
                className="max-w-full max-h-[calc(90vh-64px)] object-contain rounded-lg shadow-lg"
              />
            </div>
          )}

          {fileType === 'other' && (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
              <div className="text-6xl">📁</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Preview not available for this file type
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  You can download or open the file directly.
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white ${accentClasses.downloadBtn} rounded-lg transition`}
                >
                  Open in New Tab
                </a>
                <a
                  href={fileUrl}
                  download
                  className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border ${accentClasses.openBtn} rounded-lg transition`}
                >
                  Download
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
