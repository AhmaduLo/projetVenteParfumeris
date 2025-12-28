# ⚠️ URGENT : Configuration du Webhook Stripe

## Problème Actuel
Le webhook n'est **PAS configuré**, donc les achats ne décrément **PAS** le stock automatiquement.

## Solution en 5 Minutes

### 1️⃣ Aller dans Stripe Dashboard
🔗 **Ouvrez ce lien** : https://dashboard.stripe.com/test/webhooks

### 2️⃣ Cliquer sur "Ajouter un endpoint"

### 3️⃣ Configurer l'endpoint

**URL de l'endpoint :**
```
https://les-senteurs-d-amira.vercel.app/api/webhooks/stripe
```

**Description :** (optionnel)
```
Gestion automatique du stock après achat
```

**Événements à écouter :**
Cliquez sur "Sélectionner des événements" et cochez :
- ✅ `checkout.session.completed`

### 4️⃣ Créer l'endpoint
Cliquez sur "Ajouter un endpoint"

### 5️⃣ Copier le Secret
Après création, Stripe affiche votre **Signing secret** qui commence par `whsec_...`

**📋 COPIEZ ce secret !**

### 6️⃣ Ajouter le Secret dans Vercel

**Option A : Via l'interface Vercel**
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet `les-senteurs-d-amira`
3. Allez dans **Settings** → **Environment Variables**
4. Cliquez sur **Add**
5. Remplissez :
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_votre_secret_copié`
   - **Environments:** Cochez `Production`, `Preview`, `Development`
6. Cliquez sur **Save**

**Option B : Via la ligne de commande**
```bash
vercel env add STRIPE_WEBHOOK_SECRET
```
Puis collez la valeur `whsec_...` quand demandé.

### 7️⃣ Redéployer
```bash
vercel --prod
```

## ✅ Vérification

Une fois configuré, testez :
1. Créez un produit test avec stock = 2
2. Achetez 1 produit
3. Vérifiez que le stock passe à 1 automatiquement
4. Achetez encore 1
5. Le stock doit passer à 0 ET le produit doit disparaître du site

## 🆘 En Attendant la Configuration

Pour corriger manuellement le stock du produit qui a été acheté :
1. Allez dans l'admin → Gestion des Produits
2. Trouvez le produit
3. Cliquez sur "Modifier"
4. Changez le stock manuellement de 1 à 0
5. Le produit sera automatiquement désactivé

## 📊 Logs pour Déboguer

Pour voir si le webhook fonctionne :
1. **Dans Stripe Dashboard** → Webhooks → Votre endpoint → Tentatives récentes
2. **Dans Vercel** → Functions → `/api/webhooks/stripe` → Logs

Vous devriez voir :
```
🛒 Checkout complété: cs_test_...
📦 Stock mis à jour pour Produit: 2 → 1
```
