# 🚀 Guide de Déploiement - Angular + Vercel + Stripe

## 📋 Vue d'ensemble

Ce guide vous explique comment déployer votre application e-commerce avec :
- **Front-end Angular** récupérant les produits automatiquement depuis Stripe
- **API Serverless Vercel** protégeant vos clés secrètes Stripe
- **Stripe comme source unique** de vérité (produits, prix, descriptions, images)

---

## ✅ Ce qui a été créé

### 📁 Structure complète

```
projet/
├── api/
│   ├── products.ts          ✅ Récupère les produits Stripe
│   └── checkout.ts          ✅ Crée les sessions Stripe Checkout
├── src/app/
│   ├── models/
│   │   └── stripe-product.model.ts        ✅ Interfaces TypeScript
│   ├── services/
│   │   ├── stripe-product.service.ts      ✅ Service produits
│   │   └── stripe-checkout.service.ts     ✅ Service checkout
│   └── components/
│       └── stripe-product-list/           ✅ Composant liste produits
├── src/environments/
│   ├── environment.ts                     ✅ Config développement
│   └── environment.prod.ts                ✅ Config production
├── vercel.json                            ✅ Config Vercel
├── .env.local                             ✅ Variables locales (dev)
└── .gitignore                             ✅ Mis à jour
```

---

## 🔐 ÉTAPE 1 : Configuration Stripe

### 1.1 Récupérer vos clés API Stripe

1. Aller sur **https://dashboard.stripe.com/test/apikeys**
2. Copier votre **clé secrète** (commence par `sk_test_`)

⚠️ **ATTENTION** : Ne JAMAIS exposer cette clé dans le code Angular !

### 1.2 Créer vos produits dans Stripe

**Dashboard Stripe** → https://dashboard.stripe.com/test/products

Pour chaque produit :
1. Cliquer sur **"+ Ajouter un produit"**
2. Remplir :
   - **Nom** : Oud Royal
   - **Description** : Parfum oriental luxueux aux notes de bois de oud
   - **Images** : Ajouter une image (URL ou upload)
   - **Prix** : 45,00 EUR
   - **Métadonnées** (optionnel) :
     - `category` : `parfum`
     - `stock` : `10`
     - `featured` : `true`
3. Cocher **"Produit actif"**
4. Cliquer **"Enregistrer le produit"**

**Répétez pour tous vos produits !**

### 1.3 Métadonnées utiles

Vous pouvez ajouter ces métadonnées personnalisées à vos produits :

| Clé | Exemple | Usage |
|-----|---------|-------|
| `category` | `parfum`, `encens` | Filtre par catégorie |
| `stock` | `10` | Gestion du stock |
| `featured` | `true` | Produits mis en avant |
| `tags` | `oriental,luxe` | Tags multiples |

---

## 💻 ÉTAPE 2 : Configuration Locale (Développement)

### 2.1 Installer les dépendances

```bash
npm install
```

Cela installe :
- `stripe` : SDK Stripe pour Node.js
- `@vercel/node` : Types Vercel pour TypeScript
- `vercel` : CLI Vercel

### 2.2 Configurer les variables d'environnement

Éditer le fichier **`.env.local`** :

```bash
# Clé secrète Stripe (Mode Test)
STRIPE_SECRET_KEY=sk_test_VOTRE_VRAIE_CLE_SECRETE

# URL du front-end Angular
FRONTEND_URL=http://localhost:4200
```

⚠️ **Remplacer** `sk_test_VOTRE_VRAIE_CLE_SECRETE` par votre vraie clé !

### 2.3 Lancer Vercel en local

```bash
# Installer Vercel CLI globalement
npm install -g vercel

# Lancer le serveur Vercel local
vercel dev
```

Les API seront disponibles sur :
- GET http://localhost:3000/api/products
- POST http://localhost:3000/api/checkout

### 2.4 Lancer Angular

**Dans un autre terminal** :

```bash
npm start
```

Angular sera disponible sur http://localhost:4200

### 2.5 Tester localement

1. Ouvrir **http://localhost:4200**
2. Les produits Stripe devraient apparaître automatiquement ✅
3. Cliquer sur **"Acheter"**
4. Redirection vers Stripe Checkout ✅
5. Remplir avec la carte de test : `4242 4242 4242 4242`
6. L'adresse et le téléphone seront collectés automatiquement ✅

---

## 🚀 ÉTAPE 3 : Déploiement sur Vercel

### 3.1 Créer un compte Vercel

1. Aller sur **https://vercel.com**
2. S'inscrire avec GitHub/GitLab/Email

### 3.2 Initialiser le projet Vercel

```bash
# Dans le dossier du projet
vercel
```

Suivre les instructions :
- Link to existing project? **No**
- Project name? **boutique-parfums** (ou votre choix)
- Directory? **./  ** (dossier actuel)

### 3.3 Configurer les variables d'environnement sur Vercel

**Méthode 1 : Dashboard Web**

1. Aller sur **https://vercel.com/dashboard**
2. Sélectionner votre projet
3. **Settings** → **Environment Variables**
4. Ajouter :

```
Name: STRIPE_SECRET_KEY
Value: sk_live_VOTRE_CLE_SECRETE_PRODUCTION (ou sk_test_ pour tester)
Environment: Production
```

```
Name: FRONTEND_URL
Value: https://votre-app.vercel.app
Environment: Production
```

**Méthode 2 : CLI**

```bash
# Ajouter la clé Stripe
vercel env add STRIPE_SECRET_KEY production

# Coller votre clé secrète quand demandé
# sk_live_VOTRE_CLE_SECRETE_PRODUCTION

# Ajouter l'URL du front-end
vercel env add FRONTEND_URL production
# https://votre-app.vercel.app
```

### 3.4 Mettre à jour environment.prod.ts

Éditer **`src/environments/environment.prod.ts`** :

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://votre-app.vercel.app/api', // Remplacer par votre URL Vercel
  appName: 'Parfums & Incenses d\'Orient',
  version: '1.0.0',
};
```

### 3.5 Déployer en production

```bash
vercel --prod
```

Votre application sera déployée sur :
```
https://votre-app.vercel.app
```

### 3.6 Vérifier le déploiement

1. **Tester l'API** :
   ```
   https://votre-app.vercel.app/api/products
   ```
   → Doit retourner vos produits Stripe

2. **Tester le site** :
   ```
   https://votre-app.vercel.app
   ```
   → Les produits doivent s'afficher automatiquement

---

## 🔄 ÉTAPE 4 : Déploiement Automatique (Git)

### 4.1 Connecter Git à Vercel

1. Dashboard Vercel → Votre projet → **Settings**
2. **Git** → **Connect Git Repository**
3. Sélectionner GitHub/GitLab
4. Choisir votre repository

### 4.2 Configuration automatique

Après connexion, Vercel déploiera automatiquement :
- Chaque **push sur `main`** → Production
- Chaque **pull request** → Preview deployment

---

## 🎯 FLUX COMPLET

```
┌─────────────────────────────────────────────────────────────┐
│  1. ADMIN ajoute/modifie produit dans Stripe Dashboard      │
│     → Produit actif dans Stripe                             │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  2. CLIENT ouvre https://votre-app.vercel.app               │
│     → Angular appelle GET /api/products                     │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  3. VERCEL Serverless Function (api/products.ts)            │
│     → Récupère les produits Stripe avec la clé secrète     │
│     → Retourne JSON à Angular                               │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  4. ANGULAR affiche les produits automatiquement            │
│     → Aucune duplication, Stripe = source unique           │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  5. CLIENT clique "Acheter"                                 │
│     → Angular appelle POST /api/checkout                    │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  6. VERCEL Serverless Function (api/checkout.ts)            │
│     → Crée session Stripe Checkout                          │
│     → Active collecte adresse + téléphone                   │
│     → Retourne URL de redirection                           │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  7. STRIPE CHECKOUT                                         │
│     → Client paie avec sa carte                             │
│     → Renseigne adresse complète + téléphone                │
│     → Paiement sécurisé                                     │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  8. CONFIRMATION                                            │
│     → Visible dans Stripe Dashboard                         │
│     → Vous voyez l'adresse de livraison                     │
│     → Prêt pour l'expédition ! 📦                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 SÉCURITÉ : Pourquoi cette architecture ?

### ❌ Ce qu'il NE FAUT PAS faire

```typescript
// ❌ DANGEREUX - Dans Angular
const stripe = new Stripe('sk_live_XXXXX'); // Clé exposée au client !
const products = await stripe.products.list();
```

**Problème** :
- La clé secrète est visible dans le code source du navigateur
- N'importe qui peut la voler et l'utiliser
- Risque de fraude, remboursements non autorisés, etc.

### ✅ Ce qu'il FAUT faire (Architecture actuelle)

```typescript
// ✅ SÉCURISÉ - Angular appelle l'API Vercel
this.http.get('https://votre-app.vercel.app/api/products');

// La clé secrète reste dans les variables d'environnement Vercel
// Jamais exposée au client
// La fonction serverless agit comme un proxy sécurisé
```

**Avantages** :
- Clé secrète protégée côté serveur
- Aucun risque d'exposition
- Architecture scalable et maintenable

---

## 📊 COMMANDES UTILES

### Développement local

```bash
# Lancer Vercel local
vercel dev

# Lancer Angular (autre terminal)
npm start

# Tester l'API
curl http://localhost:3000/api/products
```

### Déploiement

```bash
# Déployer en preview
vercel

# Déployer en production
vercel --prod

# Voir les logs
vercel logs

# Voir les variables d'environnement
vercel env ls
```

### Debug

```bash
# Voir les fonctions serverless
vercel functions ls

# Logs en temps réel
vercel logs --follow
```

---

## 🐛 DÉPANNAGE

### Erreur : "STRIPE_SECRET_KEY is not defined"

**Solution** :
1. Vérifier que `.env.local` contient la clé
2. Redémarrer `vercel dev`
3. En production, vérifier les variables d'environnement Vercel

### Les produits ne s'affichent pas

**Vérifications** :
1. Les produits sont actifs dans Stripe Dashboard
2. L'API `/api/products` fonctionne (tester directement l'URL)
3. La console Angular n'affiche pas d'erreurs (F12)
4. Les variables d'environnement sont correctes

### CORS Error

**Solution** :
- Vérifier que `FRONTEND_URL` est correctement défini
- Vérifier les headers CORS dans `api/products.ts` et `api/checkout.ts`

### "Cannot read property 'price' of undefined"

**Solution** :
- Vérifier que vos produits Stripe ont un **prix par défaut** défini
- Dans Stripe Dashboard, aller sur le produit et définir un prix

---

## 🎯 PASSER EN MODE PRODUCTION

### Checklist avant production

- [ ] Tester tous les produits en mode test Stripe
- [ ] Vérifier la collecte d'adresse et téléphone
- [ ] Tester un paiement complet (carte test)
- [ ] Activer le compte Stripe (fournir IBAN, documents)
- [ ] Créer les produits en **mode Production** Stripe
- [ ] Changer `STRIPE_SECRET_KEY` pour la clé production (`sk_live_`)
- [ ] Mettre à jour `environment.prod.ts` avec la bonne URL
- [ ] Déployer sur Vercel : `vercel --prod`
- [ ] Tester en production avec une vraie carte

### Basculer en production Stripe

1. **Dashboard Stripe** → Basculer en **Mode Production** (en haut à gauche)
2. Recréer vos produits (ou activer ceux existants)
3. **Settings** → **API keys** → Copier la **clé secrète de production**
4. Mettre à jour la variable `STRIPE_SECRET_KEY` sur Vercel

---

## 💰 FRAIS STRIPE

- **2,9% + 0,25€** par transaction en Europe
- Exemple : Client paie 45€ → Vous recevez 43,44€
- Argent transféré sur votre compte sous 7 jours

---

## 📚 DOCUMENTATION

- **Vercel** : https://vercel.com/docs
- **Stripe API** : https://stripe.com/docs/api
- **Stripe Checkout** : https://stripe.com/docs/payments/checkout
- **Angular** : https://angular.io/docs

---

## ✅ RÉSUMÉ

**Vous avez maintenant :**
- ✅ Une boutique e-commerce complète
- ✅ Stripe comme source unique de produits
- ✅ API serverless sécurisée avec Vercel
- ✅ Collecte automatique adresse + téléphone
- ✅ Aucun backend complexe
- ✅ Aucune duplication de données
- ✅ Déploiement automatique avec Git

**L'admin ajoute un produit dans Stripe → Il apparaît automatiquement sur le site ! 🎉**

---

**🚀 Bon déploiement ! 🚀**
