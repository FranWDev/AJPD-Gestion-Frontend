import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';
import { Publication, ImageUploadResponse } from '../models/web.model';
import { PageResponse } from '../models/miembro.model';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);
  private readonly base = `${environment.apiUrl}/api/news`;
  private readonly imagesBase = `${environment.apiUrl}/api/images`;

  getAll(): Observable<Publication[]> {
    return this.cacheService.get('news:all', this.http.get<Publication[]>(this.base));
  }

  getPaginated(search?: string, page: number = 0, size: number = 10): Observable<PageResponse<Publication>> {
    const query = search ? search.trim() : '';
    const key = `news:list:${page}:${size}:${query}`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (query) {
      params = params.set('search', query);
    }
    return this.cacheService.get(key, this.http.get<PageResponse<Publication>>(this.base, { params }));
  }

  getByIdentifier(identifier: string): Observable<Publication> {
    const key = `news:detail:${identifier}`;
    return this.cacheService.get(key, this.http.get<Publication>(`${this.base}/${encodeURIComponent(identifier)}`));
  }

  save(publication: Publication): Observable<Publication> {
    return this.http.post<Publication>(this.base, publication).pipe(
      tap(() => this.cacheService.clearPrefix('news:'))
    );
  }

  delete(identifier: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(identifier)}`).pipe(
      tap(() => this.cacheService.clearPrefix('news:'))
    );
  }

  uploadImage(file: File): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<any>(`${this.imagesBase}/upload`, formData).pipe(
      map(res => ({
        success: res.success ? 1 : 0,
        file: {
          url: res.file?.url || '',
          name: res.file?.name
        }
      }))
    );
  }
}
