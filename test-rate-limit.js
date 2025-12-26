/**
 * Script de test du rate limiting
 * Simule plusieurs tentatives de connexion échouées
 *
 * Usage: node test-rate-limit.js
 */

const API_URL = 'https://les-senteurs-d-amira.vercel.app/api/admin/login';
// const API_URL = 'http://localhost:3000/api/admin/login'; // Pour test local

async function testRateLimit() {
  console.log('🧪 Test du Rate Limiting\n');
  console.log(`📍 API URL: ${API_URL}\n`);

  for (let i = 1; i <= 7; i++) {
    console.log(`Tentative ${i}/7...`);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'wrong@email.com',
          password: 'wrongpassword'
        })
      });

      const data = await response.json();

      console.log(`  Status: ${response.status}`);
      console.log(`  Réponse: ${data.error || data.message}`);

      if (data.retryAfter) {
        console.log(`  ⏱️  Réessayer dans: ${data.retryAfter} secondes`);
      }

      console.log('');

      if (response.status === 429) {
        console.log('✅ Rate limiting fonctionne ! Blocage après 5 tentatives.\n');
        break;
      }

      // Attendre un peu entre les tentatives
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`  ❌ Erreur:`, error.message);
      console.log('');
    }
  }

  console.log('🎉 Test terminé !');
}

testRateLimit();
