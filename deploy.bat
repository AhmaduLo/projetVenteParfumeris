@echo off
REM Script de déploiement automatique vers Vercel (Windows)
REM Usage: npm run deploy

echo.
echo ===================================
echo   Deploiement automatique Vercel
echo ===================================
echo.

REM Étape 1 : Build local
echo [1/2] Build de l'application Angular...
call npm run build

if errorlevel 1 (
    echo.
    echo [ERREUR] Le build a echoue
    exit /b 1
)

echo [OK] Build termine
echo.

REM Étape 2 : Déploiement vers Vercel en production
echo [2/2] Deploiement vers Vercel ^(production^)...
call vercel --prod --yes

if errorlevel 1 (
    echo.
    echo [ERREUR] Le deploiement a echoue
    exit /b 1
)

echo.
echo ===================================
echo   Deploiement termine avec succes!
echo ===================================
echo.
echo Site en ligne: https://les-senteurs-amira.vercel.app
echo.
