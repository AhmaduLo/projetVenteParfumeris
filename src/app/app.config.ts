import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SuccessComponent } from './components/success/success.component';
import { CancelComponent } from './components/cancel/cancel.component';
import { OrdersComponent } from './components/orders/orders.component';

/**
 * Routes de l'application
 */
const routes: Routes = [
  { path: 'success', component: SuccessComponent },
  { path: 'cancel', component: CancelComponent },
  { path: 'orders', component: OrdersComponent }
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
