# Sistema de Tradução Automática - Limitless Manager

## 📚 Visão Geral

O sistema detecta automaticamente o idioma do navegador do usuário e traduz toda a interface.

## 🌍 Idiomas Suportados

- **🇺🇸 English (en)** - Inglês (padrão)
- **🇧🇷 Português (pt)** - Português do Brasil  
- **🇪🇸 Español (es)** - Espanhol

## 🚀 Como Usar

### Em Componentes Funcionais

```tsx
import { useTranslation } from '../hooks/useTranslation';

function MyComponent() {
  const { t, language, setLanguage } = useTranslation();
  
  return (
    <div>
      <h1>{t.dashboard}</h1>
      <button>{t.save}</button>
      <p>Current language: {language}</p>
    </div>
  );
}
```

### Exemplos de Tradução

```tsx
// Navigation
<h1>{t.dashboard}</h1>          // Dashboard / Painel / Panel
<h1>{t.chats}</h1>              // Chats / Conversas / Chats
<h1>{t.lifelogs}</h1>           // Lifelogs / Registros / Registros

// Actions
<button>{t.save}</button>        // Save / Salvar / Guardar
<button>{t.delete}</button>      // Delete / Excluir / Eliminar
<button>{t.sync}</button>        // Sync / Sincronizar / Sincronizar

// Filters
<option>{t.all}</option>         // All / Todos / Todos
<option>{t.favorites}</option>   // Favorites / Favoritos / Favoritos

// Settings
<h2>{t.settings}</h2>            // Settings / Configurações / Configuración
<button>{t.logout}</button>      // Log Out / Sair / Cerrar Sesión
```

## 🔧 Estrutura de Arquivos

```
/lib/i18n.ts                    # Arquivo de traduções
/hooks/useTranslation.tsx       # Hook React para traduções
/index.tsx                      # Wrapped com I18nProvider
```

## 🎯 Detecção Automática

O sistema detecta o idioma assim:

1. Verifica se há idioma salvo no localStorage (`limitless_language`)
2. Se não, detecta do navegador usando `navigator.language`
3. Mapeia para idiomas suportados:
   - `pt-BR`, `pt-PT`, `pt` → português
   - `es-ES`, `es-MX`, `es` → espanhol
   - Outros → inglês (padrão)

## 📝 Adicionar Novas Traduções

Edite `/lib/i18n.ts`:

```tsx
const en: Translations = {
  // ... existing
  myNewKey: "My Text",
};

const pt: Translations = {
  // ... existing
  myNewKey: "Meu Texto",
};

const es: Translations = {
  // ... existing
  myNewKey: "Mi Texto",
};
```

Use no componente:
```tsx
<span>{t.myNewKey}</span>
```

## 🌐 Trocar Idioma Manualmente (Opcional)

```tsx
const { setLanguage } = useTranslation();

// Botões de idioma
<button onClick={() => setLanguage('en')}>English</button>
<button onClick={() => setLanguage('pt')}>Português</button>
<button onClick={() => setLanguage('es')}>Español</button>
```

## ✅ Status da Implementação

- ✅ Sistema de tradução criado
- ✅ Hook React implementado
- ✅ Provider configurado
- ✅ Detecção automática ativa
- ✅ 3 idiomas suportados
- ⏳ Aplicar em todos os componentes (próximo passo)

## 🎨 Componentes Já Traduzidos

- ✅ Sidebar (parcial - hook instalado)

## 📋 Próximos Passos

Para completar a tradução, substitua textos hardcoded por `{t.key}`:

1. AuthPage
2. Dashboard
3. LifelogPage
4. ChatModal
5. Settings Modals
6. OnboardingModal

Exemplo de conversão:
```tsx
// ANTES
<h1>Dashboard</h1>

// DEPOIS
<h1>{t.dashboard}</h1>
```
