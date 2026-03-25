/**
 * API Route for handling client-side blob uploads
 * 
 * This route generates upload tokens for client-side uploads.
 * For production, add authentication and authorization checks.
 * 
 * @see https://vercel.com/docs/storage/vercel-blob/client-upload
 */

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as HandleUploadBody;
    
    const blob = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        // Add authentication/authorization here if needed
        // const userId = await getUserId(request);
        // if (!userId) {
        //   throw new Error('Unauthorized');
        // }
        
        // Validate pathname if needed
        if (!pathname.startsWith('workflows/')) {
          throw new Error('Invalid pathname');
        }
        
        return {
          // Optionally: add metadata or restrict upload
          // uploadToken: 'custom-token',
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // This callback is called when the upload completes
        // You can update your database here
        console.log('Upload completed:', blob.url);
        
        // Example: Update workflow record with file info
        // await db.workflowFile.create({
        //   url: blob.url,
        //   pathname: blob.pathname,
        //   contentType: blob.contentType,
        // });
      },
    });

    return new Response(
      JSON.stringify(blob),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Upload failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
