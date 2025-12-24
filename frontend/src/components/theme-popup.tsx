'use client';

import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';

export function ThemePopup() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div className="relative" ref={popupRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 w-full p-3 rounded-full transition-colors ${
          theme === 'dark' 
            ? 'hover:bg-gray-800 text-white' 
            : 'hover:bg-gray-100 text-black'
        }`}
      >
        {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
        <span className="text-lg font-semibold">Theme</span>
      </button>

      {isOpen && (
        <div className={`absolute bottom-full left-0 mb-2 w-48 rounded-xl shadow-lg border ${
          theme === 'dark' 
            ? 'bg-black border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="py-2">
            {themes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setTheme(id as 'light' | 'dark');
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 transition-colors ${
                  theme === id
                    ? 'bg-blue-500/10 text-blue-500'
                    : theme === 'dark'
                    ? 'text-white hover:bg-gray-800'
                    : 'text-black hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
                {theme === id && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
