import { Component } from '@angular/core';
import { TacheCard } from '../tache-card/tache-card';
@Component({
  selector: 'app-dashboard-user',
  imports: [TacheCard],
  templateUrl: './dashboard-user.html',
  styleUrl: './dashboard-user.scss',
})
export class DashboardUser {}
