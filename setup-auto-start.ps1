# Script PowerShell para criar atalho na inicialização
# Execute este script UMA VEZ para configurar a inicialização automática

$WScriptShell = New-Object -ComObject WScript.Shell

# Caminho do script .bat que inicia o servidor
$ScriptPath = "$PSScriptRoot\start-limitless.bat"

# Caminho da pasta de inicialização do Windows
$StartupFolder = [System.Environment]::GetFolderPath('Startup')

# Caminho do atalho que será criado
$ShortcutPath = "$StartupFolder\Limitless Glass Manager.lnk"

# Criar o atalho
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $ScriptPath
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.Description = "Limitless Glass Manager - Inicia automaticamente com Windows"
$Shortcut.WindowStyle = 7  # Janela minimizada
$Shortcut.Save()

Write-Host "Inicializacao automatica configurada com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "O Limitless Glass Manager agora iniciara automaticamente quando voce ligar o computador." -ForegroundColor Cyan
Write-Host ""
Write-Host "Atalho criado em: $ShortcutPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para REMOVER a inicializacao automatica, delete o atalho na pasta:" -ForegroundColor White
Write-Host "   $StartupFolder" -ForegroundColor Gray
Write-Host ""

# Perguntar se quer testar agora
$response = Read-Host "Deseja testar o script agora? (S/N)"
if ($response -eq 'S' -or $response -eq 's') {
    Write-Host "Iniciando servidor..." -ForegroundColor Green
    Start-Process -FilePath $ScriptPath
}

Read-Host "Pressione ENTER para fechar"
