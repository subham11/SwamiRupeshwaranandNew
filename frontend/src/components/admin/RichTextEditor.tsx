'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center text-sm text-gray-400">
      Loading editor...
    </div>
  ),
});

// Import styles
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['blockquote'],
  ['link'],
  ['clean'],
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  label,
  className = '',
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR_OPTIONS,
    }),
    []
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'align',
    'blockquote',
    'link',
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="quill-wrapper">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder || 'Start writing...'}
        />
      </div>

      <style jsx global>{`
        .quill-wrapper .ql-container {
          min-height: 150px;
          font-size: 14px;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          background: white;
        }
        .dark .quill-wrapper .ql-container {
          background: #1f2937;
          color: #f3f4f6;
          border-color: #4b5563;
        }
        .quill-wrapper .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f9fafb;
        }
        .dark .quill-wrapper .ql-toolbar {
          background: #374151;
          border-color: #4b5563;
        }
        .dark .quill-wrapper .ql-toolbar button .ql-stroke {
          stroke: #d1d5db;
        }
        .dark .quill-wrapper .ql-toolbar button .ql-fill {
          fill: #d1d5db;
        }
        .dark .quill-wrapper .ql-toolbar button:hover .ql-stroke {
          stroke: #f97316;
        }
        .dark .quill-wrapper .ql-toolbar button:hover .ql-fill {
          fill: #f97316;
        }
        .dark .quill-wrapper .ql-toolbar .ql-picker-label {
          color: #d1d5db;
        }
        .quill-wrapper .ql-editor {
          min-height: 150px;
        }
        .quill-wrapper .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
