'use client';
import { useCallback, useEffect, useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import {
  X, Bell, BellOff, Ban, Trash2, ChevronDown, ChevronUp, Pin,
  Phone, Video, Mail, Users, Image as ImageIcon, FileText, Link2
} from 'lucide-react';
import { toast } from 'sonner';

const SHARED_PAGE_SIZE = 24;

export default function ContactInfoPanel({
  conversation,
  onClose,
  onPreferencesUpdated,
  onConversationRemoved,
}) {
  const [showMedia, setShowMedia] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [isMuted, setIsMuted] = useState(conversation.isMuted);
  const [isPinned, setIsPinned] = useState(conversation.isPinned);
  const [sharedMedia, setSharedMedia] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const [isLoadingMoreShared, setIsLoadingMoreShared] = useState(false);
  const [sharedPagination, setSharedPagination] = useState({
    skip: 0,
    hasMore: false,
    totalCount: 0,
  });

  useEffect(() => {
    setIsMuted(conversation.isMuted);
    setIsPinned(conversation.isPinned);
  }, [conversation]);

  const loadShared = useCallback(async ({ skip = 0, append = false } = {}) => {
    if (append) {
      setIsLoadingMoreShared(true);
    } else {
      setIsLoadingShared(true);
    }

    try {
      const response = await fetch(
        `/api/conversations/${conversation.id}/shared?limit=${SHARED_PAGE_SIZE}&skip=${skip}`
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load shared items');
      }

      setSharedMedia((prev) => (append ? [...prev, ...(payload.media || [])] : payload.media || []));
      setSharedFiles((prev) => (append ? [...prev, ...(payload.files || [])] : payload.files || []));
      setSharedPagination({
        skip,
        hasMore: Boolean(payload.pagination?.hasMore),
        totalCount: payload.pagination?.totalCount || 0,
      });
    } catch {
      if (!append) {
        setSharedMedia([]);
        setSharedFiles([]);
      }
    } finally {
      if (append) {
        setIsLoadingMoreShared(false);
      } else {
        setIsLoadingShared(false);
      }
    }
  }, [conversation.id]);

  useEffect(() => {
    loadShared({ skip: 0, append: false });
  }, [loadShared]);

  const handleLoadMoreShared = async () => {
    if (!sharedPagination.hasMore || isLoadingMoreShared) {
      return;
    }

    await loadShared({
      skip: sharedPagination.skip + SHARED_PAGE_SIZE,
      append: true,
    });
  };

  const updatePreferences = async (nextPreferences) => {
    const response = await fetch(`/api/conversations/${conversation.id}/members`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nextPreferences),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to update preferences');
    }

    onPreferencesUpdated?.(conversation.id, payload.preferences);
    return payload.preferences;
  };

  const toggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);

    try {
      await updatePreferences({ isMuted: next });
      toast.success(next ? 'Notifications muted' : 'Notifications enabled');
    } catch (error) {
      setIsMuted(!next);
      toast.error(error.message || 'Unable to update mute preference');
    }
  };

  const togglePin = async () => {
    const next = !isPinned;
    setIsPinned(next);

    try {
      await updatePreferences({ isPinned: next });
      toast.success(next ? 'Conversation pinned' : 'Conversation unpinned');
    } catch (error) {
      setIsPinned(!next);
      toast.error(error.message || 'Unable to update pin preference');
    }
  };

  const removeConversationForCurrentUser = async (successMessage) => {
    const response = await fetch(`/api/conversations/${conversation.id}`, {
      method: 'DELETE',
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to update conversation');
    }

    onConversationRemoved?.(conversation.id);
    toast.success(successMessage);
    onClose();
  };

  const handleLeaveGroup = async () => {
    try {
      await removeConversationForCurrentUser('You left the group');
    } catch (error) {
      toast.error(error.message || 'Unable to leave group');
    }
  };

  const handleDeleteConversation = async () => {
    try {
      await removeConversationForCurrentUser('Conversation removed');
    } catch (error) {
      toast.error(error.message || 'Unable to delete conversation');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto chat-scrollbar">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <p className="text-sm font-700 text-gray-900">
          {conversation.isGroup ? 'Group info' : 'Contact info'}
        </p>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-150"
        >
          <X size={16} />
        </button>
      </div>

      {/* Profile section */}
      <div className="flex flex-col items-center gap-3 px-6 py-6 border-b border-gray-50">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 ring-4 ring-sky-100">
            <AppImage
              src={conversation.avatar}
              alt={conversation.avatarAlt}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
          {conversation.isOnline && !conversation.isGroup && (
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full" />
          )}
        </div>

        <div className="text-center">
          <p className="text-base font-700 text-gray-900">{conversation.name}</p>
          {conversation.isGroup ? (
            <p className="text-xs text-gray-400 mt-0.5">{conversation.members} members</p>
          ) : (
            <p className={`text-xs mt-0.5 font-500 ${conversation.isOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
              {conversation.isOnline ? 'Online now' : conversation.lastSeen ?? 'Offline'}
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() => toast.info('Voice call starting...')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 bg-sky-50 hover:bg-sky-100 rounded-xl flex items-center justify-center transition-colors duration-150 group-active:scale-95">
              <Phone size={18} className="text-sky-600" />
            </div>
            <span className="text-xs text-gray-400 group-hover:text-gray-600">Call</span>
          </button>
          <button
            onClick={() => toast.info('Video call starting...')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 bg-sky-50 hover:bg-sky-100 rounded-xl flex items-center justify-center transition-colors duration-150 group-active:scale-95">
              <Video size={18} className="text-sky-600" />
            </div>
            <span className="text-xs text-gray-400 group-hover:text-gray-600">Video</span>
          </button>
          <button
            onClick={() => toast.info('Email copied')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 bg-sky-50 hover:bg-sky-100 rounded-xl flex items-center justify-center transition-colors duration-150 group-active:scale-95">
              <Mail size={18} className="text-sky-600" />
            </div>
            <span className="text-xs text-gray-400 group-hover:text-gray-600">Email</span>
          </button>
          {conversation.isGroup && (
            <button
              onClick={() => toast.info('Group members list coming soon')}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-10 h-10 bg-sky-50 hover:bg-sky-100 rounded-xl flex items-center justify-center transition-colors duration-150 group-active:scale-95">
                <Users size={18} className="text-sky-600" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-gray-600">Members</span>
            </button>
          )}
        </div>
      </div>

      {/* About / Bio */}
      {!conversation.isGroup && (
        <div className="px-4 py-4 border-b border-gray-50">
          <p className="text-xs font-600 text-gray-400 uppercase tracking-widest mb-2">About</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Hey there! I am using ChatApp 🙌
          </p>
          <p className="text-xs text-gray-400 mt-1.5">
            Joined March 2024
          </p>
        </div>
      )}

      {/* Group description */}
      {conversation.isGroup && (
        <div className="px-4 py-4 border-b border-gray-50">
          <p className="text-xs font-600 text-gray-400 uppercase tracking-widest mb-2">Description</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Daily standup coordination, sprint planning, and async updates for the core engineering team.
          </p>
          <p className="text-xs text-gray-400 mt-1.5">Created by Arjun Mehta · Jan 2026</p>
        </div>
      )}

      {/* Shared media */}
      <div className="border-b border-gray-50">
        <button
          onClick={() => setShowMedia(!showMedia)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ImageIcon size={15} className="text-gray-400" />
            <p className="text-xs font-600 text-gray-700 uppercase tracking-widest">Shared Media</p>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {sharedMedia.length}
            </span>
          </div>
          {showMedia ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </button>
        {showMedia && (
          <div className="px-4 pb-4 grid grid-cols-3 gap-1.5">
            {isLoadingShared ? (
              <p className="col-span-3 text-xs text-gray-400 py-4 text-center">Loading shared media...</p>
            ) : sharedMedia.length === 0 ? (
              <p className="col-span-3 text-xs text-gray-400 py-4 text-center">No shared media yet</p>
            ) : sharedMedia.map((media) => (
              <button
                key={media.id}
                onClick={() => toast.info('Media viewer coming soon')}
                className="aspect-square rounded-lg overflow-hidden hover:opacity-90 active:scale-95 transition-all duration-150"
              >
                <AppImage
                  src={media.url}
                  alt={media.alt || 'Shared image'}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {(sharedPagination.hasMore || isLoadingMoreShared) && (
              <button
                onClick={handleLoadMoreShared}
                disabled={isLoadingMoreShared}
                className="col-span-3 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100/70 flex items-center justify-center py-2 transition-colors duration-150"
              >
                <span className="text-xs font-600 text-gray-500">
                  {isLoadingMoreShared ? 'Loading more...' : 'Load more media'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Shared files */}
      <div className="border-b border-gray-50">
        <button
          onClick={() => setShowFiles(!showFiles)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-gray-400" />
            <p className="text-xs font-600 text-gray-700 uppercase tracking-widest">Shared Files</p>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {sharedFiles.length}
            </span>
          </div>
          {showFiles ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </button>
        {showFiles && (
          <div className="px-4 pb-4 flex flex-col gap-2">
            {isLoadingShared ? (
              <p className="text-xs text-gray-400 py-4 text-center">Loading shared files...</p>
            ) : sharedFiles.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No shared files yet</p>
            ) : sharedFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => {
                  if (file.url) {
                    window.open(file.url, '_blank', 'noopener,noreferrer');
                  } else {
                    toast.info(`File link for ${file.name} is unavailable`);
                  }
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors duration-150 text-left group"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sky-500 bg-sky-50">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-600 text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{file.size || 'Unknown size'} - {file.date}</p>
                </div>
                <Link2 size={13} className="text-gray-300 group-hover:text-sky-500 transition-colors flex-shrink-0" />
              </button>
            ))}
            {(sharedPagination.hasMore || isLoadingMoreShared) && (
              <button
                onClick={handleLoadMoreShared}
                disabled={isLoadingMoreShared}
                className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100/70 text-xs font-600 text-gray-500 transition-colors"
              >
                {isLoadingMoreShared ? 'Loading more...' : 'Load more files'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Privacy actions */}
      <div className="px-4 py-4 flex flex-col gap-2">
        <p className="text-xs font-600 text-gray-400 uppercase tracking-widest mb-1">Privacy</p>

        <button
          onClick={toggleMute}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors duration-150 text-left group"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isMuted ? 'bg-amber-50' : 'bg-gray-100'
          }`}>
            {isMuted
              ? <BellOff size={15} className="text-amber-500" />
              : <Bell size={15} className="text-gray-500" />
            }
          </div>
          <div>
            <p className="text-sm font-500 text-gray-700">
              {isMuted ? 'Unmute notifications' : 'Mute notifications'}
            </p>
            {isMuted && <p className="text-xs text-amber-500">Currently muted</p>}
          </div>
        </button>

        <button
          onClick={togglePin}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors duration-150 text-left group"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isPinned ? 'bg-sky-50' : 'bg-gray-100'
          }`}>
            <Pin size={15} className={isPinned ? 'text-sky-600' : 'text-gray-500'} />
          </div>
          <div>
            <p className="text-sm font-500 text-gray-700">
              {isPinned ? 'Unpin conversation' : 'Pin conversation'}
            </p>
            {isPinned && <p className="text-xs text-sky-500">Pinned to top</p>}
          </div>
        </button>

        <button
          onClick={() => (conversation.isGroup ? handleLeaveGroup() : toast.warning('Block feature coming soon'))}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors duration-150 text-left group"
        >
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Ban size={15} className="text-red-500" />
          </div>
          <p className="text-sm font-500 text-red-600">
            {conversation.isGroup ? 'Leave group' : `Block ${conversation.name.split(' ')[0]}`}
          </p>
        </button>

        <button
          onClick={handleDeleteConversation}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors duration-150 text-left group"
        >
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Trash2 size={15} className="text-red-500" />
          </div>
          <p className="text-sm font-500 text-red-600">Delete conversation</p>
        </button>
      </div>
    </div>
  );
}