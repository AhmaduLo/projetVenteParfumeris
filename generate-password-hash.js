/**
 * Script pour générer un hash de mot de passe bcrypt
 * Usage: node generate-password-hash.js "VotreMotDePasse"
 */

const bcrypt = require('bcryptjs');

// Récupérer le mot de passe depuis les arguments
const password = process.argv[2];

if (!password) {
  console.error('❌ Erreur: Vous devez fournir un mot de passe');
  console.log('Usage: node generate-password-hash.js "VotreMotDePasse"');
  process.exit(1);
}

// Générer le hash (10 rounds de salage)
const hash = bcrypt.hashSync(password, 10);

console.log('✅ Hash généré avec succès!\n');
console.log('Mot de passe:', password);
console.log('Hash:', hash);
console.log('\nPour mettre à jour sur Vercel:');
console.log(`vercel env rm ADMIN_PASSWORD_HASH production`);
console.log(`echo "${hash}" | vercel env add ADMIN_PASSWORD_HASH production`);
