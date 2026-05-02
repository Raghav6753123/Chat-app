'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import {
  X,
  Bell,
  BellOff,
  Ban,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pin,
  Phone,
  Video,
  Mail,
  Users,
  Image as ImageIcon,
  FileText,
  Link2,
  UserPlus,
  UserMinus,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

const SHARED_PAGE_SIZE = 24;

export default function ContactInfoPanel({
  conversation,
  currentUserId,
  onClose,
  onPreferencesUpdated,
  onConversationUpdated,
  onConversationRemoved,
  onStartCall,
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

  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberEmailsInput, setMemberEmailsInput] = useState('');
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState(conversation.name || '');
  const [isSavingGroupName, setIsSavingGroupName] = useState(false);

  const canManageGroup = Boolean(conversation.isGroup && conversation.canManageGroup);

  const sortedMembers = useMemo(() => {
    if (!members.length) {
      return [];
    }

    const roleWeight = {
      owner: 0,
      admin: 1,
      member: 2,
    };

    return [...members].sort((a, b) => {
      const roleA = roleWeight[a.role] ?? 2;
      const roleB = roleWeight[b.role] ?? 2;
      if (roleA !== roleB) {
        return roleA - roleB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [members]);

  useEffect(() => {
    setIsMuted(conversation.isMuted);
    setIsPinned(conversation.isPinned);
    setGroupNameDraft(conversation.name || '');
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

  const loadMembers = useCallback(async () => {
    if (!conversation.isGroup) {
      setMembers([]);
      return;
    }

    setIsLoadingMembers(true);

    try {
      const response = await fetch(`/api/conversations/${conversation.id}/members`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load group members');
      }

      setMembers(payload.members || []);
      const nextCount = (payload.members || []).length;
      if (nextCount !== Number(conversation.members || 0)) {
        onConversationUpdated?.(conversation.id, {
          members: nextCount,
        });
      }
    } catch (error) {
      setMembers([]);
      toast.error(error.message || 'Failed to load group members');
    } finally {
      setIsLoadingMembers(false);
    }
  }, [conversation.id, conversation.isGroup, conversation.members, onConversationUpdated]);

  useEffect(() => {
    loadShared({ skip: 0, append: false });
  }, [loadShared]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

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

  const handleSaveGroupName = async () => {
    const nextName = groupNameDraft.trim();
    if (!nextName) {
      toast.error('Group name is required');
      return;
    }

    if (nextName === conversation.name) {
      return;
    }

    setIsSavingGroupName(true);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: nextName }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update group name');
      }

      onConversationUpdated?.(conversation.id, {
        name: payload.conversation?.name || nextName,
      });
      toast.success('Group name updated');
    } catch (error) {
      toast.error(error.message || 'Unable to update group name');
    } finally {
      setIsSavingGroupName(false);
    }
  };

  const handleAddMembers = async () => {
    if (!canManageGroup) {
      toast.error('You do not have permission to add members');
      return;
    }

    const emails = memberEmailsInput
      .split(/[\n,]/)
      .map((email) => email.toLowerCase().trim())
      .filter(Boolean);

    if (!emails.length) {
      toast.error('Enter at least one email');
      return;
    }

    setIsAddingMembers(true);

    try {
      const response = await fetch(`/api/conversations/${conversation.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberEmails: emails }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to add members');
      }

      const addedCount = payload.added || 0;
      if (!addedCount) {
        toast.info('All selected users are already in the group');
      } else {
        toast.success(`${addedCount} member${addedCount > 1 ? 's' : ''} added`);
      }

      setMemberEmailsInput('');
      await loadMembers();
    } catch (error) {
      toast.error(error.message || 'Unable to add members');
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleRemoveMember = async (member) => {
    const canRemoveThisMember = member.userId === currentUserId || canManageGroup;
    if (!canRemoveThisMember) {
      toast.error('You do not have permission to remove this member');
      return;
    }

    try {
      const response = await fetch(
        `/api/conversations/${conversation.id}/members?userId=${encodeURIComponent(member.userId)}`,
        {
          method: 'DELETE',
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to remove member');
      }

      if (member.userId === currentUserId) {
        onConversationRemoved?.(conversation.id);
        onClose();
        toast.success('You left the group');
        return;
      }

      toast.success(`${member.name} removed from group`);
      await loadMembers();
    } catch (error) {
      toast.error(error.message || 'Unable to remove member');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto chat-scrollbar">
      <div className="px-5 py-4 border-b border-slate-100/60 flex items-center justify-between shrink-0">
        <p className="text-[15px] font-600 text-slate-800">
          {conversation.isGroup ? 'Group info' : 'Contact info'}
        </p>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-150"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 px-6 py-8 border-b border-slate-100/60 bg-slate-50/30">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 ring-4 ring-white shadow-md shadow-slate-200/50">
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

        <div className="text-center w-full">
          {conversation.isGroup && canManageGroup ? (
            <div className="flex items-center gap-2">
              <input
                value={groupNameDraft}
                onChange={(e) => setGroupNameDraft(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                placeholder="Group name"
              />
              <button
                type="button"
                onClick={handleSaveGroupName}
                disabled={isSavingGroupName}
                className="px-3 py-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 disabled:bg-sky-300"
                title="Save group name"
              >
                <Save size={14} />
              </button>
            </div>
          ) : (
            <p className="text-base font-700 text-gray-900">{conversation.name}</p>
          )}

          {conversation.isGroup ? (
            <p className="text-xs text-gray-400 mt-1">{conversation.members} members</p>
          ) : (
            <p className={`text-xs mt-0.5 font-500 ${conversation.isOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
              {conversation.isOnline ? 'Online now' : conversation.lastSeen ?? 'Offline'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 w-full justify-center">
          <button
            onClick={() => onStartCall?.(conversation.id, 'voice')}
            className="flex flex-col items-center gap-1.5 group flex-1"
          >
            <div className="w-12 h-12 bg-white border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 rounded-2xl flex items-center justify-center transition-all duration-200 group-active:scale-95 shadow-sm">
              <Phone size={18} className="text-slate-600 group-hover:text-sky-600 transition-colors" />
            </div>
            <span className="text-[11px] font-500 text-slate-500">Call</span>
          </button>
          <button
            onClick={() => onStartCall?.(conversation.id, 'video')}
            className="flex flex-col items-center gap-1.5 group flex-1"
          >
            <div className="w-12 h-12 bg-white border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 rounded-2xl flex items-center justify-center transition-all duration-200 group-active:scale-95 shadow-sm">
              <Video size={18} className="text-slate-600 group-hover:text-sky-600 transition-colors" />
            </div>
            <span className="text-[11px] font-500 text-slate-500">Video</span>
          </button>
          <button
            onClick={() => toast.info('Email copied')}
            className="flex flex-col items-center gap-1.5 group flex-1"
          >
            <div className="w-12 h-12 bg-white border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 rounded-2xl flex items-center justify-center transition-all duration-200 group-active:scale-95 shadow-sm">
              <Mail size={18} className="text-slate-600 group-hover:text-sky-600 transition-colors" />
            </div>
            <span className="text-[11px] font-500 text-slate-500">Email</span>
          </button>
          {conversation.isGroup && (
            <button
              onClick={loadMembers}
              className="flex flex-col items-center gap-1.5 group flex-1"
            >
              <div className="w-12 h-12 bg-white border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 rounded-2xl flex items-center justify-center transition-all duration-200 group-active:scale-95 shadow-sm">
                <Users size={18} className="text-slate-600 group-hover:text-sky-600 transition-colors" />
              </div>
              <span className="text-[11px] font-500 text-slate-500">Members</span>
            </button>
          )}
        </div>
      </div>

      {conversation.isGroup && (
        <div className="px-4 py-4 border-b border-gray-50 space-y-3">
          <p className="text-xs font-600 text-gray-400 uppercase tracking-widest">Members</p>

          {canManageGroup && (
            <div className="space-y-2">
              <textarea
                rows={2}
                value={memberEmailsInput}
                onChange={(e) => setMemberEmailsInput(e.target.value)}
                placeholder="Add by email, comma or new line separated"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 resize-none"
              />
              <button
                type="button"
                onClick={handleAddMembers}
                disabled={isAddingMembers}
                className="w-full rounded-xl bg-sky-500 text-white px-3 py-2 text-sm font-600 hover:bg-sky-600 disabled:bg-sky-300 flex items-center justify-center gap-2"
              >
                <UserPlus size={14} />
                {isAddingMembers ? 'Adding...' : 'Add members'}
              </button>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100">
            {isLoadingMembers ? (
              <p className="px-3 py-6 text-center text-xs text-gray-400">Loading members...</p>
            ) : sortedMembers.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-gray-400">No members found</p>
            ) : (
              sortedMembers.map((member) => {
                const canRemove = member.userId === currentUserId || canManageGroup;
                return (
                  <div
                    key={member.id}
                    className="px-3 py-2.5 border-b border-slate-100 last:border-b-0 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100">
                      <AppImage
                        src={member.avatarUrl || `https://i.pravatar.cc/48?u=${encodeURIComponent(member.email)}`}
                        alt={`${member.name} avatar`}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-600 text-slate-800 truncate">{member.name}</p>
                      <p className="text-xs text-slate-500 truncate">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                        {member.role || 'member'}
                      </span>
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                          title={member.userId === currentUserId ? 'Leave group' : 'Remove member'}
                        >
                          <UserMinus size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {!conversation.isGroup && (
        <div className="px-4 py-4 border-b border-gray-50">
          <p className="text-xs font-600 text-gray-400 uppercase tracking-widest mb-2">About</p>
          <p className="text-sm text-gray-600 leading-relaxed">Hey there! I am using ChatApp.</p>
          <p className="text-xs text-gray-400 mt-1.5">Joined March 2024</p>
        </div>
      )}

      <div className="border-b border-slate-100/60">
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

      <div className="border-b border-slate-100/60">
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
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sky-500 bg-sky-50">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-600 text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{file.size || 'Unknown size'} - {file.date}</p>
                </div>
                <Link2 size={13} className="text-gray-300 group-hover:text-sky-500 transition-colors shrink-0" />
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

      <div className="px-4 py-4 flex flex-col gap-2">
        <p className="text-xs font-600 text-gray-400 uppercase tracking-widest mb-1">Privacy</p>

        <button
          onClick={toggleMute}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors duration-150 text-left group"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
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
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
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
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
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
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
            <Trash2 size={15} className="text-red-500" />
          </div>
          <p className="text-sm font-500 text-red-600">Delete conversation</p>
        </button>
      </div>
    </div>
  );
}
