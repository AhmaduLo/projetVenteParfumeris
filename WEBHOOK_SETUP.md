# Configuration du Webhook Stripe pour la Gestion Automatique du Stock

## Vue d'ensemble

Le webhook Stripe permet de décrémenter automatiquement le stock après chaque paiement réussi. Lorsqu'un client achète un produit, le stock est mis à jour automatiquement et le produit est désactivé si le stock atteint 0.

## Fonctionnement

1. **Client achète un produit** → Session Stripe Checkout
2. **Paiement réussi** → Stripe envoie un événement `checkout.session.completed`
3. **Webhook reçoit l'événement** → Décrémenter le stock du produit
4. **Stock = 0** → Le produit est automatiquement désactivé (`active: false`)
5. **Produit désactivé** → N'apparaît plus côté client

## Configuration dans le Dashboard Stripe

### Étape 1 : Accéder aux Webhooks

1. Connectez-vous à votre [Dashboard Stripe](https://dashboard.stripe.com)
2. Allez dans **Développeurs** → **Webhooks**
3. Cliquez sur **Ajouter un endpoint**

### Étape 2 : Configurer l'endpoint

**URL de l'endpoint :**
```
https://les-senteurs-d-amira.vercel.app/api/webhooks/stripe
```

**Événements à écouter :**
- ✅ `checkout.session.completed` (OBLIGATOIRE)
- ✅ `payment_intent.succeeded` (optionnel - pour logs)
- ✅ `payment_intent.payment_failed` (optionnel - pour logs)

### Étape 3 : Récupérer le Secret du Webhook

1. Après création, Stripe affiche votre **Signing Secret** (commence par `whsec_...`)
2. Copiez ce secret

### Étape 4 : Configurer la Variable d'Environnement

1. Allez dans votre projet Vercel
2. **Settings** → **Environment Variables**
3. Ajoutez une nouvelle variable :

```
Nom  : STRIPE_WEBHOOK_SECRET
Valeur : whsec_votre_secret_ici
```

4. Cliquez sur **Save**
5. **Redéployez** votre application pour que la variable soit prise en compte

## Test du Webhook

### Test en local (développement)

Pour tester en local, utilisez le Stripe CLI :

```bash
# Installer Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Écouter les webhooks et les rediriger vers localhost
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Dans un autre terminal, créer un événement de test
stripe trigger checkout.session.completed
```

### Test en production

1. Allez dans **Développeurs** → **Webhooks** → Votre endpoint
2. Cliquez sur **Envoyer un événement de test**
3. Sélectionnez `checkout.session.completed`
4. Cliquez sur **Envoyer un événement de test**

Vérifiez les logs :
- Dans le dashboard Stripe : événement reçu avec statut 200
- Dans Vercel : logs de la fonction serverless

## Vérification du Fonctionnement

### Scénario complet

1. **Créez un produit de test** dans l'admin avec stock = 2
2. **Achetez 1 produit** via le site
3. **Vérifiez dans l'admin** : stock doit être à 1
4. **Achetez encore 1 produit**
5. **Vérifiez** :
   - Stock = 0
   - Badge "⚠️ RUPTURE" visible dans l'admin
   - Produit n'apparaît plus côté client

### Logs à vérifier

Dans les logs Vercel, vous devriez voir :

```
🛒 Checkout complété: cs_test_...
📦 Stock mis à jour pour Produit Test: 2 → 1
```

Ou si stock = 0 :

```
🛒 Checkout complété: cs_test_...
📦 Stock mis à jour pour Produit Test: 1 → 0
⚠️ Rupture de stock pour: Produit Test
```

## Sécurité

- ✅ Le webhook vérifie la signature Stripe pour éviter les fausses requêtes
- ✅ La clé secrète Stripe n'est jamais exposée côté client
- ✅ Seuls les événements valides sont traités

## Dépannage

### Problème : Le webhook ne fonctionne pas

**Vérifier :**
1. ✅ URL de l'endpoint est correcte
2. ✅ `STRIPE_WEBHOOK_SECRET` est bien configuré dans Vercel
3. ✅ Application a été redéployée après ajout de la variable
4. ✅ Événement `checkout.session.completed` est bien écouté

**Consulter les logs :**
- Dashboard Stripe → Webhooks → Votre endpoint → Tentatives récentes
- Vercel → Functions → `/api/webhooks/stripe` → Logs

### Problème : Erreur 400 "Webhook Error"

**Cause :** Signature invalide

**Solution :**
1. Vérifier que `STRIPE_WEBHOOK_SECRET` correspond au secret du webhook
2. Vérifier que le webhook pointe vers la bonne URL

### Problème : Stock ne se met pas à jour

**Vérifier :**
1. ✅ Le produit a bien une métadonnée `stock` dans Stripe
2. ✅ Le webhook reçoit bien l'événement (voir logs)
3. ✅ Pas d'erreur dans les logs Vercel

## Architecture Technique

```
Client achète
     ↓
Stripe Checkout (paiement)
     ↓
checkout.session.completed
     ↓
Webhook (/api/webhooks/stripe.ts)
     ↓
Récupère les line_items
     ↓
Pour chaque produit :
  - Lit stock actuel
  - stock_nouveau = stock_actuel - quantité
  - Met à jour metadata.stock
  - Si stock = 0 → active = false
     ↓
Produit mis à jour dans Stripe
     ↓
Frontend reload → Produit disparaît si stock = 0
```

## Fichiers Modifiés

- ✅ `/api/webhooks/stripe.ts` - Webhook handler
- ✅ `/src/app/services/stripe-product.service.ts` - Filtre produits actifs
- ✅ `/src/app/components/admin/products-management/` - Indicateurs visuels admin
- ✅ `/src/app/components/stripe-product-list/` - Désactivation produits côté client

## Notes Importantes

- Le webhook décrémenter le stock **uniquement** après un paiement **réussi**
- Si le stock est à 0, le produit est **automatiquement désactivé**
- Les produits désactivés n'apparaissent **plus** sur le site client
- Dans l'admin, vous voyez **tous** les produits (actifs et désactivés)
- Vous pouvez **réactiver** manuellement un produit désactivé en augmentant son stock

## Support

En cas de problème, consultez :
- [Documentation Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Documentation Vercel Functions](https://vercel.com/docs/functions/serverless-functions)
