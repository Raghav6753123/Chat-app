'use client';
import { useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import AppLogo from '@/components/ui/AppLogo';
import { Search, Plus, MoreVertical, Users, BellOff, Pin } from 'lucide-react';
import Link from 'next/link';

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  searchQuery,
  onSearchChange,
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = conversations.filter((c) => {
    if (activeFilter === 'unread') return c.unreadCount > 0;
    if (activeFilter === 'groups') return c.isGroup;
    return true;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AppLogo size={28} />
            <span className="font-display text-lg font-700 text-gray-900">ChatApp</span>
            {totalUnread > 0 && (
              <span className="bg-sky-500 text-white text-xs font-700 w-5 h-5 rounded-full flex items-center justify-center tabular-nums">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-150"
              title="New conversation"
            >
              <Plus size={18} />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-150"
              title="More options"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-gray-100 border-0 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:bg-white transition-all duration-150"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mt-3">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: 'Unread' },
            { key: 'groups', label: 'Groups' },
          ].map((f) => (
            <button
              key={`filter-${f.key}`}
              onClick={() => setActiveFilter(f.key)}
              className={`text-xs font-600 px-3 py-1.5 rounded-full transition-all duration-150 ${
                activeFilter === f.key
                  ? 'bg-sky-500 text-white' :'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned section */}
      {activeFilter === 'all' && filtered.some((c) => c.isPinned) && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-600 text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Pin size={11} /> Pinned
          </p>
        </div>
      )}

      {/* Conversation items */}
      <div className="flex-1 overflow-y-auto chat-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 px-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Search size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-500 text-gray-500 text-center">
              No conversations match your search
            </p>
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>

      {/* Bottom user profile */}
      <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center">
            <span className="text-sm font-700 text-sky-600">AM</span>
          </div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-600 text-gray-900 truncate">Alex Morgan</p>
          <p className="text-xs text-gray-400">Active now</p>
        </div>
        <Link
          href="/landingPage"
          className="text-xs text-gray-400 hover:text-sky-600 transition-colors font-500"
        >
          Home
        </Link>
      </div>
    </div>
  );
}

function ConversationItem({
  conversation: c,
  isActive,
  onSelect,
}) {
  return (
    <button
      onClick={() => onSelect(c.id)}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left group relative ${
        isActive ? 'bg-sky-50' : 'hover:bg-gray-50'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100">
          <AppImage
            src={c.avatar}
            alt={c.avatarAlt}
            width={44}
            height={44}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Online dot */}
        {c.isOnline && !c.isGroup && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
        )}
        {/* Group icon */}
        {c.isGroup && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-sky-500 border-2 border-white rounded-full flex items-center justify-center">
            <Users size={8} className="text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-sm truncate ${c.unreadCount > 0 ? 'font-700 text-gray-900' : 'font-500 text-gray-800'}`}>
              {c.name}
            </span>
            {c.isMuted && <BellOff size={11} className="text-gray-400 flex-shrink-0" />}
            {c.isPinned && <Pin size={11} className="text-sky-400 flex-shrink-0" />}
          </div>
          <span className={`text-xs flex-shrink-0 ${c.unreadCount > 0 ? 'text-sky-600 font-600' : 'text-gray-400'}`}>
            {c.lastMessageTime}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs truncate ${c.unreadCount > 0 ? 'text-gray-700 font-500' : 'text-gray-400'}`}>
            {c.lastMessage}
          </p>
          {c.unreadCount > 0 && (
            <span className="flex-shrink-0 w-5 h-5 bg-sky-500 text-white text-xs font-700 rounded-full flex items-center justify-center tabular-nums">
              {c.unreadCount > 9 ? '9+' : c.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}