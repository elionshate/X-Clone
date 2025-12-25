'use client';

import { useState, useEffect, useRef } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { MessageCircle, Send, Plus, Users, ArrowLeft, Settings, X, Image, Paperclip } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { chatAPI, userAPI } from "@/lib/api";

interface MessageMedia {
  id: number;
  mediaUrl: string;
  mediaType: string;
  fileName?: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  avatar?: string;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  sender: User;
  media?: MessageMedia[];
  createdAt: string;
}

interface Chat {
  id: number;
  name?: string;
  isGroup: boolean;
  members: { user: User; isAdmin: boolean }[];
  lastMessage?: Message;
  messages?: Message[];
  updatedAt: string;
}

function ChatContent() {
  const { theme } = useTheme();
  const { user: clerkUser } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [backendUserId, setBackendUserId] = useState<number | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [messageMedia, setMessageMedia] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get backend user
  useEffect(() => {
    const getBackendUser = async () => {
      if (!clerkUser?.username) return;
      
      try {
        const user = await userAPI.getUserByUsername(clerkUser.username);
        if (user?.id) {
          setBackendUserId(user.id);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };

    getBackendUser();
  }, [clerkUser?.username]);

  // Load chats
  useEffect(() => {
    const loadChats = async () => {
      if (!backendUserId) return;
      
      try {
        setLoading(true);
        const userChats = await chatAPI.getChatsByUserId(backendUserId);
        setChats(userChats || []);
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [backendUserId]);

  // Load all users for new chat creation
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await userAPI.getAllUsers();
        setAllUsers(users || []);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
  }, []);

  // Load messages when chat is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChat) return;
      
      try {
        const chatMessages = await chatAPI.getMessages(selectedChat.id);
        setMessages(chatMessages || []);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [selectedChat?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && messageMedia.length === 0) || !selectedChat || !backendUserId) return;

    try {
      const message = await chatAPI.sendMessage(
        selectedChat.id, 
        backendUserId, 
        newMessage.trim() || '📎 Attachment',
        messageMedia.length > 0 ? messageMedia : undefined
      );
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setMessageMedia([]);
      
      // Update chat list with new last message
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, lastMessage: message }
          : chat
      ));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setMessageMedia(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeMedia = (index: number) => {
    setMessageMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateChat = async () => {
    if (!backendUserId || selectedUsers.length === 0) return;

    try {
      const memberIds = [backendUserId, ...selectedUsers];
      const isGroup = memberIds.length > 2 || isCreatingGroup;
      
      const newChat = await chatAPI.createChat(
        memberIds,
        isGroup ? groupName || 'New Group' : undefined,
        isGroup
      );
      
      setChats(prev => [newChat, ...prev]);
      setSelectedChat(newChat);
      setShowNewChatModal(false);
      setSelectedUsers([]);
      setGroupName('');
      setIsCreatingGroup(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.name) return chat.name;
    if (chat.isGroup) return 'Group Chat';
    
    const otherMember = chat.members.find(m => m.user.id !== backendUserId);
    return otherMember?.user.name || 'Unknown';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroup) return null;
    const otherMember = chat.members.find(m => m.user.id !== backendUserId);
    return otherMember?.user.avatar;
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatChatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return formatMessageTime(dateString);
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <div className="flex justify-center max-w-[1400px] mx-auto">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Chat List */}
        <div className={`w-80 border-r flex flex-col ${
          theme === 'dark' ? 'border-gray-700 bg-black' : 'border-gray-200 bg-white'
        }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            Messages
          </h1>
          <button
            onClick={() => setShowNewChatModal(true)}
            className={`p-2 rounded-full ${
              theme === 'dark' ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-100 text-black'
            }`}
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className={`p-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading chats...
            </div>
          ) : chats.length === 0 ? (
            <div className={`p-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              No conversations yet
            </div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b cursor-pointer transition-colors ${
                  selectedChat?.id === chat.id
                    ? theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                    : theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-50'
                } ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                  }`}>
                    {chat.isGroup ? (
                      <Users size={20} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                    ) : getChatAvatar(chat) ? (
                      <img src={getChatAvatar(chat)!} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {getChatName(chat)}
                      </span>
                      {chat.lastMessage && (
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatChatTime(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {chat.lastMessage.sender.id === backendUserId ? 'You: ' : ''}
                        {chat.lastMessage.content}
                      </p>
                    )}
                    {chat.isGroup && (
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {chat.members.length} members
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <main className={`flex-1 flex flex-col ${
        theme === 'dark' ? 'bg-black' : 'bg-white'
      }`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className={`p-4 border-b flex items-center gap-3 ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button 
                onClick={() => setSelectedChat(null)}
                className={`p-2 rounded-full md:hidden ${
                  theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                <ArrowLeft size={20} className={theme === 'dark' ? 'text-white' : 'text-black'} />
              </button>
              <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
              }`}>
                {selectedChat.isGroup ? (
                  <Users size={18} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                ) : getChatAvatar(selectedChat) ? (
                  <img src={getChatAvatar(selectedChat)!} alt="" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <h2 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  {getChatName(selectedChat)}
                </h2>
                {selectedChat.isGroup && (
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedChat.members.map(m => m.user.name).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === backendUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${
                    message.senderId === backendUserId ? 'order-2' : ''
                  }`}>
                    {selectedChat.isGroup && message.senderId !== backendUserId && (
                      <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {message.sender.name}
                      </p>
                    )}
                    {/* Message Media */}
                    {message.media && message.media.length > 0 && (
                      <div className="mb-2 space-y-2">
                        {message.media.map((m, i) => (
                          m.mediaType === 'image' ? (
                            <img key={i} src={m.mediaUrl} alt="" className="max-w-full rounded-lg" />
                          ) : (
                            <a 
                              key={i}
                              href={m.mediaUrl}
                              download={m.fileName}
                              className={`flex items-center gap-2 p-2 rounded-lg ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                              }`}
                            >
                              <Paperclip size={16} />
                              <span className="truncate">{m.fileName || 'File'}</span>
                            </a>
                          )
                        ))}
                      </div>
                    )}
                    <div className={`px-4 py-2 rounded-2xl ${
                      message.senderId === backendUserId
                        ? 'bg-blue-500 text-white'
                        : theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'
                    }`}>
                      <p>{message.content}</p>
                    </div>
                    <p className={`text-xs mt-1 ${
                      message.senderId === backendUserId ? 'text-right' : ''
                    } ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Media Preview */}
              {messageMedia.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {messageMedia.map((media, index) => (
                    <div key={index} className="relative">
                      {media.startsWith('data:image') ? (
                        <img src={media} alt="" className="w-16 h-16 object-cover rounded-lg" />
                      ) : (
                        <div className={`w-16 h-16 flex items-center justify-center rounded-lg ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <Paperclip size={20} />
                        </div>
                      )}
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-full ${
                    theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <Image size={20} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Start a new message"
                  className={`flex-1 px-4 py-2 rounded-full outline-none ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-white placeholder-gray-500' 
                      : 'bg-gray-100 text-black placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() && messageMedia.length === 0}
                  className={`p-2 rounded-full ${
                    (newMessage.trim() || messageMedia.length > 0)
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : theme === 'dark' ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full">
            <MessageCircle size={64} className={`mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <h3 className={`text-2xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>Select a message</h3>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Choose from your existing conversations or start a new one
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600"
            >
              New message
            </button>
          </div>
        )}
      </main>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setShowNewChatModal(false);
            setSelectedUsers([]);
            setGroupName('');
            setIsCreatingGroup(false);
          }} />
          <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-xl ${
            theme === 'dark' ? 'bg-black border border-gray-700' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setShowNewChatModal(false);
                    setSelectedUsers([]);
                    setGroupName('');
                    setIsCreatingGroup(false);
                  }}
                  className={`p-2 rounded-full ${
                    theme === 'dark' ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-100 text-black'
                  }`}
                >
                  <X size={20} />
                </button>
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  New message
                </h2>
              </div>
              <button
                onClick={handleCreateChat}
                disabled={selectedUsers.length === 0}
                className={`px-4 py-1.5 rounded-full font-bold ${
                  selectedUsers.length > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                {isCreatingGroup ? 'Create Group' : 'Next'}
              </button>
            </div>

            {/* Group Name Input (if creating group) */}
            {(isCreatingGroup || selectedUsers.length > 1) && (
              <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name (optional)"
                  className={`w-full px-4 py-2 rounded-lg outline-none ${
                    theme === 'dark'
                      ? 'bg-gray-800 text-white placeholder-gray-500'
                      : 'bg-gray-100 text-black placeholder-gray-400'
                  }`}
                />
              </div>
            )}

            {/* User List */}
            <div className="max-h-96 overflow-y-auto">
              {allUsers
                .filter(user => user.id !== backendUserId)
                .map(user => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUsers(prev => 
                        prev.includes(user.id)
                          ? prev.filter(id => id !== user.id)
                          : [...prev, user.id]
                      );
                    }}
                    className={`p-4 flex items-center gap-3 cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full overflow-hidden ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                    }`}>
                      {user.avatar && (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {user.name}
                      </p>
                      <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                        @{user.username}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedUsers.includes(user.id)
                        ? 'bg-blue-500 border-blue-500'
                        : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                    }`}>
                      {selectedUsers.includes(user.id) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Create Group Toggle */}
            <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                className={`flex items-center gap-2 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
                }`}
              >
                <Users size={18} />
                <span>{isCreatingGroup ? 'Creating group chat' : 'Create a group chat'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <>
      <SignedIn>
        <ChatContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
