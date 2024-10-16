import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private locationUrl = 'https://www.radartask.com/apid/ubicacion/byParams';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'APP-Request-Origin': 'RadartaskAPP',
      'Authorization': `Bearer ${this.authService.getStoredToken()}`
    });
  }

  getLocations(ids: string[]): Observable<any> {
    const body = { id_ubicacion: ids };
    return this.http.post(this.locationUrl, body, { headers: this.getHeaders() });
  }
}