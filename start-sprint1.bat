@echo off
echo ===============================================
echo   Plateforme Educative - Sprint 1
echo   Demarrage des services...
echo ===============================================
echo.

:: Verifier si Node.js est installe
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Node.js n'est pas installe ou pas dans le PATH
    pause
    exit /b 1
)

echo [1/3] Demarrage de l'API Backend (port 3000)...
start "API Backend" cmd /k "cd /d %~dp0api-v2 && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/3] Demarrage du Web App (port 5173)...
start "Web App" cmd /k "cd /d %~dp0web-app && npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] Demarrage de l'Admin App (port 5174)...
start "Admin App" cmd /k "cd /d %~dp0admin-app && npm run dev"

echo.
echo ===============================================
echo   Tous les services sont en cours de demarrage!
echo ===============================================
echo.
echo   URLs d'acces:
echo   - API:       http://localhost:3000
echo   - Web App:   http://localhost:5173
echo   - Admin:     http://localhost:5174
echo.
echo   Pour arreter: fermez les fenetres de terminal
echo ===============================================
pause
