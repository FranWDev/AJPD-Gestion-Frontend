import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsService } from '../../../core/services/news.service';
import { ImageProcessorService } from '../../../core/services/image-processor.service';
import { ModalConfirmService } from '../../../shared/components/modal-confirm/modal-confirm.service';
import { ModalService } from '../../../core/services/modal.service';
import { Publication, EditorJSData } from '../../../core/models/web.model';
import { EditorComponent } from './editor/editor';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-noticias',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorComponent, SkeletonComponent],
  templateUrl: './noticias.html',
  styleUrl: './noticias.css'
})
export class NoticiasComponent implements OnInit {
  private readonly newsService = inject(NewsService);
  private readonly imageProcessor = inject(ImageProcessorService);
  private readonly modalConfirm = inject(ModalConfirmService);
  private readonly modalService = inject(ModalService);

  readonly editor = viewChild<EditorComponent>('appEditor');

  readonly publicaciones = signal<Publication[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly procesandoImagen = signal(false);

  // Form states
  readonly title = signal('');
  readonly description = signal('');
  readonly imageUrl = signal<string | null>(null);
  readonly editorData = signal<EditorJSData | undefined>(undefined);
  readonly isEditing = signal(false);

  ngOnInit(): void {
    this.cargarPublicaciones();
  }

  cargarPublicaciones(): void {
    this.cargando.set(true);
    this.newsService.getAll().subscribe({
      next: (data) => {
        this.publicaciones.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar publicaciones', err);
        this.modalService.showError('Error', 'No se pudieron cargar las noticias de la web.');
        this.cargando.set(false);
      }
    });
  }

  async onSubirImagen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.modalService.showError('Error', 'Por favor selecciona una imagen válida');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.modalService.showError('Error', 'La imagen supera el tamaño máximo permitido (10MB)');
      return;
    }

    try {
      this.procesandoImagen.set(true);

      const originalInfo = await this.imageProcessor.getImageInfo(file);
      console.log('Imagen original:', originalInfo);

      const processedBlob = await this.imageProcessor.processImage(file);
      const processedFile = this.imageProcessor.blobToFile(processedBlob, file.name);

      const reduction = ((1 - processedFile.size / file.size) * 100).toFixed(1);
      console.log(`Imagen destacada optimizada: ${(processedFile.size / 1024).toFixed(2)} KB (reducción del ${reduction}%)`);

      this.newsService.uploadImage(processedFile).subscribe({
        next: (res) => {
          if (res.success && res.file.url) {
            this.imageUrl.set(res.file.url);
            this.modalService.showSuccess('Imagen subida', `Imagen procesada y subida con éxito (reducción del ${reduction}%).`);
          } else {
            this.modalService.showError('Error', 'El servidor no devolvió una URL válida de imagen.');
          }
          this.procesandoImagen.set(false);
        },
        error: (err) => {
          console.error('Error al subir imagen', err);
          this.modalService.showError('Error', 'Error al subir la imagen al servidor.');
          this.procesandoImagen.set(false);
        }
      });
    } catch (error: any) {
      console.error('Error al procesar la imagen', error);
      this.modalService.showError('Error', error.message || 'Error al procesar la imagen.');
      this.procesandoImagen.set(false);
    }
  }

  async guardarPublicacion(): Promise<void> {
    if (!this.title().trim()) {
      this.modalService.showWarning('Atención', 'El título de la noticia es obligatorio.');
      return;
    }

    if (!this.description().trim()) {
      this.modalService.showWarning('Atención', 'La descripción corta de la noticia es obligatoria.');
      return;
    }

    if (!this.imageUrl()) {
      this.modalService.showWarning('Atención', 'Debes seleccionar una imagen destacada.');
      return;
    }

    const editorComp = this.editor();
    if (!editorComp) {
      this.modalService.showError('Error', 'El editor no está cargado.');
      return;
    }

    try {
      this.guardando.set(true);
      const content = await editorComp.save();

      const publicacion: Publication = {
        title: this.title(),
        description: this.description(),
        imageUrl: this.imageUrl()!,
        editorContent: content
      };

      this.newsService.save(publicacion).subscribe({
        next: () => {
          this.modalService.showSuccess('Guardado', 'La noticia ha sido guardada correctamente.');
          this.limpiarFormulario();
          this.cargarPublicaciones();
          this.guardando.set(false);
        },
        error: (err) => {
          console.error('Error al guardar noticia', err);
          this.modalService.showError('Error', 'No se pudo guardar la noticia.');
          this.guardando.set(false);
        }
      });
    } catch (error: any) {
      console.error('Error al procesar bloques de EditorJS', error);
      this.modalService.showError('Error', 'Error al guardar los bloques del editor: ' + error.message);
      this.guardando.set(false);
    }
  }

  editar(pub: Publication): void {
    this.title.set(pub.title);
    this.description.set(pub.description);
    this.imageUrl.set(pub.imageUrl);
    this.editorData.set(pub.editorContent);
    this.isEditing.set(true);

    // Scroll to form on top/side
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminar(pub: Publication): void {
    this.modalConfirm.open({
      titulo: 'Eliminar noticia',
      mensaje: `¿Deseas eliminar permanentemente la noticia "${pub.title}"? Esta acción no se puede deshacer.`,
      tipo: 'danger',
      labelConfirmar: 'Eliminar',
      onConfirmar: () => {
        this.newsService.delete(pub.title).subscribe({
          next: () => {
            this.modalService.showSuccess('Eliminado', 'La noticia ha sido eliminada correctamente.');
            this.cargarPublicaciones();
          },
          error: (err) => {
            console.error('Error al eliminar noticia', err);
            this.modalService.showError('Error', 'No se pudo eliminar la noticia.');
          }
        });
      }
    });
  }

  limpiarFormulario(): void {
    this.title.set('');
    this.description.set('');
    this.imageUrl.set(null);
    this.editorData.set(undefined);
    this.isEditing.set(false);
    const editorComp = this.editor();
    if (editorComp) {
      editorComp.clear();
    }
  }
}
