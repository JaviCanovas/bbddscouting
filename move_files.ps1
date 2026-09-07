Move-Item -Path .\app_temp\src\app -Destination .\app -Force
Remove-Item -Path .\app_temp\src -Recurse -Force
Get-ChildItem -Path ".\app_temp" -Force | Move-Item -Destination ".\" -Force
Remove-Item -Path ".\app_temp" -Recurse -Force
