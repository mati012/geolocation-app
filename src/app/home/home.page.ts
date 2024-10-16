import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { LocationService } from '../location.service';
import { AuthService } from '../auth.service';
import * as L from 'leaflet';
import { Router } from '@angular/router';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  userData: { id: string, name: string } = { id: '', name: '' };;
  currentPosition: { latitude: number; longitude: number } = {
    latitude: 0,
    longitude: 0,
  };
  locationDetails: any;
  map: L.Map | undefined;
  isInsideGeofence: boolean = false;
  showDetails: boolean = false;
  
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

  // Get the user's current position using Geolocation
  async getCurrentPosition() {
    const coordinates = await Geolocation.getCurrentPosition();
    this.currentPosition = {
      latitude: Number(coordinates.coords.latitude.toFixed(4)),
      longitude: Number(coordinates.coords.longitude.toFixed(4)),
    };
    this.checkGeofence(); 
  }

  // Fetch location details from the API
  getLocationDetails() {
    this.locationService.getLocations(['1791']).subscribe(
      (response) => {
        console.log('API Response:', response); 

       
        if (response && response.data && response.data.length > 0) {
          this.locationDetails = response.data[0]; // Now correctly accessing the first location in 'data'
          console.log('Location Details:', this.locationDetails);

          if (this.map) {
            this.addMarkers(); // Add markers once the map is initialized
          }
          this.checkGeofence(); // Check geofence after fetching location details
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
      iconUrl: 'assets/leaflet/marker-icon.png', // Path to your custom icon
      shadowUrl: 'assets/leaflet/marker-shadow.png', // Path to your custom shadow (optional)
      iconSize: [25, 41], // Size of the icon
      iconAnchor: [12, 41], // Point of the icon which will correspond to marker's location
      popupAnchor: [1, -34], // Point from which the popup should open relative to the iconAnchor
      shadowSize: [41, 41], // Size of the shadow
    });

    if (this.map && this.currentPosition.latitude && this.locationDetails) {
      // Add marker for the user's current location
      L.marker(
        [this.currentPosition.latitude, this.currentPosition.longitude],
        { icon: customIcon }
      )
        .addTo(this.map)
        .bindPopup('Tu ubicación')
        .openPopup();

      // Add marker for the API location using latitud and longitud from locationDetails
      if (this.locationDetails.latitud && this.locationDetails.longitud) {
        L.marker(
          [this.locationDetails.latitud, this.locationDetails.longitud],
          { icon: customIcon }
        )
          .addTo(this.map)
          .bindPopup(this.locationDetails.descripcion)
          .openPopup();
        console.log('Marker added for API location:', this.locationDetails);
      } else {
        console.log('Location details missing latitude or longitude.');
      }
    } else {
      console.log('No se obtuvo la ubicacion');
    }
  }

  // Check if the user is inside the geofence (within 50 meters)
  checkGeofence() {
    if (this.locationDetails) {
      const distance = this.calculateDistance(
        this.currentPosition.latitude,
        this.currentPosition.longitude,
        this.locationDetails.latitud,
        this.locationDetails.longitud
      );
      this.isInsideGeofence = distance <= 0.05; // 50 meters = 0.05 km
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
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
  logout(){
    this.authService.logout();  
    this.router.navigate(['/login']);  
  }
}
