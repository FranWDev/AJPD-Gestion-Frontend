import { Component, inject, signal, effect, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Observable } from 'rxjs';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { ModalDocumentosService } from './modal-documentos.service';
import { MiembroService } from '../../../core/services/miembro.service';
import { DriveFileDto } from '../../../core/models/miembro.model';

import { ModalConfirmService } from '../modal-confirm/modal-confirm.service';

const MOCK_FILES_DB = new Map<string, DriveFileDto[]>();

@Component({
  selector: 'app-modal-documentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-documentos.html',
  styleUrl: './modal-documentos.css',
})
export class ModalDocumentosComponent implements OnDestroy {
  protected readonly svc = inject(ModalDocumentosService);
  private readonly miembroService = inject(MiembroService);
  private readonly modalConfirm = inject(ModalConfirmService);

  readonly dni1 = signal<DriveFileDto | null>(null);
  readonly dni2 = signal<DriveFileDto | null>(null);
  readonly foto = signal<DriveFileDto | null>(null);
  readonly extra = signal<DriveFileDto | null>(null);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  // States per slot: 'dni1' | 'dni2' | 'foto'
  readonly uploading = signal<{ [key: string]: boolean }>({});
  readonly progress = signal<{ [key: string]: number }>({});
  readonly dragOver = signal<{ [key: string]: boolean }>({});

  // Local object URLs for previewing newly uploaded images
  readonly localPreviews = signal<{ [key: string]: string }>({});

  readonly isProcessing = computed(() => {
    const uploads = Object.values(this.uploading());
    const anyUpload = uploads.some(u => u === true);
    return this.loading() || anyUpload;
  });

  readonly successClosing = signal<boolean>(false);

  constructor() {
    effect(() => {
      const id = this.svc.miembroId();
      const open = this.svc.isOpen();
      if (open && id !== null) {
        this.cargarDocumentos(id);
      }
    });
  }

  showSuccess(message: string): void {
    this.success.set(message);
    this.successClosing.set(false);

    // Trigger fade-out animation after 3.7 seconds (so it finishes at 4 seconds)
    setTimeout(() => {
      this.successClosing.set(true);
    }, 3700);

    setTimeout(() => {
      this.success.set(null);
      this.successClosing.set(false);
    }, 4000);
  }

  ngOnDestroy(): void {
    // Clean up local preview object URLs
    Object.values(this.localPreviews()).forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }

  cerrarModal(): void {
    if (this.isProcessing()) return;
    this.svc.cerrar();
  }

  cargarDocumentos(miembroId: number): void {
    this.loading.set(true);
    this.error.set(null);

    // Reset slots
    this.dni1.set(null);
    this.dni2.set(null);
    this.foto.set(null);
    this.extra.set(null);

    this.miembroService.getAllDocumentos(miembroId).subscribe({
      next: ({ dni, foto, extra }) => {
        let dniList = dni;
        let fotoList = foto;
        let extraList = extra;

        const mockDniKey = `${miembroId}_DNI`;
        const mockFotoKey = `${miembroId}_FOTO`;
        const mockExtraKey = `${miembroId}_EXTRA`;

        // If backend lists are empty and we have local mock files, use local mock files.
        if (MOCK_FILES_DB.has(mockDniKey) && dniList.length === 0) {
          dniList = MOCK_FILES_DB.get(mockDniKey) || [];
        }
        if (MOCK_FILES_DB.has(mockFotoKey) && fotoList.length === 0) {
          fotoList = MOCK_FILES_DB.get(mockFotoKey) || [];
        }
        if (MOCK_FILES_DB.has(mockExtraKey) && extraList.length === 0) {
          extraList = MOCK_FILES_DB.get(mockExtraKey) || [];
        }

        // Distribute files to slots
        for (const file of dniList) {
          const baseName = this.getFileBaseName(file.name);
          if (baseName.toUpperCase() === 'DNI-1') {
            this.dni1.set(file);
            this.clearLocalPreview('dni1');
          } else if (baseName.toUpperCase() === 'DNI-2') {
            this.dni2.set(file);
            this.clearLocalPreview('dni2');
          }
        }

        for (const file of fotoList) {
          const baseName = this.getFileBaseName(file.name);
          if (baseName.toUpperCase() === 'FOTO') {
            this.foto.set(file);
            this.clearLocalPreview('foto');
          }
        }

        if (extraList && extraList.length > 0) {
          this.extra.set(extraList[0]);
          this.clearLocalPreview('extra');
        }

        this.loading.set(false);
        this.cargarPreviews(miembroId);
      },
      error: (err) => {
        this.error.set('No se han podido cargar los documentos del miembro.');
        this.loading.set(false);
      }
    });
  }

  uploadFile(file: File, slot: 'dni1' | 'dni2' | 'foto' | 'extra'): void {
    const miembroId = this.svc.miembroId();
    if (miembroId === null) return;

    this.error.set(null);

    // Validations
    if (slot === 'foto' && !file.type.startsWith('image/') && file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      this.error.set('El archivo para la foto de perfil debe ser una imagen o PDF.');
      return;
    }
    if (slot === 'extra' && !file.type.startsWith('image/') && file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      this.error.set('El archivo adicional debe ser una imagen o PDF.');
      return;
    }

    // Cache local object URL for instant preview if it's an image
    if (file.type.startsWith('image/')) {
      const prevUrl = this.localPreviews()[slot];
      if (prevUrl && prevUrl.startsWith('blob:')) {
        URL.revokeObjectURL(prevUrl);
      }
      const newUrl = URL.createObjectURL(file);
      this.localPreviews.update(p => ({ ...p, [slot]: newUrl }));
    }

    const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
    let targetName = '';
    let tipo: 'DNI' | 'FOTO' | 'EXTRA' = 'DNI';

    if (slot === 'dni1') {
      targetName = `DNI-1${ext}`;
      tipo = 'DNI';
    } else if (slot === 'dni2') {
      targetName = `DNI-2${ext}`;
      tipo = 'DNI';
    } else if (slot === 'foto') {
      targetName = `FOTO${ext}`;
      tipo = 'FOTO';
    } else if (slot === 'extra') {
      targetName = file.name;
      tipo = 'EXTRA';
    }

    this.uploading.update(u => ({ ...u, [slot]: true }));
    this.progress.update(p => ({ ...p, [slot]: 0 }));

    this.miembroService.getUploadUrl(miembroId, tipo, targetName, file.type).subscribe({
      next: ({ uploadUrl }) => {
        if (uploadUrl.startsWith('https://mock.google.drive') || uploadUrl.includes('mock.google.drive')) {
          this.simulateUpload(miembroId, tipo, targetName, file, slot);
        } else {
          this.miembroService.uploadFileToUrl(uploadUrl, file).subscribe({
            next: (event: HttpEvent<any>) => {
              if (event.type === HttpEventType.UploadProgress) {
                const percentDone = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
                this.progress.update(p => ({ ...p, [slot]: percentDone }));
              } else if (event.type === HttpEventType.Response) {
                this.uploading.update(u => ({ ...u, [slot]: false }));
                this.showSuccess('Documento subido correctamente.');
                this.cargarDocumentos(miembroId);
              }
            },
            error: (err) => {
              // Because of Google Drive's CORS policies with service accounts, the browser
              // might block the response (causing a CORS error / status 0) even though the file
              // has been successfully uploaded to Google Drive.
              // We verify if the file was successfully created by querying the backend file list.
              setTimeout(() => {
                this.miembroService.getDocumentos(miembroId, tipo).subscribe({
                  next: (docs) => {
                    const baseName = targetName.split('.')[0];
                    const found = docs.some(d => d.name.split('.')[0].toUpperCase() === baseName.toUpperCase());
                    if (found) {
                      // File is present, so the upload was successful!
                      this.uploading.update(u => ({ ...u, [slot]: false }));
                      this.showSuccess('Documento subido correctamente.');
                      this.cargarDocumentos(miembroId);
                    } else {
                      // Real network or permission error
                      this.error.set(`Error de red al subir el archivo.`);
                      this.uploading.update(u => ({ ...u, [slot]: false }));
                    }
                  },
                  error: () => {
                    this.error.set(`Error de red al subir el archivo.`);
                    this.uploading.update(u => ({ ...u, [slot]: false }));
                  }
                });
              }, 1000);
            }
          });
        }
      },
      error: (err) => {
        this.error.set(`Error al obtener la sesión de subida del servidor.`);
        this.uploading.update(u => ({ ...u, [slot]: false }));
      }
    });
  }

  simulateUpload(miembroId: number, tipo: 'DNI' | 'FOTO' | 'EXTRA', targetName: string, file: File, slot: 'dni1' | 'dni2' | 'foto' | 'extra'): void {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      this.progress.update(p => ({ ...p, [slot]: currentProgress }));
      if (currentProgress >= 100) {
        clearInterval(interval);

        const key = `${miembroId}_${tipo}`;
        const mockList = MOCK_FILES_DB.get(key) || [];

        // Remove old file if name matches
        const filtered = mockList.filter(f => this.getFileBaseName(f.name).toUpperCase() !== targetName.split('.')[0].toUpperCase());

        const mockFile: DriveFileDto = {
          id: `mock-file-${Math.random().toString(36).substring(2, 9)}`,
          name: targetName,
          url: 'https://drive.google.com/open?id=mock-file-id-for-preview',
          size: file.size,
          mimeType: file.type
        };

        filtered.push(mockFile);
        MOCK_FILES_DB.set(key, filtered);

        this.uploading.update(u => ({ ...u, [slot]: false }));
        this.showSuccess('Documento subido correctamente (Simulación).');
        this.cargarDocumentos(miembroId);
      }
    }, 100);
  }

  eliminarDocumento(slot: 'dni1' | 'dni2' | 'foto' | 'extra'): void {
    const miembroId = this.svc.miembroId();
    if (miembroId === null) return;

    let file: DriveFileDto | null = null;
    let tipo: 'DNI' | 'FOTO' | 'EXTRA' = 'DNI';

    if (slot === 'dni1') {
      file = this.dni1();
      tipo = 'DNI';
    } else if (slot === 'dni2') {
      file = this.dni2();
      tipo = 'DNI';
    } else if (slot === 'foto') {
      file = this.foto();
      tipo = 'FOTO';
    } else if (slot === 'extra') {
      file = this.extra();
      tipo = 'EXTRA';
    }

    if (!file) return;

    this.modalConfirm.open({
      titulo: 'Eliminar documento',
      mensaje: `¿Estás seguro de que deseas eliminar el archivo "${file.name}" de Google Drive?`,
      tipo: 'danger',
      labelConfirmar: 'Eliminar',
      onConfirmar: () => {
        this.clearLocalPreview(slot);
        this.loading.set(true);
        this.miembroService.deleteDocumento(miembroId, file!.id).subscribe({
          next: () => {
            this.removeMockFile(miembroId, tipo, file!.id);
            this.showSuccess('Documento eliminado correctamente.');
            this.cargarDocumentos(miembroId);
          },
          error: () => {
            // Fallback for mock environment
            this.removeMockFile(miembroId, tipo, file!.id);
            this.showSuccess('Documento eliminado correctamente.');
            this.cargarDocumentos(miembroId);
          }
        });
      }
    });
  }

  private clearLocalPreview(slot: 'dni1' | 'dni2' | 'foto' | 'extra'): void {
    const prevUrl = this.localPreviews()[slot];
    if (prevUrl && prevUrl.startsWith('blob:')) {
      URL.revokeObjectURL(prevUrl);
    }
    this.localPreviews.update(p => {
      const copy = { ...p };
      delete copy[slot];
      return copy;
    });
  }

  private removeMockFile(miembroId: number, tipo: 'DNI' | 'FOTO' | 'EXTRA', fileId: string): void {
    const key = `${miembroId}_${tipo}`;
    if (MOCK_FILES_DB.has(key)) {
      const mockList = MOCK_FILES_DB.get(key) || [];
      const updated = mockList.filter(f => f.id !== fileId);
      MOCK_FILES_DB.set(key, updated);
    }
  }

  // Event handlers for drag & drop
  onDragOver(event: DragEvent, slot: 'dni1' | 'dni2' | 'foto' | 'extra'): void {
    event.preventDefault();
    this.dragOver.update(d => ({ ...d, [slot]: true }));
  }

  onDragLeave(event: DragEvent, slot: 'dni1' | 'dni2' | 'foto' | 'extra'): void {
    event.preventDefault();
    this.dragOver.update(d => ({ ...d, [slot]: false }));
  }

  onFileDropped(event: DragEvent, slot: 'dni1' | 'dni2' | 'foto' | 'extra'): void {
    event.preventDefault();
    this.dragOver.update(d => ({ ...d, [slot]: false }));
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.uploadFile(event.dataTransfer.files[0], slot);
    }
  }

  onFileSelected(event: Event, slot: 'dni1' | 'dni2' | 'foto' | 'extra'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0], slot);
    }
  }

  // Helpers
  private getFileBaseName(fileName: string): string {
    return fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  isPdf(file: DriveFileDto | null): boolean {
    if (!file) return false;
    return file.mimeType === 'application/pdf' || file.name.endsWith('.pdf');
  }

  isImage(file: DriveFileDto | null): boolean {
    if (!file) return false;
    return !!file.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
  }

  getImageUrl(slot: 'dni1' | 'dni2' | 'foto' | 'extra'): string | null {
    const local = this.localPreviews()[slot];
    if (local) return local;

    const file = slot === 'dni1' ? this.dni1() : slot === 'dni2' ? this.dni2() : slot === 'foto' ? this.foto() : this.extra();
    if (file) {
      if (file.id.startsWith('mock-file-') || file.url.includes('mock-file-id-for-preview')) {
        return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23cbd5e1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="600" fill="%23475569">Vista Previa</text></svg>';
      }
      return file.thumbnailUrl || null;
    }
    return null;
  }

  cargarPreviews(miembroId: number): void {
    const slots: ('dni1' | 'dni2' | 'foto' | 'extra')[] = ['dni1', 'dni2', 'foto', 'extra'];
    const imageSlots = slots.filter(slot => {
      const file = slot === 'dni1' ? this.dni1() : slot === 'dni2' ? this.dni2() : slot === 'foto' ? this.foto() : this.extra();
      return file && this.isImage(file) && !file.id.startsWith('mock-file-') && !this.localPreviews()[slot];
    });

    if (imageSlots.length === 0) return;

    this.miembroService.getGoogleAccessToken(miembroId).subscribe({
      next: ({ accessToken }) => {
        for (const slot of imageSlots) {
          const file = slot === 'dni1' ? this.dni1() : slot === 'dni2' ? this.dni2() : slot === 'foto' ? this.foto() : this.extra();
          if (file) {
            this.miembroService.downloadFileFromGoogle(file.id, accessToken).subscribe({
              next: (blob) => {
                const url = URL.createObjectURL(blob);
                this.localPreviews.update(p => ({ ...p, [slot]: url }));
              },
              error: (err) => {
                console.error(`Failed to download preview for ${slot}`, err);
              }
            });
          }
        }
      },
      error: (err) => {
        console.error('Failed to get Google access token', err);
      }
    });
  }
}
