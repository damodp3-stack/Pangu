@echo off
title PANGU — AI Desktop Companion
color 0b
echo ===================================================
echo     🐾 PANGU — AI Best Friend ^& Desktop Companion
echo ===================================================
echo.
echo Starting Pangu Desktop Overlay...
echo [Emergency Privacy Switch: Ctrl + Shift + P]
echo.

npm start

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Could not start Pangu. Please make sure Node.js is installed.
    pause
)
