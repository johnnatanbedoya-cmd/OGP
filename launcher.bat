@echo off
title OGP - Perfiles Ocupacionales
cd /d "%~dp0"

echo Iniciando OGP - Perfiles Ocupacionales...
start "OGP - servidor" cmd /k npm run dev

timeout /t 6 /nobreak >nul
start "" http://localhost:3000/login
