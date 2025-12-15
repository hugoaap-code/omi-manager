@echo off
title Limitless Glass Manager - Local Server
echo ==================================================
echo   LIMITLESS GLASS MANAGER - Servidor Local
echo ==================================================
echo.
echo Iniciando servidor...
echo O navegador abrira automaticamente em breve.
echo.
echo Para PARAR o servidor, feche esta janela.
echo ==================================================
echo.

cd /d "%~dp0"

REM Verifica se node_modules existe, se não, instala
if not exist "node_modules\" (
    echo Instalando dependencias pela primeira vez...
    call npm install
)

REM Inicia o servidor e abre o navegador
start http://localhost:3000
npm run dev

pause
