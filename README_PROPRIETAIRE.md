# 🛍️ Les Senteurs d'Amira - Guide du Propriétaire

## 📖 Qu'est-ce que ce site ?

Votre boutique en ligne de parfums et encens d'Orient avec paiement sécurisé par Stripe.

---

## 🚀 Accès rapides

| Service | Utilité | Lien |
|---------|---------|------|
| **Site Web** | Voir le site en ligne | https://votre-site.vercel.app |
| **Stripe Dashboard** | Gérer paiements et produits | https://dashboard.stripe.com |
| **Vercel Dashboard** | Gérer hébergement | https://vercel.com/dashboard |
| **GitHub** | Code source du site | https://github.com/[votre-compte]/[votre-repo] |

---

## 💰 Gestion des Produits (Stripe)

### Ajouter un nouveau produit

1. Aller sur https://dashboard.stripe.com
2. Cliquer sur **Products** dans le menu
3. Cliquer **+ Add product**
4. Remplir :
   - **Name** : Nom du produit (ex: "Parfum Oud Royal")
   - **Description** : Description détaillée
   - **Price** : Prix en euros (ex: 29.99)
   - **Image** : Upload une photo du produit
5. Ajouter des **Metadata** (optionnel) :
   - Cliquer **+ Add metadata**
   - Key: `category`, Value: `Parfums` (ou `Encens`, `Huiles`, etc.)
6. Cliquer **Save product**

✅ **Le produit apparaît automatiquement sur votre site !**

### Modifier un produit existant

1. Dashboard Stripe → **Products**
2. Cliquer sur le produit
3. Modifier les informations
4. **Save**

### Supprimer un produit

1. Dashboard Stripe → **Products**
2. Cliquer sur le produit
3. En haut à droite : **⋮** → **Archive product**

⚠️ Le produit n'apparaît plus sur le site mais reste dans l'historique Stripe.

---

## 📦 Gestion des Commandes

### Voir les commandes

1. https://dashboard.stripe.com → **Payments**
2. Liste de toutes les transactions
3. Cliquer sur une transaction pour voir les détails :
   - Produits commandés
   - Email du client
   - Montant payé
   - Statut

### Export des commandes (Excel/CSV)

1. Dashboard Stripe → **Payments**
2. En haut à droite : **Export** → **Export to CSV**
3. Sélectionner la période
4. Télécharger le fichier

### Faire un remboursement

1. Dashboard Stripe → **Payments**
2. Trouver la transaction
3. Cliquer dessus
4. **Refund payment**
5. Choisir :
   - **Full refund** : Remboursement complet
   - **Partial refund** : Remboursement partiel (entrer le montant)
6. Confirmer

⚠️ Les frais Stripe ne sont pas remboursés.

---

## 💳 Réception des paiements

### Où vont les paiements ?

Les paiements arrivent sur votre compte Stripe, puis sont transférés automatiquement vers votre compte bancaire.

### Fréquence des virements

- **Par défaut** : Tous les jours ouvrables
- **Personnalisable** : Settings → Business settings → Payout schedule

### Suivre les virements

1. Dashboard Stripe → **Balance** → **Payouts**
2. Voir :
   - Virements effectués
   - Virements en attente
   - Solde disponible

---

## 📊 Statistiques & Rapports

### Tableau de bord

Dashboard Stripe → **Home**
- Chiffre d'affaires du jour/semaine/mois
- Nombre de transactions
- Graphiques de ventes
- Clients actifs

### Rapports détaillés

Dashboard Stripe → **Reports**
- Export de données
- Analyse des ventes par produit
- Rapports fiscaux

---

## 🛠️ Gestion du Site (Vercel)

### Déployer une mise à jour

Si vous modifiez le code sur GitHub :
1. Commit & Push sur GitHub
2. Vercel déploie automatiquement
3. Site mis à jour en ~2 minutes

### Voir les logs

1. Vercel Dashboard → Votre projet
2. **Deployments** : Historique des déploiements
3. **Analytics** : Statistiques de visite
4. **Logs** : Erreurs éventuelles

### Variables d'environnement

⚠️ **Ne JAMAIS modifier sans l'aide du développeur !**

Vercel → Settings → Environment Variables
- Contient les clés Stripe (secrètes)
- URL du site
- Configuration du webhook

---

## 📧 Support & Problèmes

### Le site ne fonctionne pas ?

1. Vérifier sur https://vercel.com/status (statut Vercel)
2. Vérifier sur https://status.stripe.com (statut Stripe)
3. Contacter le développeur

### Un paiement n'a pas fonctionné ?

1. Dashboard Stripe → **Payments**
2. Rechercher la transaction
3. Voir le statut :
   - **Succeeded** ✅ : Paiement réussi
   - **Failed** ❌ : Paiement échoué (voir la raison)
   - **Refunded** 💰 : Remboursé

### Problèmes courants

| Problème | Solution |
|----------|----------|
| Produit n'apparaît pas sur le site | Vérifier qu'il n'est pas archivé dans Stripe |
| Paiement échoué | Carte invalide, fonds insuffisants, ou carte bloquée |
| Email de confirmation non reçu | Vérifier les spams, sinon voir dans Stripe |
| Site lent | Contacter Vercel support |

---

## 🔒 Sécurité

### Bonnes pratiques

✅ **À FAIRE** :
- Utiliser un mot de passe fort pour Stripe et Vercel
- Activer l'authentification à 2 facteurs (2FA)
- Ne jamais partager vos clés API
- Vérifier régulièrement les transactions suspectes

❌ **À NE PAS FAIRE** :
- Donner vos identifiants Stripe à quelqu'un
- Modifier les variables d'environnement sans savoir
- Désactiver les webhooks Stripe
- Supprimer des fichiers dans GitHub sans comprendre

### Qui peut accéder ?

- **Vous** : Accès complet (propriétaire)
- **Développeur** : Seulement si vous lui donnez accès (maintenance)
- **Personne d'autre**

### En cas de compte piraté

1. Changer immédiatement le mot de passe
2. Révoquer les accès suspects (Stripe → Settings → Team)
3. Contacter le support Stripe : support@stripe.com

---

## 💡 Conseils pour augmenter les ventes

### Optimisation SEO (Référencement Google)

- Ajouter des descriptions détaillées aux produits
- Utiliser des mots-clés pertinents
- Avoir des images de qualité
- Mettre à jour régulièrement le catalogue

### Marketing

- Partager le site sur les réseaux sociaux
- Créer des codes promo dans Stripe (Coupons)
- Envoyer des newsletters aux clients
- Collaborer avec des influenceurs

### Amélioration continue

- Demander des avis clients
- Analyser les produits les plus vendus
- Tester différents prix
- Ajouter de nouveaux produits régulièrement

---

## 📞 Contacts Utiles

| Service | Contact |
|---------|---------|
| **Support Stripe** | support@stripe.com ou https://support.stripe.com |
| **Support Vercel** | https://vercel.com/support |
| **Votre développeur** | [Votre email] |

---

## 📚 Ressources

- [Documentation Stripe](https://stripe.com/docs)
- [Guide Stripe Dashboard](https://stripe.com/docs/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Comment créer un code promo](https://stripe.com/docs/billing/subscriptions/coupons)

---

**🎉 Félicitations ! Vous êtes maintenant propriétaire de votre boutique en ligne.**

Pour toute question, n'hésitez pas à contacter votre développeur.
