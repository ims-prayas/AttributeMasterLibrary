import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    // add authorization header with jwt token if available
    let token: string | null = localStorage.getItem('TOKEN'); // Retrieves 'TOKEN' key from localStorage
    if (token) {
      token = JSON.parse(token); // Parses the token only if it's not null
    }
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `${token}`,
        },
        withCredentials: true,
      });
    }
    // this.spinnerService.show("Data Processing please wait");
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      }),
      finalize(() => {
        //   this.spinnerService.hide();
      }),
    );
  }
}
