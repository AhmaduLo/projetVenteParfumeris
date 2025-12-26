/**
 * API de test pour vérifier l'envoi d'emails via Resend
 *
 * Route : GET /api/test-email
 *
 * Test simple pour diagnostiquer les problèmes d'envoi d'emails
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env['RESEND_API_KEY']!);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Permettre seulement GET pour ce test
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    console.log('🧪 Test d\'envoi d\'email Resend...');
    console.log('📧 Clé API Resend présente:', !!process.env['RESEND_API_KEY']);

    // Tenter d'envoyer un email de test
    const emailData = await resend.emails.send({
      from: 'Les Senteurs d\'Amira <onboarding@resend.dev>',
      to: ['gbamba123@gmail.com'],
      subject: '🧪 Email de test - Les Senteurs d\'Amira',
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px;">
    <h1 style="color: #667eea;">✅ Test réussi !</h1>
    <p>Si vous recevez cet email, cela signifie que votre configuration Resend fonctionne correctement.</p>
    <p><strong>Détails techniques :</strong></p>
    <ul>
      <li>Expéditeur : onboarding@resend.dev</li>
      <li>Destinataire : gbamba123@gmail.com</li>
      <li>Service : Resend</li>
      <li>Date : ${new Date().toLocaleString('fr-FR')}</li>
    </ul>
    <p style="color: #718096; font-size: 14px; margin-top: 30px;">
      Les Senteurs d'Amira - Email de test
    </p>
  </div>
</body>
</html>
      `
    });

    console.log('✅ Email de test envoyé avec succès !');
    console.log('📧 ID de l\'email:', emailData.data?.id);
    console.log('📧 Détails:', JSON.stringify(emailData, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Email de test envoyé à gbamba123@gmail.com',
      emailId: emailData.data?.id,
      details: emailData,
      instructions: 'Vérifiez votre boîte de réception et le dossier spam de gbamba123@gmail.com'
    });

  } catch (error: any) {
    console.error('❌ Erreur lors du test d\'envoi d\'email:', error);

    return res.status(500).json({
      success: false,
      error: 'Erreur lors du test d\'envoi d\'email',
      message: error.message,
      details: error.response?.body || error
    });
  }
}
