@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

set "APP_NAME=flashcard-ai"
set "APP_URL=http://localhost:8080/"

echo.
echo =====================================================
echo   FLASHCARD AI - Study Space (Spring Boot + Firestore)
echo   Starting development server...
echo =====================================================
echo.

if not exist "mvnw.cmd" (
    echo ERROR: Maven wrapper not found: mvnw.cmd
    pause
    exit /b 1
)

echo [1/2] Cleaning and building Spring Boot project...
call .\mvnw.cmd clean compile
if errorlevel 1 (
    echo ERROR: Maven build failed.
    pause
    exit /b 1
)
echo Build completed successfully!
echo.

echo [2/2] Starting Spring Boot application...
echo URL: %APP_URL%
echo.

REM Mở tự động trình duyệt sau 2 giây
powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process '%APP_URL%'"

REM Chạy ứng dụng Spring Boot
call .\mvnw.cmd spring-boot:run

pause
exit /b 0