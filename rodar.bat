@echo off
REM Inicia o Painel Fiscal da Uniao em http://localhost:8000
REM Sem blocos IF com parenteses e sem parenteses nos textos:
REM o parser do cmd rejeita essa combinacao.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto SEM_NODE
if not exist node_modules goto INSTALA
goto INICIA

:SEM_NODE
echo Node.js nao encontrado. Instale em https://nodejs.org/
pause
exit /b 1

:INSTALA
echo Instalando dependencias. Na primeira vez pode demorar...
call npm install
if errorlevel 1 goto FALHA_NPM
goto INICIA

:FALHA_NPM
echo Falha no npm install. Veja as mensagens acima.
pause
exit /b 1

:INICIA
echo Abrindo http://localhost:8000 ...
start "" http://localhost:8000
call npm run dev
pause
