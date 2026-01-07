import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import { requireAuth } from '../../lib/utils/verifyJWT';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!
});

// Désactiver le parsing automatique du body
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * API d'upload d'images vers Cloudinary
 * Protégée par authentification admin
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS - Configuration des headers
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://les-senteurs-d-amira.vercel.app',
    'https://les-senteurs-d-amira-tan.vercel.app',
    'https://les-senteurs-amira.vercel.app',
    'https://projet-vente-parfumeris.vercel.app',
    'http://localhost:4200',
    'http://localhost:3000'
  ];

  const isAllowed = origin && (
    allowedOrigins.includes(origin) ||
    (origin.endsWith('.vercel.app') && (origin.includes('les-senteurs-d-amira') || origin.includes('les-senteurs-amira')))
  );

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  } else if (origin) {
    return res.status(403).json({
      success: false,
      error: 'Origin not allowed'
    });
  }

  // Gérer la requête OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Seules les requêtes POST sont autorisées
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Méthode non autorisée'
    });
  }

  // Vérification authentification
  if (!requireAuth(req, res)) {
    return;
  }

  try {
    // Parser le formulaire multipart
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5 MB max
      allowEmptyFiles: false,
      filter: ({ mimetype }: { mimetype?: string | null }) => {
        // Accepter uniquement les images
        return mimetype?.includes('image') || false;
      }
    });

    const [, files] = await form.parse(req);

    // Récupérer le fichier uploadé
    const file = files.image?.[0];

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier image fourni'
      });
    }

    // Upload vers Cloudinary
    const result = await cloudinary.uploader.upload(file.filepath, {
      folder: 'parfums-amira', // Dossier dans Cloudinary
      transformation: [
        { width: 800, height: 800, crop: 'limit' }, // Redimensionner si trop grand
        { quality: 'auto' }, // Optimisation automatique
        { fetch_format: 'auto' } // Format optimal (WebP si supporté)
      ]
    });

    // Retourner l'URL de l'image
    return res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    });

  } catch (error: any) {
    console.error('❌ Erreur upload image:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'upload de l\'image'
    });
  }
}
