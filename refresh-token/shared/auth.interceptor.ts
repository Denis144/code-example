import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthState } from '@app/core/auth/state/auth.state';
import { Store } from '@ngxs/store';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { switchMap, catchError, map, tap, filter, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Logout, RefreshToken } from '../state/auth.actions';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private store: Store, private authService: AuthService) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isExcludingRequest = request.url.includes('user/sessions') && request.method === 'PUT';

    if (!request.url.startsWith(process.env.API_URL)) {
      return next.handle(request);
    }

    const user = this.store.selectSnapshot(AuthState.user);

    if (!isExcludingRequest && user && user.token) {
      request = this.addToken(request, user.token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401 && user) {
          return this.handle401Error(request, next);
        } else {
          return throwError(error);
        }
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    const user = this.store.selectSnapshot(AuthState.user);
    this.refreshTokenSubject.next(null);

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.store.dispatch(new RefreshToken(user.id, user.refreshToken)).pipe(
        map(({ auth }) => {
          return auth.user;
        }),
        switchMap(({ token, refreshToken }) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(refreshToken);
          return next.handle(this.addToken(request, token));
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        take(1),
        tap(refreshToken => {
          if (!refreshToken) {
            this.store.dispatch(new Logout());
            this.isRefreshing = false;
          }
        }),
        filter(refreshToken => refreshToken != null),
        switchMap(refreshToken => {
          return next.handle(this.addToken(request, refreshToken));
        })
      );
    }
  }
}
