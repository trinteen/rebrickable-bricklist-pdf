@echo off
chcp 65001
for /f "tokens=*" %%a in (numbers.txt) do (
  node rebrickable-bricklist-pdf.js "%%a"
)