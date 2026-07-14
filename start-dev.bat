@echo off  
cd /d "F:\Local_git\Study_2026\workflow101"  
npx next dev --port 3000 --webpack > dev-server.log 2>&1  
exit /b 0  
