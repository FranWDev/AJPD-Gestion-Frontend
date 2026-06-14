import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly cacheMap = new Map<string, any>();

  /**
   * Retrieve a value from the cache, or execute the source observable and cache the result.
   */
  get<T>(key: string, source: Observable<T>): Observable<T> {
    if (this.cacheMap.has(key)) {
      return of(this.cacheMap.get(key));
    }
    return source.pipe(
      tap(value => this.cacheMap.set(key, value))
    );
  }

  /**
   * Manually set a value in the cache.
   */
  set(key: string, value: any): void {
    this.cacheMap.set(key, value);
  }

  /**
   * Evict a specific key from the cache.
   */
  evict(key: string): void {
    this.cacheMap.delete(key);
  }

  /**
   * Clear all cache keys starting with a specific prefix.
   */
  clearPrefix(prefix: string): void {
    for (const key of this.cacheMap.keys()) {
      if (key.startsWith(prefix)) {
        this.cacheMap.delete(key);
      }
    }
  }

  /**
   * Clear all items in the cache.
   */
  clearAll(): void {
    this.cacheMap.clear();
  }
}
