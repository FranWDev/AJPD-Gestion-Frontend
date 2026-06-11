import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [],
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.css',
})
export class SkeletonComponent {
  /** Number of skeleton rows/cards to show */
  @Input() rows = 5;

  /** Number of columns in the desktop table skeleton */
  @Input() cols = 4;

  /** Width (%) for each column cell. Falls back to auto if not provided */
  @Input() colWidths: number[] = [];

  /** Real header labels to display in the desktop thead (instead of shimmer placeholders) */
  @Input() headers: string[] = [];

  /** Variant: 'table' (miembros/historial global), 'maestro' (cargos/centros), 'timeline' (historial individual) */
  @Input() variant: 'table' | 'maestro' | 'timeline' = 'table';

  get rowsArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }

  get colsArray(): number[] {
    return Array.from({ length: this.cols }, (_, i) => i);
  }

  colWidth(i: number): string {
    return this.colWidths[i] != null ? `${this.colWidths[i]}%` : 'auto';
  }

  headerLabel(i: number): string {
    return this.headers[i] ?? '';
  }

  get hasHeaders(): boolean {
    return this.headers.length > 0;
  }
}
