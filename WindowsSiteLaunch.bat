@echo off

REM Start first terminal and run npm start
start cmd /k "npm start"

REM Start second terminal, change directory, then run npm start
start cmd /k "cd /d client\src && npm start"