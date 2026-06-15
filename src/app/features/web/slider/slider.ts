import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SliderImageService } from '../../../core/services/slider-image.service';
import { ImageProcessorService } from '../../../core/services/image-processor.service';
import { ModalService } from '../../../core/services/modal.service';

interface SlideState {
  name: string;
  url: string;
  originalCaption: string;
  caption: string;
  processedFile: File | null;
  status: string;
  statusType: 'success' | 'error' | 'loading' | '';
  captionStatus: string;
  captionStatusType: 'success' | 'error' | 'loading' | '';
}

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './slider.html',
  styleUrl: './slider.css'
})
export class SliderComponent implements OnInit {
  private readonly sliderService = inject(SliderImageService);
  private readonly imageProcessor = inject(ImageProcessorService);
  private readonly modalService = inject(ModalService);

  readonly maxChars = 150;

  readonly slides = signal<SlideState[]>([
    { name: 'slide1', url: '', originalCaption: '', caption: '', processedFile: null, status: '', statusType: '', captionStatus: '', captionStatusType: '' },
    { name: 'slide2', url: '', originalCaption: '', caption: '', processedFile: null, status: '', statusType: '', captionStatus: '', captionStatusType: '' },
    { name: 'slide3', url: '', originalCaption: '', caption: '', processedFile: null, status: '', statusType: '', captionStatus: '', captionStatusType: '' },
    { name: 'slide4', url: '', originalCaption: '', caption: '', processedFile: null, status: '', statusType: '', captionStatus: '', captionStatusType: '' },
    { name: 'slide5', url: '', originalCaption: '', caption: '', processedFile: null, status: '', statusType: '', captionStatus: '', captionStatusType: '' },
    { name: 'slide6', url: '', originalCaption: '', caption: '', processedFile: null, status: '', statusType: '', captionStatus: '', captionStatusType: '' }
  ]);

  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.cargarSlides();
  }

  cargarSlides(): void {
    this.isLoading.set(true);
    this.sliderService.getAll().subscribe({
      next: (resList) => {
        resList.forEach((res) => {
          const idx = this.slides().findIndex(s => s.name === res.slideName);
          if (idx !== -1) {
            this.updateSlideState(idx, {
              url: res.imageUrl,
              caption: res.caption || '',
              originalCaption: res.caption || ''
            });
          }
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar slides info', err);
        this.slides().forEach((slide, index) => {
          this.updateSlideState(index, { status: 'No se pudo cargar la información', statusType: 'error' });
        });
        this.isLoading.set(false);
      }
    });
  }

  private updateSlideState(index: number, changes: Partial<SlideState>): void {
    this.slides.update(current => {
      const updated = [...current];
      updated[index] = { ...updated[index], ...changes };
      return updated;
    });
  }

  async onFileSelected(index: number, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const slide = this.slides()[index];

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      this.updateSlideState(index, { status: 'Solo se aceptan JPEG, PNG, WebP o GIF.', statusType: 'error' });
      return;
    }

    // Validar tamaño
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.updateSlideState(index, { status: 'El archivo excede los 10MB.', statusType: 'error' });
      return;
    }

    this.updateSlideState(index, { status: 'Procesando imagen...', statusType: 'loading' });

    try {
      const processedBlob = await this.imageProcessor.processImage(file);
      const processedFile = this.imageProcessor.blobToFile(
        processedBlob,
        `${slide.name}_${Date.now()}.webp`
      );

      // Read for local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        const reduction = ((1 - processedFile.size / file.size) * 100).toFixed(1);
        this.updateSlideState(index, {
          url: previewUrl,
          processedFile: processedFile,
          status: `Lista (${(processedFile.size / 1024).toFixed(1)}KB, -${reduction}%)`,
          statusType: 'success'
        });
      };
      reader.readAsDataURL(processedBlob);
    } catch (error: any) {
      console.error('Error al procesar imagen', error);
      this.updateSlideState(index, { status: 'Error al procesar la imagen.', statusType: 'error' });
    }
  }

  subirImagen(index: number): void {
    const slide = this.slides()[index];
    if (!slide.processedFile) return;

    this.updateSlideState(index, { status: 'Subiendo...', statusType: 'loading' });

    this.sliderService.upload(slide.name, slide.processedFile).subscribe({
      next: (res) => {
        this.updateSlideState(index, {
          url: res.url + '?t=' + Date.now(),
          processedFile: null,
          status: 'Imagen actualizada con éxito.',
          statusType: 'success'
        });
        this.modalService.showSuccess('Actualizado', `La imagen de ${slide.name} ha sido actualizada.`);
      },
      error: (err) => {
        console.error('Error al subir imagen slider', err);
        this.updateSlideState(index, { status: 'Error al subir la imagen.', statusType: 'error' });
      }
    });
  }

  guardarCaption(index: number): void {
    const slide = this.slides()[index];
    const trimmedCaption = slide.caption.trim();

    if (!trimmedCaption) {
      this.updateSlideState(index, { captionStatus: 'El pie de texto no puede estar vacío.', captionStatusType: 'error' });
      return;
    }

    if (trimmedCaption.length > this.maxChars) {
      this.updateSlideState(index, { captionStatus: `El pie de texto no puede exceder ${this.maxChars} caracteres.`, captionStatusType: 'error' });
      return;
    }

    if (trimmedCaption === slide.originalCaption) {
      this.updateSlideState(index, { captionStatus: 'El pie de texto no ha cambiado.', captionStatusType: 'error' });
      return;
    }

    this.updateSlideState(index, { captionStatus: 'Guardando...', captionStatusType: 'loading' });

    this.sliderService.saveCaption(slide.name, trimmedCaption).subscribe({
      next: () => {
        this.updateSlideState(index, {
          originalCaption: trimmedCaption,
          captionStatus: 'Pie de texto guardado con éxito.',
          captionStatusType: 'success'
        });
        this.modalService.showSuccess('Guardado', `El pie de foto de ${slide.name} ha sido guardado.`);
      },
      error: (err) => {
        console.error('Error al guardar caption slider', err);
        this.updateSlideState(index, { captionStatus: 'Error al guardar el pie de texto.', captionStatusType: 'error' });
      }
    });
  }

  onCaptionInput(index: number, value: string): void {
    if (value.length > this.maxChars) {
      value = value.substring(0, this.maxChars);
    }
    this.updateSlideState(index, { caption: value });
  }
}
