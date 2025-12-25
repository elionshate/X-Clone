'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Image, MapPin, Trash2, Calendar, Lock } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { tweetAPI } from '@/lib/api';

interface TweetMedia {
  id: number;
  mediaUrl: string;
  mediaType: string;
}

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  tweet: {
    id: number;
    content: string;
    media?: TweetMedia[];
    location?: string;
    latitude?: number;
    longitude?: number;
    commentsEnabled?: boolean;
    createdAt: string;
  } | null;
  onPostUpdated: () => void;
}

export function EditPostModal({ isOpen, onClose, tweet, onPostUpdated }: EditPostModalProps) {
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [existingMedia, setExistingMedia] = useState<TweetMedia[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [mediaIdsToRemove, setMediaIdsToRemove] = useState<number[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tweet) {
      setContent(tweet.content);
      setExistingMedia(tweet.media || []);
      setNewImages([]);
      setMediaIdsToRemove([]);
      setLocation(tweet.location || null);
      if (tweet.latitude && tweet.longitude) {
        setLocationCoords({ lat: tweet.latitude, lng: tweet.longitude });
      } else {
        setLocationCoords(null);
      }
    }
  }, [tweet]);

  if (!isOpen || !tweet) return null;

  const formatCreatedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
            setNewImages(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeExistingImage = (mediaId: number) => {
    setMediaIdsToRemove(prev => [...prev, mediaId]);
    setExistingMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await tweetAPI.updateTweet(tweet.id, {
        content: content.trim(),
        mediaUrls: newImages.length > 0 ? newImages : undefined,
        mediaIdsToRemove: mediaIdsToRemove.length > 0 ? mediaIdsToRemove : undefined,
        location: location || undefined,
        latitude: locationCoords?.lat,
        longitude: locationCoords?.lng,
      });
      onPostUpdated();
      onClose();
    } catch (err) {
      setError('Failed to update post. Please try again.');
      console.error('Error updating post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalImages = existingMedia.length + newImages.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-xl mx-4 my-8 rounded-2xl shadow-xl ${
        theme === 'dark' ? 'bg-black' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-800 text-white' 
                : 'hover:bg-gray-100 text-black'
            }`}
          >
            <X size={20} />
          </button>
          <h2 className={`text-lg font-bold ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            Edit Post
          </h2>
          <div className="w-10" />
        </div>

        {/* Immutable Creation Date */}
        <div className={`px-4 py-3 border-b flex items-center gap-2 ${
          theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
        }`}>
          <Lock size={14} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
          <Calendar size={14} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Created: {formatCreatedDate(tweet.createdAt)}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            theme === 'dark' ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'
          }`}>
            Immutable
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className={`w-full min-h-[120px] p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              theme === 'dark' 
                ? 'bg-gray-900 text-white placeholder-gray-500 border border-gray-700' 
                : 'bg-gray-50 text-black placeholder-gray-400 border border-gray-200'
            }`}
            maxLength={280}
          />

          {/* Existing Images */}
          {existingMedia.length > 0 && (
            <div className="mt-4">
              <h4 className={`text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Current Images
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {existingMedia.map((media) => (
                  <div key={media.id} className="relative rounded-lg overflow-hidden">
                    <img
                      src={media.mediaUrl}
                      alt=""
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(media.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images */}
          {newImages.length > 0 && (
            <div className="mt-4">
              <h4 className={`text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                New Images
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {newImages.map((img, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden">
                    <img
                      src={img}
                      alt=""
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Display */}
          {location && (
            <div className={`mt-3 flex items-center gap-2 text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <MapPin size={14} className="text-blue-500" />
              <span>{location}</span>
              <button
                type="button"
                onClick={() => {
                  setLocation(null);
                  setLocationCoords(null);
                }}
                className="ml-auto p-1 rounded-full hover:bg-red-500/20"
              >
                <X size={14} className="text-red-500" />
              </button>
            </div>
          )}

          {/* Action Buttons Row */}
          <div className={`flex items-center gap-2 mt-4 pt-4 border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={totalImages >= 4}
              className={`p-2 rounded-full transition-colors ${
                totalImages >= 4
                  ? 'opacity-50 cursor-not-allowed'
                  : theme === 'dark'
                    ? 'hover:bg-blue-900/30 text-blue-500'
                    : 'hover:bg-blue-100 text-blue-500'
              }`}
              title="Add images"
            >
              <Image size={20} />
            </button>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isGettingLocation}
              className={`p-2 rounded-full transition-colors ${
                location 
                  ? 'text-blue-500' 
                  : theme === 'dark' 
                    ? 'text-gray-500 hover:bg-blue-900/30 hover:text-blue-500' 
                    : 'text-gray-500 hover:bg-blue-100 hover:text-blue-500'
              }`}
              title={location ? 'Update location' : 'Add location'}
            >
              <MapPin size={20} />
            </button>
            <span className={`text-sm ml-auto ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {content.length}/280
            </span>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                theme === 'dark'
                  ? 'text-white hover:bg-gray-800'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className={`px-6 py-2 rounded-full font-bold transition-colors ${
                isSubmitting || !content.trim()
                  ? 'bg-blue-500/50 text-white cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
