@echo off
title FlixOn Squeeze Background Compressor
cd /d "%~dp0"
echo ====================================================
echo   FlixOn Squeeze Background Compression Engine
echo   Monitoring Supabase Queue for B2 ^& R2 Jobs
echo ====================================================
echo.
node scripts/compressor.js
pause
