'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import AppLogo from '@/components/ui/AppLogo';
import { Search, Plus, MoreVertical, Users, BellOff, Pin, X, PhoneCall, Phone, Video, Bell } from 'lucide-react';
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
  onStartCall,
  newNotification,
}) {
  const [activeFilter, setActiveFilter] = useState('all'); // all, unread, groups, calls
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [createMode, setCreateMode] = useState('direct');
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
    themeMode: 'system',
    accentColor: 'sky',
    chatAppearance: {
      bubbleStyle: 'rounded',
      density: 'comfortable',
      fontSize: 'default',
    }
  });
  const actionsMenuRef = useRef(null);

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const filtered = conversations.filter((c) => {
    if (activeFilter === 'archived') return c.isArchived;
    if (c.isArchived) return false;
    if (activeFilter === 'unread') return c.unreadCount > 0;
    if (activeFilter === 'groups') return c.isGroup;
    if (activeFilter === 'calls') return false; // Handled separately or we can show conversations with calls
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

  const loadNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadNotificationsCount(data.unreadCount || 0);
      }
    } catch {
      console.error('Failed to load notifications');
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      loadNotifications();
    }
  }, [currentUser?.id, loadNotifications]);

  useEffect(() => {
    if (newNotification) {
      setNotifications(prev => {
        if (prev.some(n => n._id === newNotification._id)) return prev;
        return [newNotification, ...prev];
      });
      setUnreadNotificationsCount(prev => prev + 1);
    }
  }, [newNotification]);

  const markNotificationAsRead = async (id, conversationId) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readAt: new Date() } : n));
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
      if (conversationId) {
        onSelect(conversationId);
        setShowNotifications(false);
      }
    } catch {
      toast.error('Failed to mark read');
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date() })));
      setUnreadNotificationsCount(0);
    } catch {
      toast.error('Failed to mark all read');
    }
  };

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
    setCreateMode('direct');
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

    const isGroup = createMode === 'group';
    if (!isGroup && selectedEmails.length > 1) {
      toast.error('Direct messages support only one participant');
      return;
    }

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
      <div className="px-4 pt-4 pb-3 border-b border-[var(--app-border)]/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AppLogo size={28} />
            <span className="font-display text-lg font-700 text-[var(--app-text)]">ChatApp</span>
            {totalUnread > 0 && (
              <span className="bg-sky-500 text-white text-xs font-700 w-5 h-5 rounded-full flex items-center justify-center tabular-nums">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setShowNotifications(true);
                loadNotifications();
              }}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[var(--app-muted)] hover:bg-[var(--app-border)] hover:text-[var(--app-text)] transition-all duration-150"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--app-muted)] hover:bg-[var(--app-border)] hover:text-[var(--app-text)] transition-all duration-150"
              title="New conversation"
            >
              <Plus size={18} />
            </button>
            <div className="relative" ref={actionsMenuRef}>
              <button
                onClick={() => setShowActionsMenu((prev) => !prev)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--app-muted)] hover:bg-[var(--app-border)] hover:text-[var(--app-text)] transition-all duration-150"
                title="Account menu"
              >
                <MoreVertical size={18} />
              </button>
              {showActionsMenu && (
                <div className="absolute right-0 top-10 w-44 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-lg z-20 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      setProfileDraft({
                        name: currentUser?.name || '',
                        email: currentUser?.email || '',
                        bio: currentUser?.bio || '',
                        status: currentUser?.status || 'available',
                        statusText: currentUser?.statusText || '',
                        avatarUrl: currentUser?.avatarUrl || '',
                      });
                      setShowProfilePanel(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-[var(--app-text)] hover:bg-[var(--app-border)] rounded-lg"
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
                        themeMode: currentUser?.settings?.themeMode || 'system',
                        accentColor: currentUser?.settings?.accentColor || 'sky',
                        chatAppearance: {
                          bubbleStyle: currentUser?.settings?.chatAppearance?.bubbleStyle || 'rounded',
                          density: currentUser?.settings?.chatAppearance?.density || 'comfortable',
                          fontSize: currentUser?.settings?.chatAppearance?.fontSize || 'default',
                          fontFamily: currentUser?.settings?.chatAppearance?.fontFamily || 'sans',
                        }
                      });
                      setShowSettingsPanel(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-[var(--app-text)] hover:bg-[var(--app-border)] rounded-lg"
                  >
                    Settings
                  </button>
                  <div className="h-px bg-[var(--app-bg)] my-1" />
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
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[var(--app-bg)] border border-[var(--app-border)]/60 rounded-full pl-9 pr-4 py-2 text-sm text-[var(--app-text)] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-400 transition-all duration-200"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mt-3">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: 'Unread' },
            { key: 'groups', label: 'Groups' },
            { key: 'calls', label: 'Calls' },
            { key: 'archived', label: 'Archived' },
          ].map((f) => (
            <button
              key={`filter-${f.key}`}
              onClick={() => setActiveFilter(f.key)}
              className={`text-[13px] font-500 px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                activeFilter === f.key
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-[var(--app-bg)] text-[var(--app-muted)] hover:bg-[var(--app-border)] border border-[var(--app-border)]/50'
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
          <p className="text-[11px] font-600 text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Pin size={12} /> Pinned
          </p>
        </div>
      )}

      {/* Conversation items */}
      <div className="flex-1 overflow-y-auto chat-scrollbar relative">
        {activeFilter === 'calls' ? (
          <CallHistoryView
            conversations={conversations}
            onSelect={onSelect}
            onStartCall={onStartCall}
          />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 px-6">
            <div className="w-12 h-12 bg-[var(--app-bg)] rounded-full flex items-center justify-center">
              <Search size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-500 text-[var(--app-muted)] text-center">
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
      <div className="border-t border-[var(--app-border)]/60 p-4 bg-[var(--app-surface)]/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 bg-slate-50/80 border border-[var(--app-border)]/60 rounded-2xl p-2.5 shadow-sm">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-100 to-sky-50 flex items-center justify-center border border-sky-100">
              <span className="text-sm font-600 text-sky-700">
                {(currentUser?.name || 'User')
                  .split(' ')
                  .map((part) => part.charAt(0).toUpperCase())
                  .slice(0, 2)
                  .join('')}
              </span>
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-600 text-[var(--app-text)] truncate">{currentUser?.name || 'Guest User'}</p>
            <p className="text-xs text-[var(--app-muted)] truncate">{currentUser?.email || 'Not signed in'}</p>
          </div>
          <Link
            href="/landingPage"
            className="text-xs text-slate-400 hover:text-sky-600 transition-colors font-500 px-2"
          >
            Home
          </Link>
        </div>
      </div>

      {showCreateModal && (
        <div className="absolute inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-2xl">
            <div className="px-5 py-4 border-b border-[var(--app-border)] flex items-center justify-between">
              <p className="text-base font-700 text-[var(--app-text)]">Start new conversation</p>
              <button
                onClick={resetCreateState}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--app-muted)] hover:bg-[var(--app-border)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs font-600 uppercase tracking-wide text-[var(--app-muted)]">Conversation type</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateMode('direct')}
                    className={`rounded-xl border px-3 py-2 text-sm font-600 transition-colors ${
                      createMode === 'direct'
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-[var(--app-border)] text-[var(--app-muted)] hover:bg-[var(--app-border)]'
                    }`}
                  >
                    Direct
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode('group')}
                    className={`rounded-xl border px-3 py-2 text-sm font-600 transition-colors ${
                      createMode === 'group'
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-[var(--app-border)] text-[var(--app-muted)] hover:bg-[var(--app-border)]'
                    }`}
                  >
                    Group
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-600 uppercase tracking-wide text-[var(--app-muted)]">Search users</label>
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="mt-1 w-full border border-[var(--app-border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                />
              </div>

              {createMode === 'group' && (
                <div>
                  <label className="text-xs font-600 uppercase tracking-wide text-[var(--app-muted)]">Group name</label>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="mt-1 w-full border border-[var(--app-border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  />
                </div>
              )}

              <div className="max-h-64 overflow-y-auto border border-[var(--app-border)] rounded-xl">
                {availableUsers.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-[var(--app-muted)]">No users found</p>
                ) : (
                  availableUsers.map((user) => {
                    const selected = selectedEmails.includes(user.email);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          if (createMode === 'direct') {
                            setSelectedEmails((prev) =>
                              prev.includes(user.email) ? [] : [user.email]
                            );
                            return;
                          }

                          toggleUserSelection(user.email);
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-[var(--app-border)] last:border-b-0 ${
                          selected ? 'bg-sky-50' : 'hover:bg-[var(--app-border)]'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-[var(--app-bg)]">
                          <AppImage
                            src={user.avatarUrl || `https://i.pravatar.cc/48?u=${encodeURIComponent(user.email)}`}
                            alt={`${user.name} avatar`}
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-600 text-[var(--app-text)] truncate">{user.name}</p>
                          <p className="text-xs text-[var(--app-muted)] truncate">{user.email}</p>
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
                  <p className="text-xs font-600 uppercase tracking-wide text-[var(--app-muted)] mb-2">Participants</p>
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

            <div className="px-5 py-4 border-t border-[var(--app-border)] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={resetCreateState}
                className="px-4 py-2 rounded-lg text-sm text-[var(--app-muted)] hover:bg-[var(--app-border)]"
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
          <div className="h-full w-full max-w-sm bg-[var(--app-surface)] border-l border-[var(--app-border)] shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--app-border)] flex items-center justify-between">
              <p className="text-base font-700 text-[var(--app-text)]">Profile</p>
              <button
                type="button"
                onClick={() => setShowProfilePanel(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--app-muted)] hover:bg-[var(--app-border)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <label className="relative cursor-pointer group">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-sky-100 flex items-center justify-center text-sky-700 font-700 border-2 border-transparent group-hover:border-sky-300 transition-colors">
                    {profileDraft.avatarUrl ? (
                      <AppImage src={profileDraft.avatarUrl} alt="Avatar" width={56} height={56} className="w-full h-full object-cover" />
                    ) : (
                      (profileDraft.name || 'U').split(' ').map((part) => part.charAt(0).toUpperCase()).slice(0, 2).join('')
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-white font-medium">Edit</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await fetch('/api/uploads', { method: 'POST', body: formData });
                        if (!res.ok) throw new Error();
                        const data = await res.json();
                        setProfileDraft(prev => ({ ...prev, avatarUrl: data.url }));
                      } catch {
                        toast.error('Avatar upload failed');
                      }
                    }}
                  />
                </label>
                <div>
                  <p className="text-sm font-700 text-[var(--app-text)]">{profileDraft.name || 'Unnamed User'}</p>
                  <p className="text-xs text-[var(--app-muted)]">{profileDraft.email || 'No email'}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-600 uppercase tracking-wide text-[var(--app-muted)]">Display name</label>
                <input
                  value={profileDraft.name}
                  onChange={(e) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border border-[var(--app-border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-xs font-600 uppercase tracking-wide text-[var(--app-muted)]">Status</label>
                <select
                  value={profileDraft.status || 'available'}
                  onChange={(e) => setProfileDraft(prev => ({ ...prev, status: e.target.value }))}
                  className="mt-1 w-full border border-[var(--app-border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 bg-[var(--app-surface)]"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="away">Away</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-600 uppercase tracking-wide text-[var(--app-muted)]">Status Text</label>
                <input
                  value={profileDraft.statusText || ''}
                  onChange={(e) => setProfileDraft(prev => ({ ...prev, statusText: e.target.value }))}
                  maxLength={80}
                  className="mt-1 w-full border border-[var(--app-border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  placeholder="What's on your mind?"
                />
              </div>

              <div>
                <label className="text-xs font-600 uppercase tracking-wide text-[var(--app-muted)]">Email</label>
                <input
                  value={profileDraft.email}
                  onChange={(e) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border border-[var(--app-border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-600 uppercase tracking-wide text-[var(--app-muted)]">Bio</label>
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
                  className="mt-1 w-full border border-[var(--app-border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 resize-none"
                  placeholder="Tell people a bit about yourself"
                />
                <p className="mt-1 text-[11px] text-slate-400 text-right">
                  {(profileDraft.bio || '').length}/160
                </p>
              </div>

              <p className="text-xs text-[var(--app-muted)]">
                Profile updates sync with your account.
              </p>
            </div>

            <div className="mt-auto px-5 py-4 border-t border-[var(--app-border)] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfileDraft({
                    name: currentUser?.name || '',
                    email: currentUser?.email || '',
                    bio: currentUser?.bio || '',
                    status: currentUser?.status || 'available',
                    statusText: currentUser?.statusText || '',
                    avatarUrl: currentUser?.avatarUrl || '',
                  });
                }}
                className="px-4 py-2 rounded-lg text-sm text-[var(--app-muted)] hover:bg-[var(--app-border)]"
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
                        status: profileDraft.status || 'available',
                        statusText: profileDraft.statusText || '',
                        avatarUrl: profileDraft.avatarUrl || '',
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
          <div className="h-full w-full max-w-sm bg-[var(--app-surface)] border-l border-[var(--app-border)] shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--app-border)] flex items-center justify-between">
              <p className="text-base font-700 text-[var(--app-text)]">Settings</p>
              <button
                type="button"
                onClick={() => setShowSettingsPanel(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--app-muted)] hover:bg-[var(--app-border)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--app-border)]">
                <div>
                  <p className="text-sm font-600 text-[var(--app-text)]">Desktop notifications</p>
                  <p className="text-xs text-[var(--app-muted)]">Get notified for incoming messages</p>
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
                  className="w-4 h-4 rounded border-[var(--app-border)] text-sky-500"
                />
              </label>

              <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--app-border)]">
                <div>
                  <p className="text-sm font-600 text-[var(--app-text)]">Enter to send</p>
                  <p className="text-xs text-[var(--app-muted)]">Press Enter to send messages</p>
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
                  className="w-4 h-4 rounded border-[var(--app-border)] text-sky-500"
                />
              </label>

              <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--app-border)]">
                <div>
                  <p className="text-sm font-600 text-[var(--app-text)]">Compact mode</p>
                  <p className="text-xs text-[var(--app-muted)]">Use denser spacing in chat list</p>
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
                  className="w-4 h-4 rounded border-[var(--app-border)] text-sky-500"
                />
              </label>

              <div className="pt-2 border-t border-[var(--app-border)]">
                <p className="text-sm font-600 text-[var(--app-text)] mb-3">Appearance</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--app-muted)] block mb-1">Theme</label>
                    <div className="flex gap-2">
                      {['system', 'light', 'dark'].map(t => (
                        <button
                          key={`theme-${t}`}
                          onClick={() => setSettingsDraft(prev => ({ ...prev, themeMode: t }))}
                          className={`flex-1 py-1.5 text-xs font-500 rounded-lg capitalize border ${settingsDraft.themeMode === t ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-[var(--app-border)] text-[var(--app-muted)] hover:bg-[var(--app-border)]'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--app-muted)] block mb-1">Accent Color</label>
                    <div className="flex gap-2">
                      {['sky', 'emerald', 'rose', 'slate'].map(color => (
                        <button
                          key={`accent-${color}`}
                          onClick={() => setSettingsDraft(prev => ({ ...prev, accentColor: color }))}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform ${settingsDraft.accentColor === color ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                          style={{
                            backgroundColor: color === 'sky' ? '#0ea5e9' : color === 'emerald' ? '#10b981' : color === 'rose' ? '#f43f5e' : '#64748b'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--app-muted)] block mb-1">Bubble Style</label>
                    <select
                      value={settingsDraft.chatAppearance?.bubbleStyle || 'rounded'}
                      onChange={(e) => setSettingsDraft(prev => ({ ...prev, chatAppearance: { ...prev.chatAppearance, bubbleStyle: e.target.value } }))}
                      className="w-full border border-[var(--app-border)] rounded-lg px-2 py-1.5 text-sm bg-[var(--app-surface)]"
                    >
                      <option value="rounded">Rounded</option>
                      <option value="compact">Compact</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-[var(--app-muted)] block mb-1">Density</label>
                      <select
                        value={settingsDraft.chatAppearance?.density || 'comfortable'}
                        onChange={(e) => setSettingsDraft(prev => ({ ...prev, chatAppearance: { ...prev.chatAppearance, density: e.target.value } }))}
                        className="w-full border border-[var(--app-border)] rounded-lg px-2 py-1.5 text-sm bg-[var(--app-surface)]"
                      >
                        <option value="comfortable">Comfortable</option>
                        <option value="compact">Compact</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-[var(--app-muted)] block mb-1">Font Size</label>
                      <select
                        value={settingsDraft.chatAppearance?.fontSize || 'default'}
                        onChange={(e) => setSettingsDraft(prev => ({ ...prev, chatAppearance: { ...prev.chatAppearance, fontSize: e.target.value } }))}
                        className="w-full border border-[var(--app-border)] rounded-lg px-2 py-1.5 text-sm bg-[var(--app-surface)]"
                      >
                        <option value="small">Small</option>
                        <option value="default">Default</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[var(--app-muted)] pt-2">
                Settings are saved to your account.
              </p>
            </div>

            <div className="mt-auto px-5 py-4 border-t border-[var(--app-border)] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSettingsDraft({
                    desktopNotifications: currentUser?.settings?.desktopNotifications ?? true,
                    enterToSend: currentUser?.settings?.enterToSend ?? true,
                    compactMode: currentUser?.settings?.compactMode ?? false,
                  });
                }}
                className="px-4 py-2 rounded-lg text-sm text-[var(--app-muted)] hover:bg-[var(--app-border)]"
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

      {showNotifications && (
        <div className="absolute inset-0 z-50 bg-slate-900/35 backdrop-blur-sm flex items-center justify-end">
          <div className="h-full w-full max-w-sm bg-[var(--app-surface)] border-l border-[var(--app-border)] shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--app-border)] flex items-center justify-between">
              <p className="text-base font-700 text-[var(--app-text)] flex items-center gap-2">
                <Bell size={18} /> Notifications
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="text-xs text-sky-600 font-500 hover:text-sky-700"
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--app-muted)] hover:bg-[var(--app-border)]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-scrollbar">
              {isLoadingNotifications ? (
                <div className="text-center py-4 text-xs text-gray-400">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--app-muted)] flex flex-col items-center gap-2">
                  <BellOff size={24} className="text-gray-300" />
                  No notifications yet
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => markNotificationAsRead(notif._id, notif.conversationId)}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                      notif.readAt ? 'bg-[var(--app-bg)] border-[var(--app-border)] opacity-75' : 'bg-[var(--app-surface)] border-sky-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-sm ${notif.readAt ? 'font-500 text-[var(--app-text)]' : 'font-600 text-[var(--app-text)]'}`}>
                        {notif.title}
                      </p>
                      {!notif.readAt && <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-1.5" />}
                    </div>
                    {notif.body && <p className="text-xs text-[var(--app-muted)] mb-2">{notif.body}</p>}
                    <p className="text-[10px] text-slate-400">{new Date(notif.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
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
      className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 text-left group relative border-b border-[var(--app-border)]/40 last:border-b-0 ${
        isActive ? 'bg-sky-50/50 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-sky-500 before:rounded-r-md' : 'hover:bg-[var(--app-border)]'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-[var(--app-bg)]">
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
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-sm truncate ${c.unreadCount > 0 ? 'font-600 text-[var(--app-text)]' : 'font-500 text-[var(--app-text)]'}`}>
              {c.name}
            </span>
            {c.isMuted && <BellOff size={12} className="text-slate-400 shrink-0" />}
            {c.isPinned && <Pin size={12} className="text-sky-500 shrink-0" />}
          </div>
          <span className={`text-[11px] shrink-0 font-500 ${c.unreadCount > 0 ? 'text-sky-600 font-600' : 'text-slate-400'}`}>
            {c.lastMessageTime}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[13px] truncate leading-tight ${c.unreadCount > 0 ? 'text-[var(--app-text)] font-500' : 'text-[var(--app-muted)]'}`}>
            {c.lastMessage}
          </p>
          {c.unreadCount > 0 && (
            <span className="shrink-0 w-5 h-5 bg-sky-500 text-white text-xs font-600 rounded-full flex items-center justify-center tabular-nums shadow-sm shadow-sky-200">
              {c.unreadCount > 9 ? '9+' : c.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function CallHistoryView({ conversations, onSelect, onStartCall }) {
  const [calls, setCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load all conversations' call logs. Since we don't have a global call list endpoint,
    // we'll fetch from conversations the user is in. For a robust app, you'd add a /api/calls endpoint.
    const fetchCalls = async () => {
      try {
        const fetchedCalls = [];
        for (const conv of conversations) {
          const res = await fetch(`/api/conversations/${conv.id}/calls`);
          if (res.ok) {
            const data = await res.json();
            if (data.calls) {
              const mappedCalls = data.calls.map(c => ({ 
                ...c, 
                conversationId: conv.id, 
                convName: conv.name, 
                convAvatar: conv.avatar 
              }));
              fetchedCalls.push(...mappedCalls);
            }
          }
        }
        
        fetchedCalls.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        setCalls(fetchedCalls);
      } catch (err) {
        console.error('Failed to load call history', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (conversations.length > 0) {
      fetchCalls();
    } else {
      setIsLoading(false);
    }
  }, [conversations]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <div className="w-6 h-6 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-sm text-[var(--app-muted)]">Loading call history...</p>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 px-6">
        <div className="w-12 h-12 bg-[var(--app-bg)] rounded-full flex items-center justify-center">
          <PhoneCall size={20} className="text-gray-400" />
        </div>
        <p className="text-sm font-500 text-[var(--app-muted)] text-center">
          No calls made yet
        </p>
        <p className="text-xs text-gray-400 text-center mt-1">
          Calls you make or receive will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {calls.map((call) => {
        const isMissed = call.status === 'missed';
        const isCancelled = call.status === 'cancelled';
        const isIncoming = !call.isOutgoing;
        const callIconClass = isMissed ? 'text-red-500' : (isIncoming ? 'text-blue-500' : 'text-emerald-500');

        return (
          <div key={call.id} className="w-full flex justify-between px-4 py-3 hover:bg-[var(--app-border)] border-b border-gray-50 last:border-b-0 cursor-pointer group" onClick={() => onSelect(call.conversationId)}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[var(--app-bg)] border border-[var(--app-border)]">
                  <AppImage src={call.convAvatar || `https://i.pravatar.cc/48?u=${encodeURIComponent(call.convName || call.conversationId)}`} alt={call.convName} width={44} height={44} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-sm font-semibold truncate ${isMissed ? 'text-red-500' : 'text-[var(--app-text)]'}`}>
                  {call.convName}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-[var(--app-muted)]">
                  {call.type === 'video' ? (
                    <Video size={12} className={callIconClass} />
                  ) : (
                    <PhoneCall size={12} className={callIconClass} />
                  )}
                  <span>{call.isOutgoing ? 'Outgoing' : 'Incoming'} {isMissed ? 'Missed' : isCancelled ? 'Cancelled' : ''}</span>
                  <span>•</span>
                  <span>{call.durationLabel || '0:00'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[11px] text-gray-400 font-medium">
                {new Date(call.startedAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  className="p-1.5 bg-[var(--app-bg)] hover:bg-sky-100 hover:text-sky-600 rounded-full text-[var(--app-muted)] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if(onStartCall) onStartCall(call.conversationId, 'audio');
                  }}
                  title="Audio call"
                >
                  <Phone size={14} />
                </button>
                <button 
                  className="p-1.5 bg-[var(--app-bg)] hover:bg-sky-100 hover:text-sky-600 rounded-full text-[var(--app-muted)] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if(onStartCall) onStartCall(call.conversationId, 'video');
                  }}
                  title="Video call"
                >
                  <Video size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}