'use client';

import { useState, useRef } from 'react';
import { X, Image, Smile, MapPin, Calendar } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { tweetAPI } from '@/lib/api';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  userId?: number;
}

export function PostModal({ isOpen, onClose, onPostCreated, userId }: PostModalProps) {
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
            setImages(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    
    if (!userId) {
      console.error('No user ID available. Please wait for authentication.');
      alert('Please wait for authentication to complete before posting.');
      return;
    }
    
    setIsPosting(true);
    try {
      console.log('Creating tweet with userId:', userId, 'content:', content.trim());
      await tweetAPI.createTweet({
        content: content.trim(),
        authorId: userId,
      });
      setContent('');
      setImages([]);
      onClose();
      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
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
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={onClose}
            className={`p-2 rounded-full ${
              theme === 'dark' ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-100 text-black'
            }`}
          >
            <X size={20} />
          </button>
          <button
            onClick={handlePost}
            disabled={!content.trim() || isPosting}
            className={`px-4 py-2 rounded-full font-bold ${
              content.trim() && !isPosting
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-blue-500/50 text-white/50 cursor-not-allowed'
            }`}
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-full flex-shrink-0 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
            }`} />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                className={`w-full text-xl outline-none resize-none min-h-[120px] ${
                  theme === 'dark' 
                    ? 'bg-black text-white placeholder-gray-500' 
                    : 'bg-white text-black placeholder-gray-400'
                }`}
                autoFocus
              />
              
              {/* Image Preview */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={img} 
                        alt={`Upload ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className={`flex items-center justify-between p-4 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-full"
            >
              <Image size={20} />
            </button>
            <button className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-full">
              <Smile size={20} />
            </button>
            <button className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-full">
              <MapPin size={20} />
            </button>
            <button className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-full">
              <Calendar size={20} />
            </button>
          </div>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {content.length}/280
          </div>
        </div>
      </div>
    </div>
  );
}
