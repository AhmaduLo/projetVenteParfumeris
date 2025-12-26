import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';
import { AdminUser } from '../../../models/auth.model';
import { AdminStats } from '../../../models/admin-stats.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  currentUser: AdminUser | null = null;
  stats: AdminStats | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getStats().subscribe({
      next: (response) => {
        if (response.success && response.stats) {
          this.stats = response.stats;
        } else {
          this.error = response.error || 'Impossible de charger les statistiques';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement stats:', error);
        this.error = error.message || 'Erreur lors du chargement des statistiques';
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
