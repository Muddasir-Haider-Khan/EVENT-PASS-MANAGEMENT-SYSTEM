import ImageKit from 'imagekit';

let imagekitInstance: ImageKit | null = null;

function getImageKit(): ImageKit {
  if (imagekitInstance) return imagekitInstance;

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error('ImageKit environment variables are not configured');
  }

  imagekitInstance = new ImageKit({ publicKey, privateKey, urlEndpoint });
  return imagekitInstance;
}

/**
 * Generate signed upload parameters for client-side uploads
 */
export function getUploadAuthParams() {
  const ik = getImageKit();
  return ik.getAuthenticationParameters();
}

/**
 * Upload a file from server side
 */
export async function uploadFile(
  file: Buffer | string,
  fileName: string,
  folder: string
) {
  const ik = getImageKit();
  return ik.upload({
    file,
    fileName,
    folder,
    useUniqueFileName: true,
  });
}

/**
 * Delete a single file by its fileId
 */
export async function deleteFile(fileId: string) {
  const ik = getImageKit();
  return ik.deleteFile(fileId);
}

/**
 * Delete all files in an event's folder.
 * Lists all files in the folder and deletes them, then deletes the folder.
 */
export async function deleteEventFolder(eventId: string) {
  const ik = getImageKit();
  const folderPath = `/epms/events/${eventId}`;
  
  try {
    // List all files in the folder
    const files = await ik.listFiles({
      path: folderPath,
    });

    // Delete each file
    if (files && Array.isArray(files)) {
      for (const file of files) {
        try {
          if ('fileId' in file && file.fileId) {
            await ik.deleteFile(file.fileId as string);
          }
        } catch {
          // Continue even if individual file deletion fails
        }
      }
    }

    // Delete the folder itself
    try {
      await ik.deleteFolder(folderPath);
    } catch {
      // Folder may not exist if no files were uploaded
    }
  } catch {
    // Silently handle if folder doesn't exist
  }
}

/**
 * Get the upload folder path for an event
 */
export function getEventFolder(eventId: string): string {
  return `/epms/events/${eventId}`;
}

/**
 * Validate image file: MIME type and size (max 6MB)
 */
export function validateImageFile(
  mimeType: string,
  sizeBytes: number
): { valid: boolean; error?: string } {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  const MAX_SIZE = 6 * 1024 * 1024; // 6MB

  if (!allowedTypes.includes(mimeType)) {
    return { valid: false, error: 'Only image files (PNG, JPEG, WebP, GIF) are allowed' };
  }
  if (sizeBytes > MAX_SIZE) {
    return { valid: false, error: 'File size must be 6MB or less' };
  }
  return { valid: true };
}
