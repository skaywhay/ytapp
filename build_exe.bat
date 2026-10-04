@echo off
chcp 65001 >nul
cd /d %~dp0
echo ========================================================
echo         Сборка YT Deck в исполняемый .exe файл
echo ========================================================
echo.

where pyinstaller >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] PyInstaller не найден в PATH. Пробуем через python -m PyInstaller...
    python -m pip install pyinstaller
)

echo [*] Запуск PyInstaller...
python -m PyInstaller --clean -y yt_deck.spec

if %errorlevel% equ 0 (
    copy /y "dist\YT_Deck.exe" "YT_Deck.exe" >nul
    echo.
    echo ========================================================
    echo  [OK] Успешно собрано!
    echo  Файл скопирован в корень проекта: YT_Deck.exe
    echo ========================================================
) else (
    echo.
    echo [ERROR] Во время сборки произошла ошибка.
)

pause
