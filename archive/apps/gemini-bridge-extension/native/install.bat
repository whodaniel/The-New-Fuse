@echo off
setlocal

set INSTALLDIR=%USERPROFILE%\.thenewfuse
set MANIFESTDIR=%LOCALAPPDATA%\Google\Chrome\User Data\NativeMessagingHosts

if not exist "%INSTALLDIR%" mkdir "%INSTALLDIR%"
copy host.py "%INSTALLDIR%\host.py"

REM Update manifest path
(for /f "delims=" %%a in (com.your_company.thenewfuse.json) do (
    set "line=%%a"
    setlocal enabledelayedexpansion
    echo(!line:/absolute/path/to/host.py=%INSTALLDIR:\=\\%\\host.py%!
    endlocal
)) > "%INSTALLDIR%\com.your_company.thenewfuse.json"

if not exist "%MANIFESTDIR%" mkdir "%MANIFESTDIR%"
copy "%INSTALLDIR%\com.your_company.thenewfuse.json" "%MANIFESTDIR%\"

echo Native host installed. Please restart Chrome.
