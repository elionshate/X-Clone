'use client';

import { useState, useRef } from 'react';
import { X, Image, Smile, MapPin, Calendar, MessageCircle, Video } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { tweetAPI } from '@/lib/api';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  duration?: number;
}

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  userId?: number;
}

export function PostModal({ isOpen, onClose, onPostCreated, userId }: PostModalProps) {
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [location, setLocation] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleGetLocation = async () => {
    if (location) {
      // Clear location if already set
      setLocation(null);
      setLocationCoords(null);
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoords({ lat: latitude, lng: longitude });
        
        // Try to get location name from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const locationName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown location';
          const country = data.address?.country || '';
          setLocation(`${locationName}${country ? `, ${country}` : ''}`);
        } catch {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please check your permissions.');
        setIsGettingLocation(false);
      }
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setMediaItems(prev => [...prev, {
              url: e.target!.result as string,
              type: 'image'
            }]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        // Check file size (limit to 50MB for base64)
        if (file.size > 50 * 1024 * 1024) {
          alert('Video file is too large. Maximum size is 50MB.');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            // Create a video element to get duration
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
              const duration = Math.round(video.duration);
              setMediaItems(prev => [...prev, {
                url: e.target!.result as string,
                type: 'video',
                duration
              }]);
            };
            video.src = e.target.result as string;
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeMedia = (index: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
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
      console.log('Creating tweet with userId:', userId, 'content:', content.trim(), 'media items:', mediaItems.length);
      await tweetAPI.createTweet({
        content: content.trim(),
        authorId: userId,
        commentsEnabled,
        mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
        location: location || undefined,
        latitude: locationCoords?.lat,
        longitude: locationCoords?.lng,
      });
      setContent('');
      setMediaItems([]);
      setCommentsEnabled(true);
      setLocation(null);
      setLocationCoords(null);
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
              
              {/* Media Preview (Images and Videos) */}
              {mediaItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {mediaItems.map((media, index) => (
                    <div key={index} className="relative">
                      {media.type === 'image' ? (
                        <img 
                          src={media.url} 
                          alt={`Upload ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="relative w-24 h-24">
                          <video 
                            src={media.url}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                            <Video size={24} className="text-white" />
                          </div>
                          {media.duration && (
                            <span className="absolute bottom-1 right-1 text-xs text-white bg-black/70 px-1 rounded">
                              {Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => removeMedia(index)}
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
          <div className="flex gap-4 items-center">
            {/* Image Input */}
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            {/* Video Input */}
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoSelect}
              accept="video/*"
              className="hidden"
            />
            <button 
              onClick={() => imageInputRef.current?.click()}
              className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-full"
              title="Add images"
            >
              <Image size={20} />
            </button>
            <button 
              onClick={() => videoInputRef.current?.click()}
              className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-full"
              title="Add video"
            >
              <Video size={20} />
            </button>
            <button className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-full">
              <Smile size={20} />
            </button>
            <button 
              onClick={handleGetLocation}
              disabled={isGettingLocation}
              className={`p-2 rounded-full transition-colors ${
                location
                  ? 'text-green-500 bg-green-500/10'
                  : 'text-blue-500 hover:bg-blue-500/10'
              }`}
              title={location || 'Add location'}
            >
              <MapPin size={20} />
            </button>
            <button className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-full">
              <Calendar size={20} />
            </button>
            
            {/* Location Display */}
            {location && (
              <span className={`text-xs truncate max-w-[150px] ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                📍 {location}
              </span>
            )}
            
            {/* Comments Toggle */}
            <div className={`flex items-center gap-2 ml-2 pl-2 border-l ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setCommentsEnabled(!commentsEnabled)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                  commentsEnabled
                    ? 'text-blue-500 bg-blue-500/10'
                    : theme === 'dark'
                      ? 'text-gray-500 bg-gray-800'
                      : 'text-gray-400 bg-gray-100'
                }`}
              >
                <MessageCircle size={16} />
                <span>{commentsEnabled ? 'Comments On' : 'Comments Off'}</span>
              </button>
            </div>
          </div>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {content.length}/280
          </div>
        </div>
      </div>
    </div>
  );
}
