import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroImageService } from '../../../core/services/hero-image.service';
import { ImageProcessorService } from '../../../core/services/image-processor.service';
import { ModalService } from '../../../core/services/modal.service';
import { firstValueFrom } from 'rxjs';

interface HeroState {
  name: string;
  url: string;
  processedFile: File | null;
  status: string;
  statusType: 'success' | 'error' | 'loading' | '';
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css'
})
export class HeroComponent implements OnInit {
  private readonly heroService = inject(HeroImageService);
  private readonly imageProcessor = inject(ImageProcessorService);
  private readonly modalService = inject(ModalService);

  readonly heroes = signal<HeroState[]>([
    { name: 'hero1', url: '', processedFile: null, status: '', statusType: '' },
    { name: 'hero2', url: '', processedFile: null, status: '', statusType: '' },
    { name: 'hero3', url: '', processedFile: null, status: '', statusType: '' }
  ]);

  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.cargarImagenes();
  }

  cargarImagenes(): void {
    this.isLoading.set(true);
    this.heroService.getAll().subscribe({
      next: (resList) => {
        resList.forEach((res) => {
          const idx = this.heroes().findIndex(h => h.name === res.heroName);
          if (idx !== -1) {
            this.updateHeroState(idx, { url: res.url });
          }
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar imágenes hero', err);
        this.heroes().forEach((hero, index) => {
          this.updateHeroState(index, { status: 'No se pudo cargar la imagen', statusType: 'error' });
        });
        this.isLoading.set(false);
      }
    });
  }

  private updateHeroState(index: number, changes: Partial<HeroState>): void {
    this.heroes.update(current => {
      const updated = [...current];
      updated[index] = { ...updated[index], ...changes };
      return updated;
    });
  }

  async onFileSelected(index: number, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const hero = this.heroes()[index];

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      this.updateHeroState(index, { status: 'Solo se aceptan JPEG, PNG, WebP o GIF.', statusType: 'error' });
      return;
    }

    // Validar tamaño
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.updateHeroState(index, { status: 'El archivo excede los 10MB.', statusType: 'error' });
      return;
    }

    this.updateHeroState(index, { status: 'Procesando imagen...', statusType: 'loading' });

    try {
      const processedBlob = await this.imageProcessor.processImage(file);
      const processedFile = this.imageProcessor.blobToFile(
        processedBlob,
        `${hero.name}_${Date.now()}.webp`
      );

      // Read for local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        const reduction = ((1 - processedFile.size / file.size) * 100).toFixed(1);
        this.updateHeroState(index, {
          url: previewUrl,
          processedFile: processedFile,
          status: `Lista (${(processedFile.size / 1024).toFixed(1)}KB, -${reduction}%)`,
          statusType: 'success'
        });
      };
      reader.readAsDataURL(processedBlob);
    } catch (error: any) {
      console.error('Error al procesar imagen', error);
      this.updateHeroState(index, { status: 'Error al procesar la imagen.', statusType: 'error' });
    }
  }

  subirImagen(index: number): void {
    const hero = this.heroes()[index];
    if (!hero.processedFile) return;

    this.updateHeroState(index, { status: 'Subiendo...', statusType: 'loading' });

    this.heroService.upload(hero.name, hero.processedFile).subscribe({
      next: (res) => {
        this.updateHeroState(index, {
          url: res.url + '?t=' + Date.now(),
          processedFile: null,
          status: 'Imagen actualizada con éxito.',
          statusType: 'success'
        });
        this.modalService.showSuccess('Actualizado', `La imagen de ${hero.name} ha sido actualizada.`);
      },
      error: (err) => {
        console.error('Error al subir imagen', err);
        this.updateHeroState(index, { status: 'Error al subir la imagen.', statusType: 'error' });
      }
    });
  }

  async restaurarHero(index: number): Promise<void> {
    const hero = this.heroes()[index];
    if (hero.name === 'hero1') return;

    if (!confirm(`¿Restaurar "${hero.name}" con la imagen base de hero1?`)) {
      return;
    }

    this.updateHeroState(index, { status: 'Restaurando...', statusType: 'loading' });

    try {
      // 1. Obtener URL de hero1
      const hero1Res = await firstValueFrom(this.heroService.getUrl('hero1'));
      const hero1Url = hero1Res.url;

      // 2. Descargar imagen de hero1 como Blob
      const imageResponse = await fetch(hero1Url);
      const blob = await imageResponse.blob();

      // 3. Crear archivo WebP simulado
      const file = new File([blob], 'hero1.webp', { type: blob.type });

      // 4. Subir la imagen al endpoint de hero2/3
      this.heroService.upload(hero.name, file).subscribe({
        next: (res) => {
          this.updateHeroState(index, {
            url: res.url + '?t=' + Date.now(),
            processedFile: null,
            status: 'Imagen restaurada con éxito.',
            statusType: 'success'
          });
          this.modalService.showSuccess('Restaurado', `La imagen de ${hero.name} ha sido restaurada con la de hero1.`);
        },
        error: (err) => {
          console.error('Error al restaurar hero', err);
          this.updateHeroState(index, { status: 'Error al restaurar la imagen.', statusType: 'error' });
        }
      });
    } catch (error) {
      console.error('Error al restaurar hero', error);
      this.updateHeroState(index, { status: 'Error al restaurar la imagen.', statusType: 'error' });
    }
  }
}
