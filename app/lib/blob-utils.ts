/**
 * Vercel Blob Utilities for File Processing Workflows
 * 
 * This module provides utilities for working with Vercel Blob storage.
 * It supports both server-side and client-side uploads.
 * 
 * @see https://vercel.com/docs/storage/vercel-blob
 */

import { put, list, del, head, BlobNotFoundError } from '@vercel/blob';

/**
 * Blob store configuration
 */
export interface BlobConfig {
  /** The pathname/prefix for blob storage */
  pathname: string;
  /** Access level: 'public' or 'private' */
  access?: 'public' | 'private';
}

/**
 * Default blob configuration for workflow files
 */
export const WORKFLOW_BLOB_CONFIG: BlobConfig = {
  pathname: 'workflows',
  access: 'private',
};

/**
 * Result of a blob upload operation
 */
export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  etag: string;
  uploadedAt: Date;
}

/**
 * Upload a file to Vercel Blob
 * 
 * @param pathname - The path/name for the blob
 * @param content - The file content (Buffer, ArrayBuffer, or string)
 * @param contentType - The MIME type of the file
 * @param access - Access level ('public' or 'private')
 * @returns The upload result with blob details
 */
export async function uploadBlob(
  pathname: string,
  content: Buffer | ArrayBuffer | string,
  contentType: string,
  access: 'public' | 'private' = 'private'
): Promise<UploadResult> {
  const blob = await put(pathname, content, {
    access,
    contentType,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType || contentType,
    etag: blob.etag,
    uploadedAt: new Date(),
  };
}

/**
 * Upload a workflow input file
 * 
 * @param workflowId - The workflow ID
 * @param fileName - The original filename
 * @param content - The file content
 * @param contentType - The MIME type
 * @returns The upload result
 */
export async function uploadWorkflowFile(
  workflowId: string,
  fileName: string,
  content: Buffer | ArrayBuffer | string,
  contentType: string
): Promise<UploadResult> {
  const pathname = `workflows/${workflowId}/${fileName}`;
  return uploadBlob(pathname, content, contentType);
}

/**
 * List all blobs in a prefix
 * 
 * @param prefix - The path prefix to filter by
 * @param limit - Maximum number of results
 * @returns List of blob objects
 */
export async function listBlobs(prefix?: string, limit = 100) {
  const result = await list({
    prefix: prefix || WORKFLOW_BLOB_CONFIG.pathname,
    limit,
  });
  return result.blobs;
}

/**
 * List workflow files for a specific workflow
 * 
 * @param workflowId - The workflow ID
 * @returns List of blob objects for the workflow
 */
export async function listWorkflowFiles(workflowId: string) {
  return listBlobs(`workflows/${workflowId}/`);
}

/**
 * Delete a blob by URL
 * 
 * @param url - The URL of the blob to delete
 */
export async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      console.warn(`Blob not found: ${url}`);
      return;
    }
    throw error;
  }
}

/**
 * Delete workflow files
 * 
 * @param workflowId - The workflow ID
 */
export async function deleteWorkflowFiles(workflowId: string): Promise<void> {
  const blobs = await listWorkflowFiles(workflowId);
  if (blobs.length > 0) {
    await del(blobs.map((b) => b.url));
  }
}

/**
 * Get blob metadata without downloading content
 * 
 * @param pathname - The blob pathname
 * @returns Blob metadata or null if not found
 */
export async function getBlobMetadata(pathname: string) {
  try {
    return await head(pathname);
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return null;
    }
    throw error;
  }
}

/**
 * Generate a unique pathname for a workflow file
 * 
 * @param workflowId - The workflow ID
 * @param originalName - The original filename
 * @param timestamp - Optional timestamp to include
 * @returns The generated pathname
 */
export function generateWorkflowFilePath(
  workflowId: string,
  originalName: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `workflows/${workflowId}/${ts}-${sanitizedName}`;
}
