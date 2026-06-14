import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ImageProcessorService } from '../../../../core/services/image-processor.service';
import { NewsService } from '../../../../core/services/news.service';
import { EditorJSData } from '../../../../core/models/web.model';

// @ts-ignore
import EditorJS from '@editorjs/editorjs';
// @ts-ignore
import Header from '@editorjs/header';
// @ts-ignore
import Quote from '@editorjs/quote';
// @ts-ignore
import Warning from '@editorjs/warning';
// @ts-ignore
import Delimiter from '@editorjs/delimiter';
// @ts-ignore
import NestedList from '@editorjs/nested-list';
// @ts-ignore
import Checklist from '@editorjs/checklist';
// @ts-ignore
import ImageTool from '@editorjs/image';
// @ts-ignore
import Embed from '@editorjs/embed';
// @ts-ignore
import Table from '@editorjs/table';
// @ts-ignore
import Marker from '@editorjs/marker';
// @ts-ignore
import Underline from '@editorjs/underline';

class EmbedFixed extends Embed {
  static get sanitize() {
    return {
      service: false,
      source: false,
      embed: false,
      width: false,
      height: false,
      caption: {}
    };
  }
}

@Component({
  selector: 'app-editorjs',
  standalone: true,
  templateUrl: './editor.html',
  styleUrl: './editor.css'
})
export class EditorComponent implements OnInit, OnChanges, OnDestroy {
  private readonly imageProcessor = inject(ImageProcessorService);
  private readonly newsService = inject(NewsService);

  @Input() data?: EditorJSData;
  @Output() onChange = new EventEmitter<void>();

  private editor: any;
  private isReady = false;

  ngOnInit(): void {
    this.initEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange && this.isReady) {
      this.editor.blocks.render(this.normalizeData(this.data) || { blocks: [] });
    }
  }

  ngOnDestroy(): void {
    if (this.editor) {
      try {
        this.editor.destroy();
      } catch (e) {
        console.error('Error destroying EditorJS', e);
      }
    }
  }

  private normalizeData(data?: EditorJSData): EditorJSData | undefined {
    if (!data || !data.blocks) return data;

    const normalizeItems = (items: any[]): any[] => {
      if (!Array.isArray(items)) return [];
      return items.map(item => {
        if (typeof item === 'string') {
          return { content: item, items: [] };
        } else if (item && typeof item === 'object') {
          return {
            content: item.content || '',
            items: normalizeItems(item.items || [])
          };
        }
        return { content: '', items: [] };
      });
    };

    const normalizedBlocks = data.blocks.map((block: any) => {
      if ((block.type === 'list' || block.type === 'nestedList') && block.data && block.data.items) {
        return {
          ...block,
          data: {
            ...block.data,
            items: normalizeItems(block.data.items)
          }
        };
      }
      return block;
    });

    return {
      ...data,
      blocks: normalizedBlocks
    };
  }

  private initEditor(): void {
    this.editor = new EditorJS({
      holder: 'editorjs-holder',
      autofocus: false,
      placeholder: 'Escribe la publicación aquí...',
      data: this.normalizeData(this.data) || { blocks: [] },
      tools: {
        header: {
          class: Header as any,
          inlineToolbar: true,
          config: {
            levels: [1, 2, 3],
            defaultLevel: 2
          }
        },
        quote: {
          class: Quote as any,
          inlineToolbar: true
        },
        warning: {
          class: Warning as any,
          inlineToolbar: true
        },
        delimiter: Delimiter as any,
        list: {
          class: NestedList as any,
          inlineToolbar: true
        },
        nestedList: {
          class: NestedList as any,
          inlineToolbar: true
        },
        checklist: {
          class: Checklist as any,
          inlineToolbar: true
        },
        image: {
          class: ImageTool as any,
          config: {
            uploader: {
              uploadByFile: (file: File) => this.uploadByFile(file)
            }
          }
        },
        embed: {
          class: EmbedFixed as any,
          config: {
            services: {
              youtube: true,
              vimeo: true
            }
          }
        },
        table: {
          class: Table as any,
          inlineToolbar: true
        },
        marker: {
          class: Marker as any
        },
        underline: Underline as any
      },
      onChange: () => {
        this.onChange.emit();
      },
      onReady: () => {
        this.isReady = true;
      }
    });
  }

  async save(): Promise<EditorJSData> {
    if (!this.editor) {
      throw new Error('Editor no inicializado');
    }
    return await this.editor.save();
  }

  async clear(): Promise<void> {
    if (this.editor) {
      await this.editor.clear();
    }
  }

  private async uploadByFile(file: File): Promise<any> {
    try {
      const processedBlob = await this.imageProcessor.processImage(file);
      const processedFile = this.imageProcessor.blobToFile(processedBlob, file.name);
      return await firstValueFrom(this.newsService.uploadImage(processedFile));
    } catch (error) {
      console.error('Error uploading image in EditorJS:', error);
      return {
        success: 0,
        file: { url: '' }
      };
    }
  }
}
