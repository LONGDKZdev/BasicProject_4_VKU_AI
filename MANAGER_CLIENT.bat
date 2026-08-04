@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:MENU
cls
echo =======================================================
echo         FLASHCARD AI - CONTROL CENTER CLIENT
echo =======================================================
echo  1. Khoi chay Server (Mo trong cua so rieng)
echo  2. Mo trinh duyet (http://localhost:8080)
echo  3. Don dep (Maven Clean) va Build lai tu dau
echo  4. Thoat
echo =======================================================
set /p "choice=Chon chuc nang (1-4): "

if "%choice%"=="1" goto RUN_SERVER
if "%choice%"=="2" goto OPEN_BROWSER
if "%choice%"=="3" goto CLEAN_BUILD
if "%choice%"=="4" exit

goto MENU

:RUN_SERVER
cls
echo [INFO] Dang mo cua so Server rieng biet...
:: Lenh start dung de bat cua so cmd moi, chay doc lap khong anh huong menu chinh
start "Flashcard AI Server" cmd /k "cd /d "%~dp0flashcardAI_Web" && mvnw.cmd spring-boot:run"
echo [INFO] Server da duoc bat o cua so moi!
echo.
pause
goto MENU

:OPEN_BROWSER
echo [INFO] Dang mo trinh duyet toi http://localhost:8080 ...
start http://localhost:8080
goto MENU

:CLEAN_BUILD
cls
echo [INFO] Dang tien hanh Clean va Compile project...
cd /d "%~dp0flashcardAI_Web"
call mvnw.cmd clean compile
echo [INFO] Hoan tat build lai!
echo.
pause
goto MENU