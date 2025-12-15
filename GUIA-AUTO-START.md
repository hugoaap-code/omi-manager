# 🚀 Guia de Inicialização Automática

## Opção 1: Inicialização Automática com Windows (Recomendado)

### Configuração em 2 passos:

#### Passo 1: Execute o script de configuração

1. Abra o PowerShell **como Administrador**:
   - Pressione `Windows + X`
   - Clique em "Windows PowerShell (Admin)" ou "Terminal (Admin)"

2. Navegue até a pasta do projeto:
   ```powershell
   cd "c:\Users\hugoa\OneDrive\Documentos\Projetos\limitless-glass-manager - cópia"
   ```

3. Execute o script de configuração:
   ```powershell
   .\setup-auto-start.ps1
   ```

4. Se aparecer erro de política de execução, execute primeiro:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\setup-auto-start.ps1
   ```

#### Passo 2: Reinicie e teste!

Agora o sistema iniciará automaticamente quando você ligar o Windows! 🎉

---

## Opção 2: Iniciar Manualmente (Mais simples)

Se preferir iniciar manualmente quando quiser, basta dar duplo clique em:

📄 `start-limitless.bat`

Isso abrirá o servidor e o navegador automaticamente.

---

## 📋 O que foi criado?

### 1. `start-limitless.bat`
- Script que inicia o servidor
- Abre o navegador automaticamente
- Instala dependências se necessário

### 2. `setup-auto-start.ps1`
- Configura inicialização automática
- Cria atalho na pasta de Inicialização do Windows
- Executa minimizado

---

## ❓ Como usar depois de configurado?

### Inicialização Automática
- ✅ Liga o computador → Sistema inicia sozinho
- ✅ Abre http://localhost:3000 automaticamente
- ✅ Fica rodando em segundo plano

### Parar o Servidor
- Procure a janela do terminal minimizada
- Feche a janela OU pressione `Ctrl+C`

### Remover Inicialização Automática
1. Pressione `Windows + R`
2. Digite: `shell:startup` e pressione Enter
3. Delete o atalho "Limitless Glass Manager"

---

## 🔧 Solução de Problemas

### Erro: "Scripts desabilitados"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Porta 3000 já em uso
O script detecta se já está rodando e usa outra porta.

### Servidor não inicia
1. Abra `start-limitless.bat` manualmente
2. Veja os erros no terminal
3. Certifique-se de que o Node.js está instalado

---

## 🎯 Resumo Rápido

| Ação | Comando |
|------|---------|
| **Configurar auto-start** | `.\setup-auto-start.ps1` |
| **Iniciar manualmente** | Duplo clique em `start-limitless.bat` |
| **Ver pasta de startup** | `Windows + R` → `shell:startup` |
| **Parar servidor** | Fechar janela do terminal |

---

## 💡 Dicas

- O servidor roda em **http://localhost:3000**
- Os dados ficam salvos no navegador (IndexedDB)
- Pode usar offline depois de sincronizar
- Para backup, exporte os dados (botão nas configurações - a implementar)

---

**Configurado? Reinicie o PC para testar! 🎉**
