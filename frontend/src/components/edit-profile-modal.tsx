'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { userAPI } from '@/lib/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  currentName: string;
  currentUsername: string;
  currentBio?: string;
  currentAvatar?: string;
  onProfileUpdated?: () => void;
}

export function EditProfileModal({ 
  isOpen, 
  onClose, 
  userId,
  currentName,
  currentUsername,
  currentBio = '',
  currentAvatar = '',
  onProfileUpdated 
}: EditProfileModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState(currentName);
  const [bio, setBio] = useState(currentBio);
  const [avatar, setAvatar] = useState(currentAvatar);
  const [avatarPreview, setAvatarPreview] = useState(currentAvatar);
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(currentName);
    setBio(currentBio);
    setAvatar(currentAvatar);
    setAvatarPreview(currentAvatar);
  }, [currentName, currentBio, currentAvatar]);

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarPreview(result);
        // For now, we'll use the data URL directly
        // In production, you'd upload to a cloud storage
        setAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      await userAPI.updateUser(userId, {
        name: name.trim(),
        bio: bio.trim(),
        avatar: avatar || undefined,
      });
      onClose();
      onProfileUpdated?.();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-xl mx-4 rounded-2xl shadow-xl ${
        theme === 'dark' ? 'bg-black border border-gray-700' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-6">
            <button 
              onClick={onClose}
              className={`p-2 rounded-full ${
                theme === 'dark' ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-100 text-black'
              }`}
            >
              <X size={20} />
            </button>
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              Edit profile
            </h2>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className={`px-4 py-1.5 rounded-full font-bold ${
              !isSaving && name.trim()
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
        
        {/* Cover Photo */}
        <div className={`relative h-32 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors">
              <Camera size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="px-4">
          <div className={`relative -mt-12 w-24 h-24 rounded-full border-4 overflow-hidden ${
            theme === 'dark' 
              ? 'border-black bg-gray-700' 
              : 'border-white bg-gray-300'
          }`}>
            {avatarPreview && (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              <button 
                onClick={() => avatarInputRef.current?.click()}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <Camera size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Name Input */}
          <div className={`border rounded-lg p-3 ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
          }`}>
            <label className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className={`w-full bg-transparent outline-none text-lg ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}
            />
            <div className={`text-right text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              {name.length}/50
            </div>
          </div>

          {/* Bio Input */}
          <div className={`border rounded-lg p-3 ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
          }`}>
            <label className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              className={`w-full bg-transparent outline-none resize-none ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}
            />
            <div className={`text-right text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              {bio.length}/160
            </div>
          </div>

          {/* Username (read-only) */}
          <div className={`border rounded-lg p-3 ${
            theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-gray-100'
          }`}>
            <label className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              Username
            </label>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              @{currentUsername}
            </p>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
              Username cannot be changed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
