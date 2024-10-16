import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

import { App } from '@capacitor/app';
import { Platform } from '@ionic/angular';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;


  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private platform: Platform
  ) {
    this.loginForm = this.formBuilder.group({
      id_ejecutor: ['', Validators.required],
      password: ['', Validators.required]
    });
  }
  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  
    this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.authService.isLoggedIn()) {
        App.exitApp();  // Use Capacitor's App plugin to exit the app
      }
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.errorMessage = '';
      this.isLoading = true;
      const { id_ejecutor, password } = this.loginForm.value;
  
      // First, get the token
      this.authService.getToken().subscribe({
        next: (tokenResponse) => {
          console.log('Token obtained:', tokenResponse.token);
  
          // After obtaining the token, proceed with login
          this.authService.login(id_ejecutor, password).subscribe({
            next: (response) => {
              this.isLoading = false;
              console.log(response);
              this.router.navigateByUrl('/home');
            },
            error: (error) => {
              this.isLoading = false;
              if (error.status === 401) {
                this.errorMessage = 'Invalid credentials or inactive user';
              } else {
                this.errorMessage = 'An error occurred. Please try again.';
              }
            }
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Unable to obtain token. Please try again.';
        }
      });
    }
  }
}