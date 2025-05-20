import { getFileExtension } from '../directories.js';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio?: boolean;
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function resizeImage(
  file: File,
  options: ResizeOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    maintainAspectRatio = true,
    format = 'jpeg',
    quality = 0.8
  } = options;

  return new Promise(async (resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (maintainAspectRatio) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        } else {
          width = Math.min(width, maxWidth);
          height = Math.min(height, maxHeight);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            resolve(blob);
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

export function isImage(file: File): boolean {
  const ext = getFileExtension(file.name).toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
}

export function createImageThumbnail(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const resized = await resizeImage(file, {
        maxWidth: 200,
        maxHeight: 200,
        format: 'jpeg',
        quality: 0.7
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to create thumbnail'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(resized);
    } catch (error) {
      reject(error);
    }
  });
}

export function getImagePlaceholder(mimeType: string): string {
  // Return a base64 encoded placeholder image based on mime type
  // You can implement different placeholders for different image types
  return 'data:image/svg+xml;base64,...'; // Implement your placeholder logic
}