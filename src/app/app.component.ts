import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfigService } from 'projects/attribute-master/src/lib/config.service';
import { first, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'AttributesLibAngular';
  loggedIn: boolean = false;

  loginForm!: FormGroup;
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private configService: ConfigService,
  ) {
    const token = localStorage.getItem('TOKEN');
    if (token) this.loggedIn = true;
  }
  ngOnInit() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  submit() {
    this.login()
      .pipe(first())
      .subscribe(
        (data) => {
          console.log('reach', data);
          this.loggedIn = true;
        },
        (error) => {
          console.log('reach1', error);
        },
      );
  }
  Forcelogout() {
    const username = this.loginForm.controls['username'].value;
    const password = this.loginForm.controls['password'].value;
    const data = {
      username: username,
      password: password,
      logoutuser: username,
    };
    return this.http
      .post<any>(this.configService.getApiUrl() + '/force-logout', data)
      .subscribe((res) => {
        console.log('reach', res);
      });
  }

  login() {
    const username = this.loginForm.controls['username'].value;
    const password = this.loginForm.controls['password'].value;
    return this.http
      .post<any>(
        this.configService.getApiUrl() + '/jwt',
        { username, password },
        { withCredentials: true },
      )
      .pipe(
        map((user: any) => {
          // store user details and jwt token in local storage to keep user logged in between page refreshes
          localStorage.setItem('USER_PROFILE', JSON.stringify(user.profile));
          localStorage.setItem('setting', JSON.stringify(user.setting));
          sessionStorage.setItem('USER_PROFILE', JSON.stringify(user.profile));
          localStorage.setItem('TOKEN', JSON.stringify(user.token));
          localStorage.setItem('port', JSON.stringify(user.ports));
          return user;
        }),
      );
  }
}
