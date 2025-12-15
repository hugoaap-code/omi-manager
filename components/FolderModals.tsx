import React, { useState, useEffect } from 'react';
import { Folder } from '../types';
import { Icons } from './Icons';

const FOLDER_COLORS = [
  { id: 'text-white/70', bg: 'bg-gray-500', label: 'Default' },
  { id: 'text-blue-400', bg: 'bg-blue-400', label: 'Blue' },
  { id: 'text-purple-400', bg: 'bg-purple-400', label: 'Purple' },
  { id: 'text-green-400', bg: 'bg-green-400', label: 'Green' },
  { id: 'text-yellow-400', bg: 'bg-yellow-400', label: 'Yellow' },
  { id: 'text-red-400', bg: 'bg-red-400', label: 'Red' },
  { id: 'text-pink-400', bg: 'bg-pink-400', label: 'Pink' },
];

// --- Edit/Create Folder Modal ---
interface FolderModalProps {
  onClose: () => void;
  onSubmit: (name: string, color: string) => void;
  initialName?: string;
  initialColor?: string;
  mode: 'create' | 'edit';
}

export const FolderModal: React.FC<FolderModalProps> = ({ 
  onClose, 
  onSubmit, 
  initialName = '', 
  initialColor = 'text-white/70',
  mode 
}) => {
  const [name, setName] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState(initialColor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onSubmit(name, selectedColor);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-panel bg-white dark:bg-[#1A1A1F] p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-200 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-semibold mb-4">
            {mode === 'create' ? 'New Folder' : 'Edit Folder'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
              <label className="block text-xs font-bold opacity-50 uppercase tracking-widest mb-2">Name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Folder Name"
                className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
              />
          </div>

          <div className="mb-6">
             <label className="block text-xs font-bold opacity-50 uppercase tracking-widest mb-2">Color</label>
             <div className="flex flex-wrap gap-3">
                {FOLDER_COLORS.map(color => (
                    <button
                        key={color.id}
                        type="button"
                        onClick={() => setSelectedColor(color.id)}
                        className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center transition-transform hover:scale-110 ${selectedColor === color.id ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#1A1A1F] ring-offset-white' : 'opacity-70 hover:opacity-100'}`}
                        title={color.label}
                    >
                        {selectedColor === color.id && <Icons.Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                ))}
             </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg opacity-60 hover:bg-black/5 dark:hover:bg-white/5 hover:opacity-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {mode === 'create' ? 'Create Folder' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Move To Folder Modal ---
interface MoveToFolderModalProps {
  folders: Folder[];
  onClose: () => void;
  onSelect: (folderId: string | undefined) => void; // undefined = Inbox/None
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({ folders, onClose, onSelect }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm glass-panel bg-white dark:bg-[#1A1A1F] p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-200 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Move to...</h3>
            <button onClick={onClose} className="opacity-40 hover:opacity-100"><Icons.Close className="w-5 h-5" /></button>
        </div>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          <button
            onClick={() => onSelect(undefined)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl opacity-70 hover:bg-black/5 dark:hover:bg-white/10 hover:opacity-100 transition-colors text-left"
          >
            <Icons.Inbox className="w-5 h-5" />
            <span>Inbox (No Folder)</span>
          </button>
          
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => onSelect(folder.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl opacity-70 hover:bg-black/5 dark:hover:bg-white/10 hover:opacity-100 transition-colors text-left"
            >
              <Icons.Folder className={`w-5 h-5 ${folder.color || ''}`} />
              <span>{folder.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Delete Folder Confirmation Modal ---
interface DeleteFolderModalProps {
    folderName: string;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({ folderName, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm glass-panel bg-white dark:bg-[#1A1A1F] p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-200 border border-red-500/20 dark:border-red-500/10 shadow-2xl">
                <div className="flex flex-col items-center text-center text-gray-900 dark:text-white">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
                        <Icons.Alert className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Delete "{folderName}"?</h3>
                    <p className="text-sm opacity-60 mb-6">
                        Are you sure you want to delete this folder? 
                        <br/>
                        <span className="opacity-40 text-xs mt-2 block">Chats inside will NOT be deleted, they will be moved to "All Chats".</span>
                    </p>
                    
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-500 dark:text-red-400 border border-red-500/20 transition-colors font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};