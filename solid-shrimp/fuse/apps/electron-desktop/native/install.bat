@echo off
REM Install script for The New Fuse Native Host (Windows)

echo Installing The New Fuse Native Host...

REM Check if Python 3 is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python 3 is required but not installed.
    echo Please install Python 3 and try again.
    pause
    exit /b 1
)

echo Python 3 found

REM Check and install required Python packages
echo Checking Python dependencies...

python -c "import psutil" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing psutil...
    pip install psutil
    if %errorlevel% neq 0 (
        echo Failed to install psutil. Please install it manually: pip install psutil
        pause
        exit /b 1
    )
)

python -c "import pyautogui" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing pyautogui...
    pip install pyautogui
    if %errorlevel% neq 0 (
        echo Failed to install pyautogui. Please install it manually: pip install pyautogui
        pause
        exit /b 1
    )
)

echo Python dependencies satisfied

REM Create wrapper batch file
set SCRIPT_DIR=%~dp0
set HOST_SCRIPT=%SCRIPT_DIR%host.py
set INSTALL_DIR=%ProgramFiles%\TNF Native Host

mkdir "%INSTALL_DIR%" 2>nul

echo @echo off > "%INSTALL_DIR%\tnf-native-host.bat"
echo python "%HOST_SCRIPT%" %%* >> "%INSTALL_DIR%\tnf-native-host.bat"

echo Native host installed to %INSTALL_DIR%

REM Install manifest for Chrome (Windows)
set CHROME_MANIFEST_DIR=%LOCALAPPDATA%\Google\Chrome\User Data\NativeMessagingHosts
mkdir "%CHROME_MANIFEST_DIR%" 2>nul

REM Update manifest with correct path and Windows path format
powershell -Command "(Get-Content '%SCRIPT_DIR%com.thenewfuse.nativehost.json') -replace '/usr/local/bin/tnf-native-host', '%INSTALL_DIR%\tnf-native-host.bat' | Set-Content '%CHROME_MANIFEST_DIR%\com.thenewfuse.nativehost.json'"

echo Chrome manifest installed for Windows

echo.
echo The New Fuse Native Host installation complete!
echo.
echo Installation Summary:
echo   • Native host script: %HOST_SCRIPT%
echo   • System executable: %INSTALL_DIR%\tnf-native-host.bat
echo   • Chrome manifest: Installed for current user
echo.
echo Next Steps:
echo   1. Restart Chrome browser
echo   2. Run The New Fuse Electron app
echo   3. Test native commands in the Local Services tab
echo.
pause
