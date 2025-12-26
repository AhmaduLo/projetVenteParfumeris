# Configuration de l'authentification admin

Ce guide explique comment configurer et utiliser le système d'authentification admin.

## Architecture

```
┌─────────────────┐
│  Angular App    │
│  (Frontend)     │
└────────┬────────┘
         │
         │ POST /api/admin/login
         │ { email, password }
         ↓
┌─────────────────┐
│  Vercel API     │
│  /api/admin/    │
│     login       │
└────────┬────────┘
         │
         │ Vérifie:
         │ - Email
         │ - Password hash (bcrypt)
         │
         ↓
┌─────────────────┐
│   Retourne JWT  │
│   + stockage    │
│   localStorage  │
└─────────────────┘
         │
         │ Routes protégées
         │ avec authGuard
         ↓
┌─────────────────┐
│     Dashboard   │
│      Admin      │
└─────────────────┘
```

## 1. Fichiers créés

### Frontend (Angular)
- `src/app/models/auth.model.ts` - Interfaces TypeScript
- `src/app/services/auth.service.ts` - Service d'authentification
- `src/app/guards/auth.guard.ts` - Guard pour protéger les routes
- `src/app/components/admin/login/` - Page de connexion
- `src/app/components/admin/dashboard/` - Dashboard admin (protégé)

### Backend (Vercel)
- `api/admin/login.ts` - API de connexion avec JWT

### Scripts
- `scripts/generate-password-hash.js` - Générateur de hash bcrypt

## 2. Configuration des variables d'environnement

### Variables requises sur Vercel

Allez sur votre projet Vercel → Settings → Environment Variables et ajoutez :

```bash
# Email de l'admin
ADMIN_EMAIL=admin@example.com

# Hash du mot de passe (généré avec le script)
ADMIN_PASSWORD_HASH=$2b$10$wxaOlIt10z6Z6pko1/9BB.6SB/bk0BF/L7qzdOdkIryplTYRp1DE2

# Secret pour signer les JWT (changez-le en production!)
JWT_SECRET=votre-secret-tres-securise-a-changer

# URL du frontend (déjà configuré normalement)
FRONTEND_URL=https://les-senteurs-d-amira.vercel.app
```

### Générer un nouveau hash de mot de passe

```bash
node scripts/generate-password-hash.js "VotreMotDePasse"
```

Le script vous donnera le hash à ajouter dans `ADMIN_PASSWORD_HASH`.

## 3. Utilisation

### Accéder à la page de login

URL : `https://les-senteurs-d-amira.vercel.app/admin/login`

ou en local : `http://localhost:4200/admin/login`

### Identifiants de test

**Email** : `admin@example.com`
**Mot de passe** : `Admin123!`

> ⚠️ **IMPORTANT** : Changez ces identifiants en production !

### Routes disponibles

| Route | Description | Protection |
|-------|-------------|------------|
| `/admin/login` | Page de connexion | Non (publique) |
| `/admin/dashboard` | Dashboard admin | Oui (authGuard) |

## 4. Fonctionnement de la protection

### AuthGuard

Le guard vérifie automatiquement si :
1. Un token JWT existe dans le localStorage
2. Le token n'est pas expiré (durée : 24h)

Si non authentifié → Redirection vers `/admin/login`

### Stockage du JWT

Le token est stocké dans `localStorage` sous la clé `admin_token`.

```typescript
// Récupérer le token
const token = localStorage.getItem('admin_token');

// Supprimer le token (logout)
localStorage.removeItem('admin_token');
```

## 5. Sécurité

### Bonnes pratiques implémentées

✅ **Mot de passe hashé** avec bcrypt (cost factor: 10)
✅ **JWT avec expiration** (24h)
✅ **CORS sécurisé** (origines autorisées uniquement)
✅ **Validation des entrées**
✅ **Protection contre les attaques par timing**
✅ **Pas d'informations sensibles dans les erreurs**

### Recommandations pour la production

1. **Changez le JWT_SECRET** :
   ```bash
   # Générer un secret aléatoire sécurisé
   openssl rand -base64 64
   ```

2. **Utilisez un email et mot de passe forts**

3. **Activez HTTPS uniquement** (déjà fait sur Vercel)

4. **Ajoutez une limitation de tentatives** (rate limiting)

5. **Ajoutez l'authentification à 2 facteurs** (2FA) si nécessaire

6. **Surveillez les logs de connexion**

## 6. Extension du système

### Ajouter une nouvelle route protégée

```typescript
// Dans app.config.ts
{
  path: 'admin/users',
  component: UsersComponent,
  canActivate: [authGuard] // ← Ajouter le guard
}
```

### Ajouter des permissions/rôles

Modifiez `JWTPayload` dans `auth.model.ts` :

```typescript
export interface JWTPayload {
  email: string;
  role: 'admin' | 'super-admin' | 'moderator';
  permissions: string[];
  iat: number;
  exp: number;
}
```

### Intercepter les requêtes HTTP pour ajouter le token

Créez un `auth.interceptor.ts` :

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
```

## 7. Déploiement

### Étapes pour déployer

1. **Configurer les variables d'environnement sur Vercel**
2. **Commit et push** :
   ```bash
   git add .
   git commit -m "✨ Ajout système d'authentification admin"
   git push
   ```
3. **Déployer** :
   ```bash
   vercel --prod
   ```

## 8. Tests

### Test manuel

1. Accédez à `/admin/dashboard` sans être connecté
   - ✅ Devrait rediriger vers `/admin/login`

2. Essayez de vous connecter avec de mauvais identifiants
   - ✅ Devrait afficher une erreur

3. Connectez-vous avec les bons identifiants
   - ✅ Devrait rediriger vers `/admin/dashboard`
   - ✅ Le token devrait être dans localStorage

4. Actualisez la page du dashboard
   - ✅ Devrait rester connecté

5. Cliquez sur "Déconnexion"
   - ✅ Le token devrait être supprimé
   - ✅ Devrait rediriger vers `/admin/login`

### Vérifier le JWT

Copiez le token depuis localStorage et décodez-le sur [jwt.io](https://jwt.io/) pour voir le contenu.

## 9. Troubleshooting

### Problème : 401 Unauthorized lors du login

- Vérifiez que `ADMIN_EMAIL` et `ADMIN_PASSWORD_HASH` sont bien configurés sur Vercel
- Vérifiez que le mot de passe correspond au hash

### Problème : CORS error

- Vérifiez que votre origine est dans `allowedOrigins` dans `api/admin/login.ts`
- En local, assurez-vous d'utiliser `http://localhost:4200`

### Problème : Token expiré

- Le token expire après 24h
- Reconnectez-vous pour obtenir un nouveau token

### Problème : Guard ne redirige pas

- Vérifiez que `authGuard` est bien importé dans `app.config.ts`
- Vérifiez la console pour les logs `🚫 Accès refusé`

## 10. Support

Pour toute question ou problème, consultez :
- La documentation Angular : https://angular.io
- La documentation JWT : https://jwt.io
- La documentation Vercel : https://vercel.com/docs
