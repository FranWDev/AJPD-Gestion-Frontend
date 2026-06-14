import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class SliderImageService {
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);
  private readonly base = `${environment.apiUrl}/api/slider-images`;

  getAll(): Observable<{ slideName: string; imageUrl: string; caption: string }[]> {
    return this.cacheService.get(
      'slider:all',
      this.http.get<{ slideName: string; imageUrl: string; caption: string }[]>(this.base)
    );
  }

  getSliderInfo(slideName: string): Observable<{ slideName: string; imageUrl: string; caption: string }> {
    return this.http.get<{ slideName: string; imageUrl: string; caption: string }>(`${this.base}/${slideName}`);
  }

  getUrl(slideName: string): Observable<{ slideName: string; url: string }> {
    return this.http.get<{ slideName: string; url: string }>(`${this.base}/${slideName}/url`);
  }

  getCaption(slideName: string): Observable<{ slideName: string; caption: string }> {
    return this.http.get<{ slideName: string; caption: string }>(`${this.base}/${slideName}/caption`);
  }

  upload(slideName: string, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.put<{ url: string }>(`${this.base}/${slideName}`, formData).pipe(
      tap(() => this.cacheService.clearPrefix('slider:'))
    );
  }

  saveCaption(slideName: string, caption: string): Observable<any> {
    return this.http.put<any>(`${this.base}/${slideName}/caption`, { caption }).pipe(
      tap(() => this.cacheService.clearPrefix('slider:'))
    );
  }

  delete(slideName: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${slideName}`).pipe(
      tap(() => this.cacheService.clearPrefix('slider:'))
    );
  }
}
