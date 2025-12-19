# Omi Manager

A local-first web application to manage and organize your **Omi AI** conversations, memories, and action items.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🌟 Features

- **📱 Conversations**: Browse and organize your Omi AI conversations
- **🧠 Memories**: View and search through your AI-generated memories
- **✅ Action Items**: Track tasks extracted from your conversations
- **📁 Folders**: Create custom folders to organize your data
- **⭐ Favorites**: Mark important items for quick access
- **🏷️ Tags**: Add custom tags for better filtering
- **🔍 Search**: Full-text search across all your data
- **🌙 Dark Mode**: Beautiful dark and light themes

## 🔐 Privacy First

- **100% Local**: All data is stored in your browser's IndexedDB
- **No Cloud Required**: Works completely offline after initial sync
- **Your Token, Your Data**: API token never leaves your browser

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- An Omi account with API access

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/omi-manager.git

# Navigate to the project
cd omi-manager

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at: **http://localhost:3000**

### Getting Your Omi API Token

1. Open the **Omi App** on your phone
2. Go to **Settings → Developers → Developer API**
3. Copy your API token
4. Paste it in the app's Settings

## 🛠️ Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **IndexedDB** - Local Database
- **Lucide Icons** - Icon Library

## 📁 Project Structure

```
omi-manager/
├── components/         # React components
├── services/
│   ├── api.ts         # API and data layer
│   └── auth.ts        # Local authentication
├── lib/
│   └── localDB.ts     # IndexedDB wrapper
├── hooks/             # Custom React hooks
├── App.tsx            # Main application
├── index.tsx          # Entry point
└── types.ts           # TypeScript definitions
```

## 📦 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## ⚠️ Important Notes

- **Data Persistence**: Data is stored in your browser. Clearing browser data will delete your synced content.
- **Sync**: You need to manually sync to get new data from Omi
- **Independent Project**: This is a community project, not officially affiliated with Omi AI (omi.me)

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Omi AI](https://omi.me) for their amazing AI assistant
- The open-source community for the amazing tools

---

**Made with ❤️ for the Omi community**
