import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageProcessorService {
  private readonly maxWidth = 1920;
  private readonly maxHeight = 1080;
  private readonly quality = 0.85;
  private readonly outputFormat = 'image/webp';

  async processImage(file: File): Promise<Blob> {
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo no es una imagen válida');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = async () => {
          try {
            const processedBlob = await this._resizeAndCompress(img);
            resolve(processedBlob);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error('Error al cargar la imagen'));
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsDataURL(file);
    });
  }

  private _resizeAndCompress(img: HTMLImageElement): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return Promise.reject(new Error('No se pudo obtener el contexto 2D del canvas'));
    }

    const { width, height } = this._calculateDimensions(img.width, img.height);
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error al crear el blob de la imagen'));
          }
        },
        this.outputFormat,
        this.quality
      );
    });
  }

  private _calculateDimensions(originalWidth: number, originalHeight: number): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    if (width > this.maxWidth || height > this.maxHeight) {
      const aspectRatio = width / height;

      if (width > height) {
        width = this.maxWidth;
        height = Math.round(width / aspectRatio);
      } else {
        height = this.maxHeight;
        width = Math.round(height * aspectRatio);
      }
    }

    return { width, height };
  }

  async getImageInfo(file: File): Promise<{ width: number; height: number; size: number; type: string; name: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
            size: file.size,
            type: file.type,
            name: file.name
          });
        };

        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  blobToFile(blob: Blob, fileName: string): File {
    return new File([blob], fileName.replace(/\.[^/.]+$/, "") + '.webp', {
      type: blob.type,
      lastModified: Date.now()
    });
  }
}
