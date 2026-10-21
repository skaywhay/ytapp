@echo off
chcp 65001 >nul
cd /d %~dp0
echo ========================================================
echo       Сборка графического инсталлятора YT Deck Setup
echo ========================================================
echo.

if not exist "YT_Deck.exe" (
    if exist "dist\YT_Deck.exe" (
        copy /y "dist\YT_Deck.exe" "YT_Deck.exe" >nul
    ) else (
        echo [*] Сначала собираем основной YT_Deck.exe...
        call build_exe.bat
    )
)

echo [*] Сборка YT_Deck_Setup.exe...
cd installer
python -m PyInstaller --clean -y installer.spec

if %errorlevel% equ 0 (
    copy /y "dist\YT_Deck_Setup.exe" "..\YT_Deck_Setup.exe" >nul
    cd ..
    echo.
    echo ========================================================
    echo  [OK] Успешно собран инсталлятор YT_Deck_Setup.exe!
    echo  Файл скопирован в корень проекта: YT_Deck_Setup.exe
    echo ========================================================
) else (
    cd ..
    echo.
    echo [ERROR] Во время сборки инсталлятора произошла ошибка.
)

pause
