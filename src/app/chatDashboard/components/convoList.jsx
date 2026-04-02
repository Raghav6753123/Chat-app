'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import AppLogo from '@/components/ui/AppLogo';
import { Search, Plus, MoreVertical, Users, BellOff, Pin, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onCreateConversation,
  onLogout,
  onCurrentUserUpdated,
  searchQuery,
  onSearchChange,
  currentUser,
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ name: '', email: '', bio: '' });
  const [settingsDraft, setSettingsDraft] = useState({
    desktopNotifications: true,
    enterToSend: true,
    compactMode: false,
  });
  const actionsMenuRef = useRef(null);

  const filtered = conversations.filter((c) => {
    if (activeFilter === 'unread') return c.unreadCount > 0;
    if (activeFilter === 'groups') return c.isGroup;
    return true;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  useEffect(() => {
    if (!showCreateModal) {
      return;
    }

    let canceled = false;

    const loadUsers = async () => {
      try {
        const response = await fetch(`/api/users?query=${encodeURIComponent(userSearch)}`);
        const payload = await response.json();
        if (!canceled && response.ok) {
          setAvailableUsers(payload.users || []);
        }
      } catch {
        if (!canceled) {
          setAvailableUsers([]);
        }
      }
    };

    loadUsers();

    return () => {
      canceled = true;
    };
  }, [showCreateModal, userSearch]);

  useEffect(() => {
    if (!showActionsMenu) {
      return;
    }

    const handleClickOutside = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setShowActionsMenu(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsMenu]);

  const selectedUsers = useMemo(
    () => availableUsers.filter((user) => selectedEmails.includes(user.email)),
    [availableUsers, selectedEmails]
  );

  const toggleUserSelection = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((item) => item !== email) : [...prev, email]
    );
  };

  const resetCreateState = () => {
    setShowCreateModal(false);
    setUserSearch('');
    setAvailableUsers([]);
    setSelectedEmails([]);
    setGroupName('');
    setIsCreating(false);
  };

  const submitCreateConversation = async () => {
    if (!selectedEmails.length) {
      toast.error('Choose at least one participant');
      return;
    }

    const isGroup = selectedEmails.length > 1;
    if (isGroup && !groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    setIsCreating(true);

    const result = await onCreateConversation({
      memberEmails: selectedEmails,
      isGroup,
      name: groupName.trim(),
    });

    setIsCreating(false);

    if (result?.ok) {
      resetCreateState();
    }
  };

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
              onClick={() => setShowCreateModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-150"
              title="New conversation"
            >
              <Plus size={18} />
            </button>
            <div className="relative" ref={actionsMenuRef}>
              <button
                onClick={() => setShowActionsMenu((prev) => !prev)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-150"
                title="Account menu"
              >
                <MoreVertical size={18} />
              </button>
              {showActionsMenu && (
                <div className="absolute right-0 top-10 w-44 rounded-xl border border-slate-100 bg-white shadow-lg z-20 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      setProfileDraft({
                        name: currentUser?.name || '',
                        email: currentUser?.email || '',
                        bio: currentUser?.bio || '',
                      });
                      setShowProfilePanel(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      setSettingsDraft({
                        desktopNotifications: currentUser?.settings?.desktopNotifications ?? true,
                        enterToSend: currentUser?.settings?.enterToSend ?? true,
                        compactMode: currentUser?.settings?.compactMode ?? false,
                      });
                      setShowSettingsPanel(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Settings
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
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
            <span className="text-sm font-700 text-sky-600">
              {(currentUser?.name || 'User')
                .split(' ')
                .map((part) => part.charAt(0).toUpperCase())
                .slice(0, 2)
                .join('')}
            </span>
          </div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-600 text-gray-900 truncate">{currentUser?.name || 'Guest User'}</p>
          <p className="text-xs text-gray-400">{currentUser?.email || 'Not signed in'}</p>
        </div>
        <Link
          href="/landingPage"
          className="text-xs text-gray-400 hover:text-sky-600 transition-colors font-500"
        >
          Home
        </Link>
      </div>

      {showCreateModal && (
        <div className="absolute inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-base font-700 text-slate-900">Start new conversation</p>
              <button
                onClick={resetCreateState}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs font-600 uppercase tracking-wide text-slate-500">Search users</label>
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                />
              </div>

              {selectedEmails.length > 1 && (
                <div>
                  <label className="text-xs font-600 uppercase tracking-wide text-slate-500">Group name</label>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  />
                </div>
              )}

              <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-xl">
                {availableUsers.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">No users found</p>
                ) : (
                  availableUsers.map((user) => {
                    const selected = selectedEmails.includes(user.email);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleUserSelection(user.email)}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-slate-100 last:border-b-0 ${
                          selected ? 'bg-sky-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100">
                          <AppImage
                            src={user.avatarUrl || `https://i.pravatar.cc/48?u=${encodeURIComponent(user.email)}`}
                            alt={`${user.name} avatar`}
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-600 text-slate-900 truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <span className={`text-xs font-600 ${selected ? 'text-sky-600' : 'text-slate-400'}`}>
                          {selected ? 'Selected' : 'Select'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {selectedUsers.length > 0 && (
                <div>
                  <p className="text-xs font-600 uppercase tracking-wide text-slate-500 mb-2">Participants</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <span key={user.id} className="text-xs px-2.5 py-1 rounded-full bg-sky-100 text-sky-700">
                        {user.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={resetCreateState}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCreateConversation}
                disabled={isCreating}
                className="px-4 py-2 rounded-lg text-sm bg-sky-500 text-white hover:bg-sky-600 disabled:bg-sky-300"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfilePanel && (
        <div className="absolute inset-0 z-50 bg-slate-900/35 backdrop-blur-sm flex items-center justify-end">
          <div className="h-full w-full max-w-sm bg-white border-l border-slate-100 shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-base font-700 text-slate-900">Profile</p>
              <button
                type="button"
                onClick={() => setShowProfilePanel(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-700">
                  {(profileDraft.name || 'U')
                    .split(' ')
                    .map((part) => part.charAt(0).toUpperCase())
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <p className="text-sm font-700 text-slate-900">{profileDraft.name || 'Unnamed User'}</p>
                  <p className="text-xs text-slate-500">{profileDraft.email || 'No email'}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-600 uppercase tracking-wide text-slate-500">Display name</label>
                <input
                  value={profileDraft.name}
                  onChange={(e) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-xs font-600 uppercase tracking-wide text-slate-500">Email</label>
                <input
                  value={profileDraft.email}
                  onChange={(e) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-600 uppercase tracking-wide text-slate-500">Bio</label>
                <textarea
                  value={profileDraft.bio || ''}
                  onChange={(e) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  rows={3}
                  maxLength={160}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 resize-none"
                  placeholder="Tell people a bit about yourself"
                />
                <p className="mt-1 text-[11px] text-slate-400 text-right">
                  {(profileDraft.bio || '').length}/160
                </p>
              </div>

              <p className="text-xs text-slate-500">
                Profile updates sync with your account.
              </p>
            </div>

            <div className="mt-auto px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfileDraft({
                    name: currentUser?.name || '',
                    email: currentUser?.email || '',
                    bio: currentUser?.bio || '',
                  });
                }}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth/me', {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        name: profileDraft.name,
                        email: profileDraft.email,
                        bio: profileDraft.bio || '',
                      }),
                    });

                    const payload = await response.json();

                    if (!response.ok) {
                      toast.error(payload.error || 'Failed to save profile');
                      return;
                    }

                    onCurrentUserUpdated?.(payload.user);
                    toast.success('Profile updated');
                    setShowProfilePanel(false);
                  } catch {
                    toast.error('Unable to save profile right now');
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm bg-sky-500 text-white hover:bg-sky-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsPanel && (
        <div className="absolute inset-0 z-50 bg-slate-900/35 backdrop-blur-sm flex items-center justify-end">
          <div className="h-full w-full max-w-sm bg-white border-l border-slate-100 shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-base font-700 text-slate-900">Settings</p>
              <button
                type="button"
                onClick={() => setShowSettingsPanel(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-600 text-slate-800">Desktop notifications</p>
                  <p className="text-xs text-slate-500">Get notified for incoming messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={settingsDraft.desktopNotifications}
                  onChange={(e) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      desktopNotifications: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border-slate-300 text-sky-500"
                />
              </label>

              <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-600 text-slate-800">Enter to send</p>
                  <p className="text-xs text-slate-500">Press Enter to send messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={settingsDraft.enterToSend}
                  onChange={(e) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      enterToSend: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border-slate-300 text-sky-500"
                />
              </label>

              <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-600 text-slate-800">Compact mode</p>
                  <p className="text-xs text-slate-500">Use denser spacing in chat list</p>
                </div>
                <input
                  type="checkbox"
                  checked={settingsDraft.compactMode}
                  onChange={(e) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      compactMode: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border-slate-300 text-sky-500"
                />
              </label>

              <p className="text-xs text-slate-500">
                Settings are saved to your account.
              </p>
            </div>

            <div className="mt-auto px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSettingsDraft({
                    desktopNotifications: currentUser?.settings?.desktopNotifications ?? true,
                    enterToSend: currentUser?.settings?.enterToSend ?? true,
                    compactMode: currentUser?.settings?.compactMode ?? false,
                  });
                }}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth/me', {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        settings: settingsDraft,
                      }),
                    });

                    const payload = await response.json();

                    if (!response.ok) {
                      toast.error(payload.error || 'Failed to save settings');
                      return;
                    }

                    onCurrentUserUpdated?.(payload.user);
                    toast.success('Settings updated');
                    setShowSettingsPanel(false);
                  } catch {
                    toast.error('Unable to save settings right now');
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm bg-sky-500 text-white hover:bg-sky-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
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