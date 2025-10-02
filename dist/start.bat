@echo off
echo ========================================
echo   Serveur de developpement Filegator
echo ========================================
echo.
echo Demarrage du serveur sur http://localhost:8080
echo.
echo Fichiers disponibles:
echo - http://localhost:8080/test.html (page de test)
echo - http://localhost:8080/test-api.html (test API backend)
echo - http://localhost:8080/dashboard-vue-classic.html
echo - http://localhost:8080/parametres-vue-simple.html
echo - http://localhost:8080/login.html
echo - http://localhost:8080/index.html
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.
cd /d "%~dp0"
echo Repertoire de travail: %CD%
echo.
npx http-server -p 8080 -o -c-1 --cors
