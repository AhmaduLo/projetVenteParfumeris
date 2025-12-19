import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

/**
 * Point d'entrée de l'application Angular
 * Bootstrap du composant racine avec la configuration standalone
 */
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
