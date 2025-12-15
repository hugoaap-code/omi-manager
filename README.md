# Omi Manager - Versão Local

## 🎯 O que mudou?

Este projeto foi **completamente reconstruído para funcionar 100% offline e local**, sem depender do Firebase ou qualquer serviço em nuvem.

## 🔧 Tecnologias

### Armazenamento de Dados
- **IndexedDB**: Banco de dados local do navegador para armazenar:
  - Usuários e autenticação
  - Chats e conversas
  - Lifelogs
  - Pastas e organização
  - Sincronizações

### Autenticação
- Sistema de autenticação local usando IndexedDB
- Senhas codificadas em Base64 (para produção, usar bcrypt)
- Sessão armazenada em localStorage

### Removido
- ❌ Firebase Authentication
- ❌ Firebase Firestore
- ❌ Firebase Storage
- ❌ Firebase Functions
- ❌ Firebase Hosting

## 🚀 Como usar

### 1. Instalação
```bash
npm install
```

### 2. Executar localmente
```bash
npm run dev
```

O sistema estará disponível em: **http://localhost:3000**

### 3. Primeiro acesso

Você tem 2 opções:

#### Opção 1: Modo Demo
- Clique em "Login as Demo" na tela de login
- Usuário: `demo@limitless.ai`
- Senha: `demo123`

#### Opção 2: Criar conta
- Clique em "Sign Up"
- Crie sua própria conta local
- Os dados ficam salvos no IndexedDB do seu navegador

## 📦 Estrutura de Dados

Todos os dados são armazenados localmente no navegador usando IndexedDB:

```
limitless_glass_manager (Database)
├── users           # Perfis de usuário
├── chats           # Conversas sincronizadas
├── lifelogs        # Registros de vida
├── folders         # Pastas de organização
└── syncedDates     # Controle de sincronização
```

## 🔐 Segurança

**IMPORTANTE**: 
- Os dados ficam armazenados apenas no seu navegador
- Se você limpar os dados do navegador, **perderá todos os dados**
- Para backup, você pode exportar os dados (recurso a ser implementado)
- As senhas são codificadas em Base64 (não use senhas importantes!)

## 🔄 Sincronização com Limitless

A integração com a API do Limitless continua funcionando:
- Configure seu token da API nas configurações
- Sincronize chats e lifelogs normalmente
- Os dados são armazenados localmente após sync

## 🛠️ Desenvolvimento

### Arquitetura

```
services/
├── auth.ts         # Autenticação local
└── api.ts          # API de dados (IndexedDB)

lib/
├── localDB.ts      # Camada de abstração do IndexedDB
└── firebase.ts     # Stub vazio (compatibilidade)
```

### Principais mudanças no código

1. **auth.ts**: Substituído Firebase Auth por sistema local
2. **api.ts**: Todas as chamadas Firestore → IndexedDB
3. **localDB.ts**: Nova camada de banco de dados local
4. **package.json**: Removidas dependências do Firebase

## 📝 TODO / Melhorias Futuras

- [ ] Adicionar sistema de backup/export de dados
- [ ] Implementar hash de senha adequado (bcrypt)
- [ ] Sistema de recuperação de senha local
- [ ] Exportar/Importar dados em JSON
- [ ] Sincronização P2P entre dispositivos (opcional)

## 🐛 Problemas Conhecidos

- Se limpar cache do navegador, perde todos os dados
- Senhas não são criptografadas adequadamente
- Não há sincronização entre dispositivos

## 💡 Vantagens da Versão Local

✅ **Privacidade total** - Seus dados nunca saem do seu computador  
✅ **Sem custos** - Não precisa de servidores ou Firebase  
✅ **Offline-first** - Funciona sem internet (exceto sync Limitless)  
✅ **Rápido** - Sem latência de rede  
✅ **Simples** - Apenas npm install e pronto  

## ⚠️ Desvantagens

❌ Dados limitados ao navegador  
❌ Sem backup automático  
❌ Não sincroniza entre dispositivos  
❌ Pode perder dados se limpar cache  

## 🆘 Suporte

Este é um projeto local para uso pessoal. Para dúvidas sobre a API Limitless, consulte a documentação oficial.

---

**Desenvolvido para funcionar 100% local - Nenhum dado é enviado para nuvem**
