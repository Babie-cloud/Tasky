import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-landingpage',
  imports: [],
  templateUrl: './landingpage.html',
})
export class Landingpage {
  private router = inject (Router)
  OpenLogin() {
    this.router.navigate(['./login']);
  }
}
