@echo off
REM Painel Fiscal - Menu interativo, duplo-clique, sem terminal.
REM Toda coleta JA exporta para o frontend e valida sozinha.
REM Regras deste arquivo: ASCII puro, CRLF, sem blocos IF com
REM parenteses e sem parenteses nos textos exibidos.

cd /d "%~dp0"
set ROOT=%~dp0
if "%ROOT:~-1%"=="\" set ROOT=%ROOT:~0,-1%
set SCRIPTS=%ROOT%\scripts

where python >nul 2>nul
if errorlevel 1 goto SEM_PYTHON

REM Checagem silenciosa: export_json/validar/atualizar precisam de pandas.
REM Se faltar, instala sozinho em vez de quebrar no meio da coleta.
python -c "import pandas" >nul 2>nul
if errorlevel 1 goto FALTA_PANDAS

:MENU
cls
echo ============================================================
echo  PAINEL FISCAL - Menu de operacoes
echo ============================================================
echo.
echo  [1] Atualizar TUDO - RTN + SIOP + front atualizado
echo  [2] Coletar UMA UF - SICONFI - ex SP, RJ, DF
echo  [3] Coletar TODAS as UFs - SICONFI - demora!
echo  [4] Iniciar painel local - abre o navegador
echo  [5] Avancado - validar, RTN/SIOP separados, build...
echo  [0] Sair
echo.
echo  Toda coleta ja exporta para o frontend e valida sozinha.
echo.
set /p OPCAO="Escolha uma opcao: "
if "%OPCAO%"=="1" goto ATUALIZAR
if "%OPCAO%"=="2" goto SICONFI_UF
if "%OPCAO%"=="3" goto SICONFI_TODAS
if "%OPCAO%"=="4" goto DEV
if "%OPCAO%"=="5" goto AVANCADO
if "%OPCAO%"=="0" goto FIM
echo Opcao invalida. Tente de novo.
pause
goto MENU

:SEM_PYTHON
echo [ERRO] Python nao encontrado. Instale em https://www.python.org/downloads/
echo        Marque a opcao Add python.exe to PATH na instalacao.
pause
goto FIM

:FALTA_PANDAS
echo [AVISO] Dependencias Python pandas nao encontradas. Instalando sozinho...
python -m pip install -r "%SCRIPTS%\requirements.txt"
if errorlevel 1 goto FALHA_PANDAS
echo [OK] Dependencias instaladas. Seguindo para o menu...
pause
goto MENU

:FALHA_PANDAS
echo [FALHA] Nao consegui instalar. Rode a opcao 5 Avancado item 5
echo        ou execute: python -m pip install -r scripts\requirements.txt
pause
goto FIM

:EXPORTA_E_VALIDA
echo.
if not exist "%ROOT%data\rtn_mensal_2022_2026.csv" goto SEM_BASE_UNIAO
echo == Exportando para o frontend - public/data ==
python "%SCRIPTS%\export_json.py" || goto FALHA_EXPORT
python "%SCRIPTS%\validar.py" || goto FALHA_VALID
echo [OK] Frontend atualizado e validado.
pause
goto MENU

:SEM_BASE_UNIAO
echo [AVISO] Base da Uniao em data/ nao existe. UFs coletadas com sucesso.
echo        Rode a opcao 1 Atualizar TUDO uma vez para gerar tudo do zero.
python "%SCRIPTS%\validar.py" || goto FALHA_VALID
echo [OK] UFs salvas em public/data/uf. Frontend da Uniao inalterado.
pause
goto MENU

:FALHA_EXPORT
echo [FALHA] Exportacao falhou - veja as mensagens acima.
pause
goto MENU

:FALHA_VALID
echo [FALHA] Dados inconsistentes - veja acima.
pause
goto MENU

:ATUALIZAR
echo.
echo == Atualizando tudo - pode demorar varios minutos ==
python "%SCRIPTS%\atualizar.py" || goto FALHA_COLETA
goto EXPORTA_E_VALIDA

:FALHA_COLETA
echo [AVISO] Coleta falhou - veja as mensagens acima.
pause
goto MENU

:SICONFI_UF
echo.
set UF=
set /p UF="Sigla da UF - ex SP, RJ, DF [SP]: "
if "%UF%"=="" set UF=SP
set ANOS=
set /p ANOS="Anos separados por espaco [Enter = decada automatica]: "
if "%ANOS%"=="" goto SICONFI_UF_AUTO
echo == Coletando SICONFI da UF %UF% - anos %ANOS% ==
python "%SCRIPTS%\coleta_siconfi.py" --uf %UF% --anos %ANOS% || goto FALHA_COLETA
goto EXPORTA_E_VALIDA

:SICONFI_UF_AUTO
echo == Coletando SICONFI da UF %UF% - decada automatica ==
python "%SCRIPTS%\coleta_siconfi.py" --uf %UF% || goto FALHA_COLETA
goto EXPORTA_E_VALIDA

:SICONFI_TODAS
echo.
echo [ATENCAO] Baixa o RREO das 27 UFs e pode demorar bastante.
set CONFIRMA=
set /p CONFIRMA="Confirmar? S/N [N]: "
if /i not "%CONFIRMA%"=="S" goto MENU
set ANOS2=
set /p ANOS2="Anos separados por espaco [Enter = decada automatica]: "
if "%ANOS2%"=="" goto SICONFI_TODAS_AUTO
python "%SCRIPTS%\coleta_siconfi.py" --todos --anos %ANOS2% || goto FALHA_COLETA
goto EXPORTA_E_VALIDA

:SICONFI_TODAS_AUTO
python "%SCRIPTS%\coleta_siconfi.py" --todos || goto FALHA_COLETA
goto EXPORTA_E_VALIDA

:DEV
echo.
where node >nul 2>nul
if errorlevel 1 goto SEM_NODE
if not exist "%ROOT%\node_modules" goto INSTALA_NODE
goto INICIA_DEV

:SEM_NODE
echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org/
pause
goto MENU

:INSTALA_NODE
echo Instalando dependencias do painel. Na primeira vez pode demorar...
call npm install --prefix "%ROOT%"
if errorlevel 1 goto FALHA_NPM
goto INICIA_DEV

:FALHA_NPM
echo [FALHA] npm install falhou - veja acima.
pause
goto MENU

:INICIA_DEV
echo Abrindo http://localhost:8000 ...
start "" http://localhost:8000
call npm run dev --prefix "%ROOT%"
pause
goto MENU

:AVANCADO
cls
echo ============================================================
echo  AVANCADO - o menu principal ja faz o fluxo completo
echo  com exportacao automatica
echo ============================================================
echo.
echo  [1] So validar dados
echo  [2] So exportar para o frontend + validar
echo  [3] So baixar RTN
echo  [4] So processar RTN - XLSX para CSVs
echo  [5] So coletar orgaos SIOP - SEM exportar
echo  [6] Instalar dependencias Python
echo  [7] Build de producao - dist para Vercel
echo  [0] Voltar
echo.
set ADV=
set /p ADV="Escolha: "
if "%ADV%"=="1" goto ADV_VALIDAR
if "%ADV%"=="2" goto EXPORTA_E_VALIDA
if "%ADV%"=="3" goto ADV_RTN
if "%ADV%"=="4" goto ADV_PROCESSA
if "%ADV%"=="5" goto ADV_ORGAOS
if "%ADV%"=="6" goto ADV_REQS
if "%ADV%"=="7" goto ADV_BUILD
if "%ADV%"=="0" goto MENU
echo Opcao invalida.
pause
goto AVANCADO

:ADV_VALIDAR
python "%SCRIPTS%\validar.py"
pause
goto AVANCADO

:ADV_RTN
python "%SCRIPTS%\coleta.py"
pause
goto AVANCADO

:ADV_PROCESSA
python "%SCRIPTS%\processa_rtn.py"
pause
goto AVANCADO

:ADV_ORGAOS
set ANOS3=
set /p ANOS3="Anos separados por espaco [Enter = decada automatica]: "
if "%ANOS3%"=="" goto ADV_ORGAOS_AUTO
python "%SCRIPTS%\coleta_orgaos_todos.py" %ANOS3%
pause
goto AVANCADO

:ADV_ORGAOS_AUTO
python "%SCRIPTS%\coleta_orgaos_todos.py"
pause
goto AVANCADO

:ADV_REQS
python -m pip install -r "%SCRIPTS%\requirements.txt"
pause
goto AVANCADO

:ADV_BUILD
where node >nul 2>nul
if errorlevel 1 goto SEM_NODE_BUILD
call npm run build --prefix "%ROOT%"
if errorlevel 1 goto FALHA_BUILD
echo [OK] Pasta dist gerada. E so publicar na Vercel.
pause
goto AVANCADO

:SEM_NODE_BUILD
echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org/
pause
goto AVANCADO

:FALHA_BUILD
echo [FALHA] Build com erros - veja acima.
pause
goto AVANCADO

:FIM
exit /b 0
