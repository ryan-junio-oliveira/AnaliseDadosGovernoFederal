@echo off
REM Inicia o Painel Fiscal da Uniao (React) em http://localhost:8000
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale em https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias (primeira vez, pode demorar)...
  call npm install
  if errorlevel 1 (
    echo Falha no npm install.
    pause
    exit /b 1
  )
)
echo Abrindo http://localhost:8000 ...
start "" http://localhost:8000
call npm run dev
pause
