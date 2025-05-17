@echo off
(for /d %%i in (src public functions) do (
  echo [%%i]
  dir /s /b /a:-d "%%i" | findstr /v /i "\\node_modules\\ \\.git\\ \\.vscode\\ \\.next\\ \\.env \\dist\\ \\build\\"
)) > estrutura_projeto.txt