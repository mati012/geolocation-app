import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Geolocation, PositionOptions } from '@capacitor/geolocation';
import { LocationService } from '../location.service';
import { AuthService } from '../auth.service';
import * as L from 'leaflet';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  userData: { id: string; name: string } = { id: '', name: '' };
  currentPosition: { latitude: number; longitude: number } = {
    latitude: 0,
    longitude: 0,
  };
  locationDetails: any;
  map: L.Map | undefined;
  isInsideGeofence: boolean = false;
  showDetails: boolean = false;
  distanceToGeofence: number | null = null;
  positionWatchId: string | null = null;
  currentPositionMarker: L.Marker | null = null;
  locationMarker: L.Marker | null = null;

  constructor(
    private locationService: LocationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userData = this.authService.getUserData();
    this.getLocationDetails();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
    }, 100);
    this.startWatchingPosition();
  }

  async initMap() {
    await this.getCurrentPosition();
    this.map = L.map('map').setView(
      [this.currentPosition.latitude, this.currentPosition.longitude],
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      minZoom: 3,
    }).addTo(this.map);

    this.addMarkers();
  }

  async getCurrentPosition() {
    try {
      if (Capacitor.getPlatform() === 'web') {
        console.log('Running in a browser, skipping permission request...');
        const coordinates = await Geolocation.getCurrentPosition({
          timeout: 10000,
        });
        this.updateCurrentPosition(coordinates);
      } else {
        const permission = await Geolocation.requestPermissions();
        if (permission.location === 'granted') {
          console.log('Fetching current position...');
          const coordinates = await Geolocation.getCurrentPosition({
            timeout: 10000,
          });
          this.updateCurrentPosition(coordinates);
        } else {
          console.error('Geolocation permission not granted');
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }

  async startWatchingPosition() {
    try {
      this.positionWatchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        (position, err) => {
          if (position) {
            console.log('Updated Position:', position);
            this.updateCurrentPosition(position);
          } else if (err) {
            console.error('Error watching position:', err);
          }
        }
      );
    } catch (error) {
      console.error('Error starting to watch position:', error);
    }
  }

  updateCurrentPosition(coordinates: any) {
    this.currentPosition = {
      latitude: Number(coordinates.coords.latitude.toFixed(4)),
      longitude: Number(coordinates.coords.longitude.toFixed(4)),
    };

    this.checkGeofence();

    if (this.map) {
      this.addMarkers();
      // Optionally pan to the new position
      this.map.panTo([this.currentPosition.latitude, this.currentPosition.longitude]);
    }
  }

  getLocationDetails() {
    this.locationService.getLocations(['1791']).subscribe(
      (response) => {
        console.log('API Response:', response);

        if (response && response.data && response.data.length > 0) {
          this.locationDetails = response.data[0];
          console.log('Location Details:', this.locationDetails);

          if (this.map) {
            this.addMarkers();
          }
          this.checkGeofence();
        } else {
          console.error('No location details returned.');
        }
      },
      (error) => {
        console.error('Error fetching location details:', error);
      }
    );
  }

  addMarkers() {
    const customIcon = L.icon({
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    if (this.map && this.currentPosition.latitude) {
      // Update current position marker
      if (this.currentPositionMarker) {
        // If marker exists, just update its position
        this.currentPositionMarker.setLatLng([
          this.currentPosition.latitude,
          this.currentPosition.longitude
        ]);
      } else {
        // If marker doesn't exist, create it
        this.currentPositionMarker = L.marker(
          [this.currentPosition.latitude, this.currentPosition.longitude],
          { icon: customIcon }
        )
          .addTo(this.map)
          .bindPopup('Tu ubicación');
      }

      // Handle location marker (only create once)
      if (this.locationDetails?.latitud && this.locationDetails?.longitud && !this.locationMarker) {
        this.locationMarker = L.marker(
          [this.locationDetails.latitud, this.locationDetails.longitud],
          { icon: customIcon }
        )
          .addTo(this.map)
          .bindPopup(this.locationDetails.descripcion);
        console.log('Marker added for API location:', this.locationDetails);
      }
    } else {
      console.log('No se obtuvo la ubicacion');
    }
  }

  checkGeofence() {
    if (this.locationDetails) {
      const distanceInMeters = this.calculateDistance(
        this.currentPosition.latitude,
        this.currentPosition.longitude,
        this.locationDetails.latitud,
        this.locationDetails.longitud
      );
      this.isInsideGeofence = distanceInMeters <= 50;
      this.distanceToGeofence = distanceInMeters;
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  showLocationDetails() {
    this.showDetails = !this.showDetails;
    console.log('Location Details:', this.locationDetails);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    if (this.positionWatchId !== null) {
      Geolocation.clearWatch({ id: this.positionWatchId });
    }
    // Clean up markers
    if (this.currentPositionMarker) {
      this.currentPositionMarker.remove();
    }
    if (this.locationMarker) {
      this.locationMarker.remove();
    }
  }
}