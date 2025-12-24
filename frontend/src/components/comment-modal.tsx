'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { commentAPI } from '@/lib/api';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tweetId: number;
  tweetContent: string;
  tweetAuthor: string;
  userId?: number;
  onCommentCreated?: () => void;
}

export function CommentModal({ 
  isOpen, 
  onClose, 
  tweetId, 
  tweetContent, 
  tweetAuthor,
  userId,
  onCommentCreated 
}: CommentModalProps) {
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  if (!isOpen) return null;

  const handleComment = async () => {
    if (!content.trim() || !userId) return;
    
    setIsPosting(true);
    try {
      await commentAPI.createComment({
        content: content.trim(),
        tweetId,
        authorId: userId,
      });
      setContent('');
      onClose();
      onCommentCreated?.();
    } catch (error) {
      console.error('Error creating comment:', error);
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
        </div>
        
        {/* Original Tweet */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex-shrink-0 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
              }`} />
              <div className={`w-0.5 flex-1 mt-2 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
              }`} />
            </div>
            <div className="flex-1 pb-4">
              <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {tweetAuthor}
              </p>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {tweetContent}
              </p>
              <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                Replying to <span className="text-blue-500">@{tweetAuthor}</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Reply Content */}
        <div className="p-4">
          <div className="flex gap-4">
            <div className={`w-10 h-10 rounded-full flex-shrink-0 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
            }`} />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Post your reply"
                className={`w-full text-xl outline-none resize-none min-h-[100px] ${
                  theme === 'dark' 
                    ? 'bg-black text-white placeholder-gray-500' 
                    : 'bg-white text-black placeholder-gray-400'
                }`}
                autoFocus
              />
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className={`flex items-center justify-end p-4 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={handleComment}
            disabled={!content.trim() || isPosting}
            className={`px-4 py-2 rounded-full font-bold ${
              content.trim() && !isPosting
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-blue-500/50 text-white/50 cursor-not-allowed'
            }`}
          >
            {isPosting ? 'Replying...' : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}
