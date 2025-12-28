import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HomeComponent } from './components/home/home.component';
import { CartComponent } from './components/cart/cart.component';
import { SuccessComponent } from './components/success/success.component';
import { CancelComponent } from './components/cancel/cancel.component';
import { OrdersComponent } from './components/orders/orders.component';
import { LoginComponent } from './components/admin/login/login.component';
import { DashboardComponent } from './components/admin/dashboard/dashboard.component';
import { OrdersListComponent } from './components/admin/orders-list/orders-list.component';
import { ProductsManagementComponent } from './components/admin/products-management/products-management.component';
import { authGuard } from './guards/auth.guard';

/**
 * Routes de l'application
 */
const routes: Routes = [
  { path: '', component: HomeComponent }, // Page d'accueil par défaut
  { path: 'cart', component: CartComponent }, // Page panier
  { path: 'success', component: SuccessComponent },
  { path: 'cancel', component: CancelComponent },
  { path: 'orders', component: OrdersComponent },

  // Routes admin
  { path: 'admin/login', component: LoginComponent }, // Page de login admin (non protégée)
  {
    path: 'admin/dashboard',
    component: DashboardComponent,
    canActivate: [authGuard] // Route protégée par le guard
  },
  {
    path: 'admin/orders',
    component: OrdersListComponent,
    canActivate: [authGuard] // Route protégée par le guard
  },
  {
    path: 'admin/products',
    component: ProductsManagementComponent,
    canActivate: [authGuard] // Route protégée par le guard
  },

  { path: '**', redirectTo: '' } // Redirection vers l'accueil pour les routes inconnues
];

/**
 * Configuration de l'application Angular
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};
