import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenUrl = 'https://www.radartask.com/apid/token';
  private loginUrl = 'https://www.radartask.com/apid/ejecutores/login';
  private token = '';

  constructor(private http: HttpClient, private router: Router) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'APP-Request-Origin': 'RadartaskAPP',
      Authorization: `Bearer ${this.token}`,
    });
  }

  getToken(): Observable<any> {
    const body = {
      id_solicitante: 3,
      customer_secret: 'test',
      customer_key: '11223344',
    };

    return this.http
      .post(this.tokenUrl, body, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('API Response:', response);

          // Extract the token correctly from response.data.token
          if (response && response.data && response.data.token) {
            this.token = response.data.token;
            console.log('Token obtained:', this.token);
          } else {
            console.error('Token not found in response');
          }
        })
      );
  }

  login(id_ejecutor: string, password: string): Observable<any> {
    const body = { id_ejecutor, password };
    return this.http
      .post(this.loginUrl, body, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          if (response && response.data) {
            this.token = response.data.token || this.token;
            localStorage.setItem('userToken', this.token);
            localStorage.setItem('userId', response.data.id);
            localStorage.setItem('userName', response.data.name);

            console.log('User data stored:', response.data);
          }
        })
      );
  }

  getStoredToken(): string | null {
    return localStorage.getItem('userToken');
  }
  isLoggedIn(): boolean {
    const token = this.getStoredToken();
    return token !== null && !this.isTokenExpired(token);
  }
  

  getUserData(): { id: string; name: string } {
    return {
      id: localStorage.getItem('userId') || '',
      name: localStorage.getItem('userName') || '',
    };
  }

  logout() {
    this.router.navigate(['/login'], { replaceUrl: true });
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    console.log('User logged out');
  }

  isTokenExpired(token: string): boolean {
    const tokenPayload = this.decodeToken(token);
    if (tokenPayload) {
      const currentTime = Math.floor(new Date().getTime() / 1000);
      return tokenPayload.exp < currentTime;
    }
    return true;
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
}
