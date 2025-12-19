# Parfums & Incenses d'Orient - Site Vitrine

Site vitrine moderne et élégant pour une boutique de parfums et d'encens orientaux, développé avec Angular 17+ et SCSS.

## 📋 Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Personnalisation](#personnalisation)
- [Structure du projet](#structure-du-projet)
- [Déploiement](#déploiement)

## 🎯 Aperçu

Site vitrine responsive présentant une collection de parfums de luxe et d'encens artisanaux. Design moderne avec animations fluides, navigation intuitive et formulaire de contact intégré.

### Caractéristiques principales

- ✨ Design élégant et moderne
- 📱 Entièrement responsive (mobile, tablette, desktop)
- 🎨 Animations et transitions fluides
- 🔍 Filtrage des produits par catégorie
- 📧 Formulaire de contact avec validation
- 📞 Intégration WhatsApp
- ♿ Accessible (ARIA labels, navigation clavier)
- 🚀 Performance optimisée

## ⚡ Fonctionnalités

### Pour les visiteurs

- **Section Hero** : Grande bannière d'accueil avec call-to-action
- **Catalogue produits** : Grille responsive avec filtres (Tous/Parfums/Encens)
- **Détails produit** : Modal avec informations complètes
- **Contact** : Multiple options (formulaire, WhatsApp, téléphone, email)
- **À propos** : Présentation de la boutique et ses valeurs
- **Footer** : Coordonnées complètes et horaires d'ouverture

### Fonctionnalités techniques

- Navigation smooth scroll
- Menu burger responsive
- Header sticky avec effet
- Modals avec animations
- Validation de formulaire reactive
- Copie du numéro WhatsApp
- Images lazy loading

## 🛠️ Technologies

- **Framework** : Angular 17+ (standalone components)
- **Styles** : SCSS avec architecture modulaire
- **Typographie** : Google Fonts (Playfair Display, Lato)
- **Icons** : SVG inline
- **Formulaires** : Reactive Forms
- **Build** : Angular CLI

## 📦 Installation

### Prérequis

- Node.js 18+ et npm
- Angular CLI 17+

```bash
npm install -g @angular/cli
```

### Installation du projet

```bash
# Cloner le repository (ou créer un nouveau projet Angular)
ng new boutique-parfums
cd boutique-parfums

# Copier tous les fichiers du projet dans le dossier

# Installer les dépendances
npm install
```

### Lancement en développement

```bash
ng serve
```

Ouvrir [http://localhost:4200](http://localhost:4200) dans votre navigateur.

### Build de production

```bash
ng build --configuration production
```

Les fichiers de production seront dans le dossier `dist/`.

## ⚙️ Configuration

### Configuration SCSS dans angular.json

Assurez-vous que la configuration SCSS est présente dans `angular.json` :

```json
{
  "projects": {
    "boutique-parfums": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.scss"
            ],
            "stylePreprocessorOptions": {
              "includePaths": [
                "src/styles"
              ]
            }
          }
        }
      }
    }
  }
}
```

### Variables d'environnement

Les informations de contact sont configurées dans `src/app/services/product.service.ts`.

## 🎨 Personnalisation

### 1. Modifier les informations de contact

Ouvrir `src/app/services/product.service.ts` et modifier l'objet `contactInfo` :

```typescript
private readonly contactInfo: ContactInfo = {
  nom: "Votre Nom de Boutique",
  telephone: '+33 X XX XX XX XX',
  email: 'votre@email.fr',
  whatsapp: '+33 X XX XX XX XX',
  adresse: 'Votre adresse complète'
};
```

### 2. Ajouter/Modifier des produits

Dans le même fichier (`product.service.ts`), modifier le tableau `products` :

```typescript
{
  id: 7, // ID unique
  nom: 'Nom du Produit',
  categorie: 'parfum', // ou 'incense'
  prix: 45,
  image: 'URL_DE_VOTRE_IMAGE',
  description: 'Description détaillée du produit...',
  caracteristiques: {
    contenance: '50ml',
    origine: 'Pays d\'origine',
    notes: 'Notes olfactives', // optionnel
    duree: 'Durée' // optionnel
  },
  nouveau: true // ou false
}
```

### 3. Personnaliser les couleurs

Modifier les variables dans `src/styles/_variables.scss` :

```scss
// Couleurs principales
$primary-color: #8B7355;   // Couleur principale
$secondary-color: #2C2C2C; // Couleur secondaire
$accent-color: #D4AF37;    // Couleur d'accent
$light-bg: #FAF8F5;        // Fond clair
```

### 4. Changer les images

#### Image Hero

Modifier dans `src/app/components/hero/hero.component.scss` :

```scss
.hero {
  background-image: url('VOTRE_IMAGE_URL');
  background-size: cover;
  background-position: center;
}
```

#### Images produits

Utiliser des URLs d'images (Unsplash, votre serveur, etc.) dans le service produits.

#### Image À propos

Modifier dans `src/app/components/about/about.component.html` :

```html
<img src="VOTRE_IMAGE_URL" alt="Description">
```

### 5. Modifier les textes

- **Hero** : `src/app/components/hero/hero.component.html`
- **À propos** : `src/app/components/about/about.component.html`
- **Footer** : `src/app/components/footer/footer.component.html`

### 6. Horaires d'ouverture

Modifier dans `src/app/components/footer/footer.component.ts` :

```typescript
horaires = [
  { jour: 'Lundi - Vendredi', heures: '10h00 - 19h00' },
  { jour: 'Samedi', heures: '10h00 - 18h00' },
  { jour: 'Dimanche', heures: 'Fermé' }
];
```

### 7. Réseaux sociaux

Modifier les URLs dans `src/app/components/footer/footer.component.ts` :

```typescript
socials = [
  { name: 'Facebook', icon: '...', url: 'https://facebook.com/votre-page' },
  { name: 'Instagram', icon: '...', url: 'https://instagram.com/votre-compte' },
  // ...
];
```

## 📁 Structure du projet

```
boutique-parfums/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── header/           # Navigation principale
│   │   │   ├── hero/             # Bannière d'accueil
│   │   │   ├── catalogue/        # Liste des produits
│   │   │   ├── product-card/     # Carte produit
│   │   │   ├── product-modal/    # Détails produit
│   │   │   ├── contact-modal/    # Formulaire de contact
│   │   │   ├── about/            # À propos
│   │   │   └── footer/           # Pied de page
│   │   ├── services/
│   │   │   └── product.service.ts    # Gestion des produits
│   │   ├── models/
│   │   │   └── product.model.ts      # Interfaces TypeScript
│   │   ├── app.component.*           # Composant racine
│   │   └── app.config.ts             # Configuration app
│   ├── styles/
│   │   ├── _variables.scss       # Variables SCSS
│   │   ├── _mixins.scss          # Mixins réutilisables
│   │   └── _animations.scss      # Animations
│   └── styles.scss               # Styles globaux
├── angular.json                  # Configuration Angular
└── package.json                  # Dépendances
```

## 🚀 Déploiement

### Netlify

```bash
ng build --configuration production
# Uploader le dossier dist/ sur Netlify
```

### Vercel

```bash
ng build --configuration production
vercel deploy
```

### GitHub Pages

```bash
ng add angular-cli-ghpages
ng deploy --base-href=/votre-repo/
```

### Serveur classique

Après le build, copier le contenu de `dist/boutique-parfums/` sur votre serveur web.

## 📝 Notes importantes

### Images

- Utilisez des images optimisées (WebP recommandé)
- Taille recommandée pour les produits : 500x500px
- Taille recommandée pour le hero : 1920x1080px
- Utilisez des CDN comme Unsplash pour les placeholders

### Performance

- Les images utilisent le lazy loading
- Les animations respectent `prefers-reduced-motion`
- Le code est optimisé pour la production

### SEO

Pour améliorer le SEO, ajouter dans `src/index.html` :

```html
<meta name="description" content="Votre description">
<meta name="keywords" content="parfums, encens, oriental">
<meta property="og:title" content="Parfums & Incenses d'Orient">
<meta property="og:description" content="Votre description">
```

## 🐛 Résolution de problèmes

### Les styles SCSS ne se chargent pas

Vérifier que `angular.json` contient la configuration SCSS et relancer `ng serve`.

### Erreur d'import des composants

Vérifier que tous les composants sont bien en mode `standalone: true`.

### Les images ne s'affichent pas

Vérifier les URLs des images et s'assurer qu'elles sont accessibles.

## 📄 Licence

Ce projet est libre de droits pour un usage commercial ou personnel.

## 👨‍💻 Support

Pour toute question ou problème, créer une issue sur le repository.

---

**Développé avec ❤️ pour Parfums & Incenses d'Orient**
