'use client';

/**
 * File Upload Page for Workflow Files
 * 
 * This page allows users to upload files to Vercel Blob storage.
 * Files are uploaded directly from the client to Blob for better performance.
 * 
 * @see https://vercel.com/docs/storage/vercel-blob/client-upload
 */

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { type PutBlobResult } from '@vercel/blob';

export default function FilesPage() {
  const [uploading, setUploading] = useState(false);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);
    setBlob(null);

    try {
      // Get upload token from our API
      const response = await fetch('/api/blob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathname: `workflows/uploads/${Date.now()}-${file.name}`,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload token');
      }

      // Upload directly to Vercel Blob
      const newBlob = await upload(file.name, file, {
        access: 'private',
        handleUploadUrl: '/api/blob',
        onUploadProgress: (progressEvent) => {
          setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        },
      });

      setBlob(newBlob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">File Upload</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Workflow File</h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Upload files to Vercel Blob storage. Files are uploaded directly from your browser
          for optimal performance. Supports images, documents, and other workflow-related files.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select File
          </label>
          <input
            type="file"
            ref={inputFileRef}
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              dark:file:bg-blue-900/30 dark:file:text-blue-300
              hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {uploading && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {blob && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              Upload Complete!
            </h3>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <p><strong>URL:</strong> <a href={blob.url} target="_blank" rel="noopener noreferrer" className="underline">{blob.url}</a></p>
              <p><strong>Pathname:</strong> {blob.pathname}</p>
              <p><strong>Content Type:</strong> {blob.contentType}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        <h3 className="font-semibold mb-2">Features:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Direct browser-to-Blob upload for better performance</li>
          <li>Progress tracking during upload</li>
          <li>Support for large files via multipart upload</li>
          <li>Private storage (requires authentication to access)</li>
        </ul>
      </div>
    </div>
  );
}
