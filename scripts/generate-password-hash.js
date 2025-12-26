/**
 * Script pour générer un hash bcrypt d'un mot de passe
 * Usage: node scripts/generate-password-hash.js "votre-mot-de-passe"
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('❌ Usage: node scripts/generate-password-hash.js "votre-mot-de-passe"');
  process.exit(1);
}

const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('\n✅ Hash généré avec succès!\n');
console.log('Mot de passe:', password);
console.log('Hash:', hash);
console.log('\nAjoutez ce hash dans vos variables d\'environnement Vercel:');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('\n');
