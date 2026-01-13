@echo off
REM Script pour lancer le développement local (Windows)
REM Usage: npm run dev:local

echo.
echo ==========================================
echo   Developpement Local - Les Senteurs d'Amira
echo ==========================================
echo.

echo [INFO] Ce script va lancer:
echo   1. API backend sur http://localhost:3000
echo   2. Frontend Angular sur http://localhost:4200
echo.
echo Appuyez sur Ctrl+C pour arreter les serveurs
echo.

REM Vérifier que .env existe
if not exist ".env" (
    echo [ERREUR] Le fichier .env n'existe pas!
    echo Veuillez creer un fichier .env avec vos cles Stripe.
    exit /b 1
)

echo [1/2] Demarrage de l'API backend (Vercel Dev)...
echo.
start "API Backend - Port 3000" cmd /k "vercel dev --listen 3000"

REM Attendre 5 secondes que l'API démarre
timeout /t 5 /nobreak > nul

echo [2/2] Demarrage du frontend Angular...
echo.
start "Frontend Angular - Port 4200" cmd /k "npm start"

echo.
echo ==========================================
echo   Serveurs demarres!
echo ==========================================
echo.
echo Backend API:  http://localhost:3000
echo Frontend:     http://localhost:4200
echo.
echo Deux fenetres de terminal se sont ouvertes.
echo Fermez-les pour arreter les serveurs.
echo.
