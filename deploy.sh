#!/bin/bash

# Script de déploiement automatique vers Vercel
# Usage: npm run deploy

echo "🚀 Déploiement automatique vers Vercel..."
echo ""

# Étape 1 : Build local
echo "📦 Build de l'application Angular..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors du build"
  exit 1
fi

echo "✅ Build terminé"
echo ""

# Étape 2 : Déploiement vers Vercel en production
echo "🌐 Déploiement vers Vercel (production)..."
vercel --prod --yes

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors du déploiement"
  exit 1
fi

echo ""
echo "✅ Déploiement terminé avec succès !"
echo "🌍 Votre site est maintenant en ligne sur : https://les-senteurs-amira.vercel.app"
