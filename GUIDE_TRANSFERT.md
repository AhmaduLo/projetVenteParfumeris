# 📋 Guide de Transfert du Site - Les Senteurs d'Amira

Ce document détaille toutes les étapes nécessaires pour transférer complètement le site à son propriétaire.

---

## 🎯 Vue d'ensemble

Le site utilise :
- **Frontend** : Angular 18
- **Backend/API** : Vercel Serverless Functions
- **Paiements** : Stripe
- **Hébergement** : Vercel
- **Code source** : GitHub

---

## 1️⃣ STRIPE - Configuration Paiements

### Pourquoi créer un nouveau compte ?
- ✅ Paiements reçus directement sur le compte bancaire du propriétaire
- ✅ Contrôle total sur les transactions
- ✅ Pas de dépendance envers le développeur
- ✅ Conformité légale (entreprise du propriétaire)

### Étapes pour le propriétaire :

#### A. Création du compte Stripe
1. Aller sur https://dashboard.stripe.com/register
2. S'inscrire avec l'email professionnel de l'entreprise
3. Choisir le pays : **France** (ou pays de l'entreprise)
4. Type de compte : **Entreprise** ou **Auto-entrepreneur**

#### B. Vérification d'identité (KYC - Know Your Customer)
Stripe demandera :
- Informations personnelles du gérant
- SIRET/SIREN de l'entreprise
- Pièce d'identité
- Justificatif de domicile
- RIB pour recevoir les paiements

⏱️ **Délai** : 1-3 jours ouvrables pour validation

#### C. Configuration des produits
1. Dans le Dashboard Stripe → **Products**
2. Recréer tous les produits :
   - Nom du produit
   - Description
   - Prix
   - Images (upload depuis `src/assets/images/`)
   - Métadonnées (`category`, etc.)

#### D. Récupérer les clés API
1. Dashboard Stripe → **Developers** → **API Keys**
2. Noter les clés :
   ```
   Publishable key: pk_live_...
   Secret key: sk_live_...
   ```
3. **⚠️ IMPORTANT** : Ne JAMAIS partager la Secret Key publiquement

#### E. Configurer le Webhook
1. Dashboard Stripe → **Developers** → **Webhooks**
2. Cliquer **Add endpoint**
3. URL : `https://votre-site.vercel.app/api/webhook`
4. Événements à écouter :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Noter le **Signing secret** : `whsec_...`

---

## 2️⃣ GITHUB - Transfert du code source

### Option A : Transfert du repository (RECOMMANDÉ)

Le propriétaire doit :
1. Créer un compte GitHub : https://github.com/signup
2. Vous envoyer son nom d'utilisateur GitHub

Vous devez :
1. Aller dans **Settings** du repository
2. Scroll → **Danger Zone** → **Transfer ownership**
3. Entrer le nom d'utilisateur du propriétaire
4. Confirmer le transfert

### Option B : Fork + Nouveau repo

Si le transfert n'est pas possible :
1. Le propriétaire crée un nouveau repository privé
2. Vous clonez et poussez le code vers le nouveau repo :
```bash
git clone https://github.com/AhmaduLo/projetVenteParfumeris.git
cd projetVenteParfumeris
git remote set-url origin https://github.com/[nouveau-proprietaire]/[nouveau-repo].git
git push -u origin main
```

---

## 3️⃣ VERCEL - Transfert de l'hébergement

### Étapes pour le propriétaire :

#### A. Créer un compte Vercel
1. Aller sur https://vercel.com/signup
2. S'inscrire avec GitHub (recommandé)
3. Connecter son compte GitHub

#### B. Importer le projet
1. Dashboard Vercel → **Add New** → **Project**
2. Sélectionner le repository GitHub du site
3. Framework Preset : **Angular**
4. Root Directory : `./`
5. Cliquer **Deploy**

#### C. Configurer les variables d'environnement
1. Aller dans **Settings** → **Environment Variables**
2. Ajouter les variables pour **Production**, **Preview** et **Development** :

```
STRIPE_SECRET_KEY=sk_live_... (du compte Stripe du propriétaire)
STRIPE_PUBLISHABLE_KEY=pk_live_... (du compte Stripe du propriétaire)
STRIPE_WEBHOOK_SECRET=whsec_... (du webhook créé précédemment)
NEXT_PUBLIC_SITE_URL=https://[nom-du-projet].vercel.app
```

3. **Redéployer** le site pour appliquer les variables

#### D. Configurer le domaine personnalisé (optionnel)
1. Acheter un domaine (ex: lessenteursdamira.com)
2. Vercel → **Settings** → **Domains**
3. Ajouter le domaine
4. Configurer les DNS chez le registrar selon les instructions Vercel

---

## 4️⃣ MODIFICATIONS DU CODE

### A. Mettre à jour les informations de contact

**Fichier** : `src/app/components/cart/cart.component.ts`

Ligne 144, remplacer :
```typescript
const email = 'contact@example.com'; // TODO: Mettre le vrai email
```

Par :
```typescript
const email = 'contact@lessenteursdamira.fr'; // Email du propriétaire
```

**Fichier** : `src/app/components/contact-modal/contact-modal.component.ts`

Mettre à jour :
- Email de contact
- Numéro WhatsApp
- Adresse physique (si affichée)

### B. Vérifier les URLs Stripe

**Fichier** : `src/environments/environment.prod.ts`

Vérifier que l'URL de production est correcte :
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://votre-nouveau-domaine.vercel.app/api',
  stripePublishableKey: 'pk_live_...' // Sera surchargée par les env vars
};
```

---

## 5️⃣ SÉCURITÉ - Points critiques

### ✅ Checklist de sécurité

- [ ] **Fichiers .env** : NE JAMAIS commiter dans Git
- [ ] **Clés Stripe** : Utiliser UNIQUEMENT les variables d'environnement Vercel
- [ ] **Accès GitHub** : Le propriétaire doit changer son mot de passe après transfert
- [ ] **Accès Vercel** : Vérifier que seul le propriétaire a les droits admin
- [ ] **Webhook Stripe** : URL doit pointer vers le nouveau domaine Vercel
- [ ] **Mode Test vs Live** : S'assurer d'utiliser les clés `pk_live_` et `sk_live_` en production

### 🔐 Secrets à supprimer côté développeur

Après le transfert, vous devez :
1. Supprimer votre accès au repository GitHub
2. Supprimer le projet de votre compte Vercel
3. Supprimer vos fichiers `.env` locaux
4. Ne plus utiliser le compte Stripe de test lié au projet

---

## 6️⃣ DOCUMENTATION POUR LE PROPRIÉTAIRE

### Fichiers importants à connaître :

```
📁 projet-vente-parfumeris/
├── 📄 .env.example          ← Template des variables d'environnement
├── 📄 README.md             ← Documentation du projet
├── 📄 package.json          ← Dépendances du projet
│
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 components/   ← Composants Angular (pages, modals, etc.)
│   │   ├── 📁 services/     ← Services (panier, Stripe, produits)
│   │   └── 📁 models/       ← Types TypeScript
│   │
│   ├── 📁 assets/
│   │   └── 📁 images/       ← Images des produits
│   │
│   └── 📁 styles/           ← Styles CSS globaux
│
└── 📁 api/                  ← API Serverless Vercel
    ├── products.ts          ← Récupération des produits Stripe
    ├── create-checkout.ts   ← Création de session de paiement
    └── webhook.ts           ← Gestion des événements Stripe
```

### Gestion quotidienne :

#### Ajouter un produit :
1. Dashboard Stripe → **Products** → **Add product**
2. Remplir nom, description, prix
3. Upload image
4. Ajouter métadonnée `category` (ex: "Parfums", "Encens")
5. Le produit apparaît automatiquement sur le site

#### Voir les commandes :
1. Dashboard Stripe → **Payments**
2. Filtrer par date, statut, montant
3. Export possible en CSV/Excel

#### Gérer les remboursements :
1. Dashboard Stripe → **Payments**
2. Cliquer sur la transaction
3. **Refund** → Montant → Confirmer

---

## 7️⃣ SUPPORT & MAINTENANCE

### Qui contacter pour :

**Problèmes techniques** :
- Bugs du site : Développeur (vous) avec contrat de maintenance
- Paiements Stripe : Support Stripe (support@stripe.com)
- Hébergement Vercel : Support Vercel

**Modifications** :
- Ajout de fonctionnalités : Développeur
- Changement de design : Développeur
- Mise à jour des produits : Propriétaire via Stripe

### Coûts mensuels estimés :

| Service | Coût |
|---------|------|
| Vercel (Hobby) | Gratuit |
| Vercel (Pro) | $20/mois (si trafic élevé) |
| Stripe | 1.4% + 0.25€ par transaction (Europe) |
| Domaine | ~12€/an |

---

## 8️⃣ CHECKLIST FINALE DE TRANSFERT

### Avant le transfert :
- [ ] Le propriétaire a créé son compte Stripe
- [ ] Le compte Stripe est vérifié (KYC validé)
- [ ] Tous les produits sont créés dans Stripe
- [ ] Le propriétaire a créé son compte GitHub
- [ ] Le propriétaire a créé son compte Vercel
- [ ] Le code est à jour sur GitHub
- [ ] Un fichier `.env.example` est présent

### Pendant le transfert :
- [ ] Repository GitHub transféré
- [ ] Projet importé sur Vercel du propriétaire
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Webhook Stripe configuré avec la bonne URL
- [ ] Test de paiement réussi (mode test)
- [ ] Site déployé et accessible

### Après le transfert :
- [ ] Test de commande complète en production
- [ ] Email de confirmation reçu
- [ ] Paiement visible dans le compte Stripe du propriétaire
- [ ] Le propriétaire peut se connecter partout (GitHub, Vercel, Stripe)
- [ ] Documentation remise au propriétaire
- [ ] Vos accès révoqués
- [ ] Contrat de maintenance signé (optionnel)

---

## 📞 CONTACT

Pour toute question sur ce guide :
- **Développeur** : [Votre email]
- **Support Stripe** : https://support.stripe.com
- **Support Vercel** : https://vercel.com/support
- **Documentation Angular** : https://angular.dev

---

**Date de création** : 23 Décembre 2025
**Version du guide** : 1.0
**Dernière mise à jour** : 23 Décembre 2025
