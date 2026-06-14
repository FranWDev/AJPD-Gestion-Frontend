import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class HeroImageService {
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);
  private readonly base = `${environment.apiUrl}/api/hero-images`;

  getAll(): Observable<{ heroName: string; url: string }[]> {
    return this.cacheService.get(
      'hero:all',
      this.http.get<{ heroName: string; url: string }[]>(this.base)
    );
  }

  getUrl(heroName: string): Observable<{ heroName: string; url: string }> {
    return this.http.get<{ heroName: string; url: string }>(`${this.base}/${heroName}/url`);
  }

  upload(heroName: string, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.put<{ url: string }>(`${this.base}/${heroName}`, formData).pipe(
      tap(() => this.cacheService.clearPrefix('hero:'))
    );
  }

  reset(heroName: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${heroName}`).pipe(
      tap(() => this.cacheService.clearPrefix('hero:'))
    );
  }
}
