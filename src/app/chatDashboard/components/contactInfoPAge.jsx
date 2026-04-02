'use client';
import { useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import {
  X, Bell, BellOff, Ban, Trash2, ChevronDown, ChevronUp,
  Phone, Video, Mail, Users, Image as ImageIcon, FileText, Link2
} from 'lucide-react';
import { toast } from 'sonner';

const SHARED_MEDIA = [
  { id: 'media-1', src: 'https://picsum.photos/80/80?random=1', alt: 'Shared photo of landscape' },
  { id: 'media-2', src: 'https://picsum.photos/80/80?random=2', alt: 'Shared photo of architecture' },
  { id: 'media-3', src: 'https://picsum.photos/80/80?random=3', alt: 'Shared photo of nature' },
  { id: 'media-4', src: 'https://picsum.photos/80/80?random=4', alt: 'Shared photo of city' },
  { id: 'media-5', src: 'https://picsum.photos/80/80?random=5', alt: 'Shared photo of interior' },
  { id: 'media-6', src: 'https://picsum.photos/80/80?random=6', alt: 'Shared photo of people' },
];

const SHARED_FILES = [
  { id: 'file-1', name: 'Dashboard_v3.fig', size: '4.2 MB', date: 'Today', icon: FileText, color: 'text-sky-500 bg-sky-50' },
  { id: 'file-2', name: 'Q2_Roadmap.pdf', size: '1.8 MB', date: 'Yesterday', icon: FileText, color: 'text-red-500 bg-red-50' },
  { id: 'file-3', name: 'Meeting_Notes.docx', size: '0.4 MB', date: 'Mon', icon: FileText, color: 'text-blue-500 bg-blue-50' },
];

export default function ContactInfoPanel({ conversation, onClose }) {
  const [showMedia, setShowMedia] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [isMuted, setIsMuted] = useState(conversation.isMuted);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    toast.success(isMuted ? 'Notifications enabled' : 'Notifications muted');
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
              {SHARED_MEDIA.length}
            </span>
          </div>
          {showMedia ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </button>
        {showMedia && (
          <div className="px-4 pb-4 grid grid-cols-3 gap-1.5">
            {SHARED_MEDIA.map((media) => (
              <button
                key={media.id}
                onClick={() => toast.info('Media viewer coming soon')}
                className="aspect-square rounded-lg overflow-hidden hover:opacity-90 active:scale-95 transition-all duration-150"
              >
                <AppImage
                  src={media.src}
                  alt={media.alt}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            <button
              onClick={() => toast.info('View all media coming soon')}
              className="aspect-square rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-150"
            >
              <span className="text-xs font-600 text-gray-500">View all</span>
            </button>
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
              {SHARED_FILES.length}
            </span>
          </div>
          {showFiles ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </button>
        {showFiles && (
          <div className="px-4 pb-4 flex flex-col gap-2">
            {SHARED_FILES.map((file) => (
              <button
                key={file.id}
                onClick={() => toast.info(`Downloading ${file.name}...`)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors duration-150 text-left group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${file.color}`}>
                  <file.icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-600 text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{file.size} · {file.date}</p>
                </div>
                <Link2 size={13} className="text-gray-300 group-hover:text-sky-500 transition-colors flex-shrink-0" />
              </button>
            ))}
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
          onClick={() => toast.warning('Block feature coming soon')}
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
          onClick={() => toast.warning('This will permanently delete the conversation')}
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