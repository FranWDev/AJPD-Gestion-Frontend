import { Component, OnInit, OnDestroy, inject, signal, viewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
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
export class NoticiasComponent implements OnInit, OnDestroy {
  private readonly newsService = inject(NewsService);
  private readonly imageProcessor = inject(ImageProcessorService);
  private readonly modalConfirm = inject(ModalConfirmService);
  private readonly modalService = inject(ModalService);
  private readonly sanitizer = inject(DomSanitizer);

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

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
  readonly editandoTitle = signal<string | null>(null);
  readonly editandoCreatedAt = signal<string | null>(null);
  readonly listadoVisible = signal(typeof window !== 'undefined' ? window.innerWidth > 1024 : true);

  // Pagination & Search states
  readonly filtroBusqueda = signal('');
  readonly buscar = signal<string | undefined>(undefined);
  readonly pagina = signal(0);
  readonly tamano = signal(10);
  readonly noMasNoticias = signal(false);
  readonly cargandoMas = signal(false);
  readonly verPublicacion = signal<Publication | null>(null);
  readonly isClosingPreview = signal(false);

  cerrarPublicacion(): void {
    this.isClosingPreview.set(true);
    setTimeout(() => {
      this.verPublicacion.set(null);
      this.isClosingPreview.set(false);
    }, 200);
  }

  private readonly destroy$ = new Subject<void>();
  private readonly buscarSubject = new Subject<string>();

  ngOnInit(): void {
    this.cargarPublicaciones(true);

    this.buscarSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(valor => {
      this.buscar.set(valor || undefined);
      this.cargarPublicaciones(true);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleListado(): void {
    this.listadoVisible.update(visible => !visible);
  }

  cargarPublicaciones(reset: boolean = false): void {
    if (reset) {
      this.pagina.set(0);
      this.noMasNoticias.set(false);
      this.cargando.set(true);
    } else {
      if (this.cargando() || this.cargandoMas() || this.noMasNoticias()) return;
      if (this.pagina() > 0) {
        this.cargandoMas.set(true);
      } else {
        this.cargando.set(true);
      }
    }

    this.newsService.getPaginated(this.buscar(), this.pagina(), this.tamano()).subscribe({
      next: (page) => {
        if (reset || this.pagina() === 0) {
          this.publicaciones.set(page.content);
        } else {
          this.publicaciones.update(prev => [...prev, ...page.content]);
        }

        if (page.content.length < this.tamano() || (this.pagina() + 1) >= page.totalPages) {
          this.noMasNoticias.set(true);
        } else {
          this.noMasNoticias.set(false);
        }

        this.cargando.set(false);
        this.cargandoMas.set(false);
      },
      error: (err) => {
        console.error('Error al cargar publicaciones', err);
        this.modalService.showError('Error', 'No se pudieron cargar las publicaciones de la web.');
        this.cargando.set(false);
        this.cargandoMas.set(false);
      }
    });
  }

  onBuscarChange(valor: string): void {
    this.filtroBusqueda.set(valor);
    this.buscarSubject.next(valor);
  }

  limpiarBusqueda(): void {
    this.filtroBusqueda.set('');
    this.buscarSubject.next('');
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const threshold = 50; // pixels from bottom
    const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < threshold;

    if (atBottom && !this.cargando() && !this.cargandoMas() && !this.noMasNoticias()) {
      this.pagina.update(p => p + 1);
      this.cargarPublicaciones();
    }
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
      this.modalService.showWarning('Atención', 'El título de la publicación es obligatorio.');
      return;
    }

    if (!this.description().trim()) {
      this.modalService.showWarning('Atención', 'La descripción corta de la publicación es obligatoria.');
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
        editorContent: content,
        ...(this.isEditing() && this.editandoCreatedAt() ? { createdAt: this.editandoCreatedAt()! } : {}),
        ...(this.isEditing() && this.editandoTitle() ? { oldTitle: this.editandoTitle()! } : {})
      };

      this.newsService.save(publicacion).subscribe({
        next: () => {
          this.modalService.showSuccess('Guardado', 'La publicación ha sido guardada correctamente.');
          this.limpiarFormulario();
          this.cargarPublicaciones(true);
          this.guardando.set(false);
        },
        error: (err) => {
          console.error('Error al guardar publicación', err);
          this.modalService.showError('Error', 'No se pudo guardar la publicación.');
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
    this.editandoTitle.set(pub.title);
    this.editandoCreatedAt.set(pub.createdAt || null);

    // Auto collapse list on mobile to focus on the editor
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      this.listadoVisible.set(false);
    }

    // Scroll to form on top/side
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminar(pub: Publication): void {
    this.modalConfirm.open({
      titulo: 'Eliminar publicación',
      mensaje: `¿Deseas eliminar permanentemente la publicación "${pub.title}"? Esta acción no se puede deshacer.`,
      tipo: 'danger',
      labelConfirmar: 'Eliminar',
      onConfirmar: () => {
        this.newsService.delete(pub.title).subscribe({
          next: () => {
            this.modalService.showSuccess('Eliminado', 'La publicación ha sido eliminada correctamente.');
            if (this.editandoTitle() === pub.title) {
              this.limpiarFormulario();
            }
            this.cargarPublicaciones(true);
          },
          error: (err) => {
            console.error('Error al eliminar publicación', err);
            this.modalService.showError('Error', 'No se pudo eliminar la publicación.');
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
    this.editandoTitle.set(null);
    this.editandoCreatedAt.set(null);

    // Auto collapse list on mobile to focus on the editor
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      this.listadoVisible.set(false);
    }

    const editorComp = this.editor();
    if (editorComp) {
      editorComp.clear();
    }
  }
}
