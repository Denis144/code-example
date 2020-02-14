import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUser } from '@lib/interfaces';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthService {
  constructor(private http: HttpClient) {}

  public checkSession(): Observable<IUser> {
    return this.http.get<IUser>(`${process.env.API_URL}/user/sessions`);
  }

  public refreshToken(id: number, refreshToken: string): Observable<IUser> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${refreshToken}`);
    return this.http.put<IUser>(`${process.env.API_URL}/user/sessions`, { id }, { headers }).pipe(
      catchError(error => {
        return throwError((error.error && error.error.errors) || error);
      })
    );
  }

  public login(email: string, password: string): Observable<IUser> {
    return this.http
      .post<IUser>(`${process.env.API_URL}/user/sessions`, { email, password })
      .pipe(catchError(error => throwError((error.error && error.error.errors) || error)));
  }

  public autoLogin(token: string): Observable<IUser> {
    return this.http
      .post<IUser>(`${process.env.API_URL}/user/sessions`, { autoLoginToken: token })
      .pipe(catchError(error => throwError((error.error && error.error.errors) || error)));
  }

  public activate(token: string, password: string): Observable<IUser> {
    return this.http
      .post<IUser>(`${process.env.API_URL}/user/activation`, { token, password })
      .pipe(catchError(error => throwError((error.error && error.error.errors) || error)));
  }

  public recoverPassword(email: string): Observable<IUser> {
    return this.http
      .post<IUser>(`${process.env.API_URL}/user/recovery`, { email })
      .pipe(catchError(error => throwError((error.error && error.error.errors) || error)));
  }
}
