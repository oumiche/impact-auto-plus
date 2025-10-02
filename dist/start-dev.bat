@echo off
echo Demarrage du serveur de developpement...
echo.
echo Serveur accessible sur: http://localhost:8080
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.
cd /d "%~dp0"
php -S localhost:8080 dev-server.php
