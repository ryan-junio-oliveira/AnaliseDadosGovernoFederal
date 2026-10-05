@echo off
where node >nul 2>nul
if errorlevel 1 (
  echo SEM-NODE
  exit /b 3
)
echo PASSOU-DO-BLOCO
exit /b 0
