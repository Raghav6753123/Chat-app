"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import ImageViewer from '@/components/ui/ImageViewer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  Info,
  Paperclip,
  Smile,
  Mic,
  Send,
  Check,
  CheckCheck,
  Image as ImageIcon,
  FileText,
  Download,
  ExternalLink,
  Copy,
  Trash2,
  ChevronDown,
  X,
  Pencil,
  Reply,
  ArrowLeft,
  Phone,
  Video,
  Bot,
  RefreshCw,
  CalendarClock,
  Clock,
  Search,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const TEXT_EMOJI_LIST = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '😢', '🙏'];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export default function ChatWindow({
  conversation,
  currentUserId,
  activeTypingUsers = [],
  onToggleInfo,
  onTypingStatusChange,
  onMessageSent,
  onMessageDeleted,
  onMessageEdited,
  onMessageReaction,
  onConversationUnavailable,
  onBack,
  showInfo,
  onStartCall,
}) {
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [analyzeTone, setAnalyzeTone] = useState('friendly');
  const [analyzeError, setAnalyzeError] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  
  // Scheduled manager
  const [showScheduledManager, setShowScheduledManager] = useState(false);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);
  const [editingScheduledMessage, setEditingScheduledMessage] = useState(null);

  // Search inside chat
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const messageRefs = useRef(new Map());

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const handleAnalyze = async (tone = analyzeTone) => {
    setIsAnalyzing(true);
    setAnalyzeError('');
    setShowAnalyzer(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'analyze', tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze');
      setAnalyzeResult(data);
    } catch (err) {
      setAnalyzeError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const messages = useMemo(() => conversation.messages || [], [conversation.messages]);

  const loadScheduledMessages = useCallback(async () => {
    setIsLoadingScheduled(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/scheduled`);
      if (res.ok) {
        const data = await res.json();
        setScheduledMessages(data.messages || []);
      }
    } catch {
      toast.error('Unable to load scheduled messages.');
    } finally {
      setIsLoadingScheduled(false);
    }
  }, [conversation.id]);

  useEffect(() => {
    if (showScheduledManager) {
      loadScheduledMessages();
    }
  }, [showScheduledManager, loadScheduledMessages]);

  const updateScheduledMessage = async (msgId, text, date) => {
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/scheduled/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, scheduledFor: date.toISOString() }),
      });
      if (!res.ok) throw new Error('Failed');
      setEditingScheduledMessage(null);
      loadScheduledMessages();
      toast.success('Scheduled message updated');
    } catch {
      toast.error('Failed to update scheduled message');
    }
  };

  const cancelScheduledMessage = async (msgId) => {
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/scheduled/${msgId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed');
      loadScheduledMessages();
      toast.success('Scheduled message cancelled');
    } catch {
      toast.error('Failed to cancel scheduled message');
    }
  };

  const sendScheduledNow = async (msgId) => {
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/scheduled/${msgId}/send-now`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      loadScheduledMessages();
      onMessageSent?.(conversation.id, data.message);
      toast.success('Message sent instantly');
    } catch {
      toast.error('Failed to send message instantly');
    }
  };

  const getSearchableMessageText = (message) => {
    return [
      message.text,
      message.fileName,
      message.callType,
      message.callStatus,
      message.duration,
    ].filter(Boolean).join(' ');
  };

  const searchResults = useMemo(() => {
    if (!chatSearchQuery.trim()) return [];
    const q = chatSearchQuery.toLowerCase();
    return messages.filter(m => getSearchableMessageText(m).toLowerCase().includes(q)).map(m => m.id);
  }, [messages, chatSearchQuery]);

  useEffect(() => {
    if (searchResults.length > 0 && isChatSearchOpen) {
      const targetId = searchResults[activeSearchIndex];
      const el = messageRefs.current.get(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSearchIndex, searchResults, isChatSearchOpen]);
  
  const handleNextSearch = () => {
    setActiveSearchIndex(prev => (prev + 1) % searchResults.length);
  };

  const handlePrevSearch = () => {
    setActiveSearchIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const emitTyping = useCallback(async (isTyping) => {
    if (!conversation?.id || !onTypingStatusChange) {
      return;
    }

    if (isTypingRef.current === isTyping) {
      return;
    }

    isTypingRef.current = isTyping;
    await onTypingStatusChange(conversation.id, isTyping);
  }, [conversation?.id, onTypingStatusChange]);

  const scheduleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 1400);
  }, [emitTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      emitTyping(false);
    };
  }, [conversation?.id, emitTyping]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    // Handle edit mode
    if (editingMessage) {
      const msgId = editingMessage.id;
      setInputText('');
      setEditingMessage(null);
      setShowEmoji(false);
      emitTyping(false);
      try {
        const response = await fetch(`/api/conversations/${conversation.id}/messages/${msgId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const payload = await response.json();
        if (!response.ok) {
          toast.error(payload.error || 'Failed to edit message');
          return;
        }
        onMessageEdited?.(conversation.id, msgId, text);
        toast.success('Message edited');
      } catch {
        toast.error('Unable to edit message right now.');
      }
      return;
    }

    setInputText('');
    setShowEmoji(false);
    emitTyping(false);

    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          type: 'text',
          scheduledFor: scheduleDate ? new Date(scheduleDate).toISOString() : undefined 
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          onConversationUnavailable?.(conversation.id);
          return;
        }
        toast.error(payload.error || 'Failed to send message');
        return;
      }
      
      if (scheduleDate && showScheduledManager) {
        loadScheduledMessages();
      }
      setScheduleDate('');
      setShowSchedulePicker(false);
      onMessageSent?.(conversation.id, payload.message);
    } catch {
      toast.error('Unable to send message right now.');
    }
  };

  const startEditMessage = (message) => {
    setEditingMessage(message);
    setInputText(message.text);
    inputRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setInputText('');
  };

  const toggleReaction = async (messageId, emoji) => {
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload.error || 'Failed to react');
        return;
      }
      onMessageReaction?.(conversation.id, messageId, payload.reactions);
    } catch {
      toast.error('Unable to react right now.');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || Number.isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadAndSendAttachment = async (file, type) => {
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const uploadPayload = await uploadResponse.json();

      if (!uploadResponse.ok) {
        toast.error(uploadPayload.error || 'Upload failed');
        return;
      }

      const messageResponse = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          text: '',
          fileUrl: uploadPayload.url,
          fileName: uploadPayload.fileName,
          fileSize: formatFileSize(uploadPayload.sizeBytes),
        }),
      });

      const messagePayload = await messageResponse.json();

      if (!messageResponse.ok) {
        if (messageResponse.status === 404) {
          onConversationUnavailable?.(conversation.id);
          return;
        }
        toast.error(messagePayload.error || 'Failed to send attachment');
        return;
      }

      onMessageSent?.(conversation.id, messagePayload.message);
      toast.success(type === 'image' ? 'Photo sent' : 'Document sent');
    } catch {
      toast.error('Unable to upload attachment right now.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast.error('Only JPG, PNG, WEBP, or GIF images are allowed');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('Image exceeds 10MB limit');
      return;
    }

    await uploadAndSendAttachment(file, 'image');
  };

  const handleSelectFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      toast.error('Unsupported document type');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('Document exceeds 10MB limit');
      return;
    }

    await uploadAndSendAttachment(file, 'file');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const appendEmoji = (emoji) => {
    setInputText((prev) => {
      const next = `${prev}${emoji}`;
      if (next.trim()) {
        emitTyping(true);
        scheduleTypingStop();
      }
      return next;
    });
    inputRef.current?.focus();
  };

  const handleInputChange = (event) => {
    const next = event.target.value;
    setInputText(next);

    if (!next.trim()) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      emitTyping(false);
      return;
    }

    emitTyping(true);
    scheduleTypingStop();
  };

  const typingText = useMemo(() => {
    if (!activeTypingUsers.length) {
      return '';
    }
    if (activeTypingUsers.length === 1) {
      return `${activeTypingUsers[0]} is typing...`;
    }
    if (activeTypingUsers.length === 2) {
      return `${activeTypingUsers[0]} and ${activeTypingUsers[1]} are typing...`;
    }
    return `${activeTypingUsers[0]} and ${activeTypingUsers.length - 1} others are typing...`;
  }, [activeTypingUsers]);

  const copyMessageText = async (text) => {
    const value = String(text || '').trim();
    if (!value) {
      toast.error('Nothing to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success('Message copied');
    } catch {
      toast.error('Unable to copy message');
    }
  };

  const deleteMessage = async (messageId, scope) => {
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || 'Failed to delete message');
        return;
      }

      onMessageDeleted?.(conversation.id, messageId, {
        updateConversationSummary: scope === 'everyone',
        lastMessage: payload.lastMessage,
        lastMessageTime: payload.lastMessageTime,
      });

      if (scope === 'everyone') {
        toast.success('Message deleted for everyone');
      } else {
        toast.success('Message deleted for you');
      }
    } catch {
      toast.error('Unable to delete message right now');
    }
  };

  const groupedMessages = [];
  messages.forEach((message) => {
    const msgDate = message.createdAt ? new Date(message.createdAt) : new Date();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let dateLabel;
    if (msgDate.toDateString() === today.toDateString()) {
      dateLabel = 'Today';
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === dateLabel) {
      lastGroup.messages.push(message);
    } else {
      groupedMessages.push({ date: dateLabel, messages: [message] });
    }
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Image Viewer */}
      {viewerImage && (
        <ImageViewer
          images={[viewerImage]}
          initialIndex={0}
          onClose={() => setViewerImage(null)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete message?"
        description={confirmDelete?.scope === 'everyone' ? 'This will delete the message for all participants.' : 'This will remove the message from your view only.'}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMessage(confirmDelete.id, confirmDelete.scope);
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="bg-white border-b border-slate-200/60 px-5 py-3.5 flex items-center gap-3 flex-shrink-0 z-10 shadow-sm">
        {/* Mobile back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-all duration-150 md:hidden flex-shrink-0"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
            <AppImage
              src={conversation.avatar}
              alt={conversation.avatarAlt}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          {conversation.isOnline && !conversation.isGroup && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900 truncate">{conversation.name}</p>
            {conversation.isGroup && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {conversation.members} members
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {typingText || (conversation.isOnline && !conversation.isGroup
              ? 'Online'
              : conversation.lastSeen ?? (conversation.isGroup ? 'Tap to view group info' : 'Offline'))}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setShowScheduledManager(!showScheduledManager);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 ${
              showScheduledManager ? 'bg-sky-50 text-sky-600' : 'text-gray-500 hover:bg-gray-100 hover:text-sky-600'
            }`}
            title="Scheduled messages"
          >
            <CalendarClock size={18} />
          </button>
          <button
            onClick={() => {
              setIsChatSearchOpen(!isChatSearchOpen);
              if (!isChatSearchOpen) {
                setChatSearchQuery('');
                setActiveSearchIndex(0);
              }
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 ${
              isChatSearchOpen ? 'bg-sky-50 text-sky-600' : 'text-gray-500 hover:bg-gray-100 hover:text-sky-600'
            }`}
            title="Search in chat"
          >
            <Search size={18} />
          </button>
          <button
            onClick={onToggleInfo}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 ${
              showInfo ? 'bg-sky-50 text-sky-600' : 'text-gray-500 hover:bg-gray-100 hover:text-sky-600'
            }`}
            title="Contact info"
          >
            <Info size={18} />
          </button>
        </div>
      </div>

      {isChatSearchOpen && (
        <div className="bg-white border-b border-slate-200/60 px-5 py-2.5 flex items-center gap-3 z-10 shadow-sm flex-shrink-0 animate-in fade-in slide-in-from-top-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              autoFocus
              value={chatSearchQuery}
              onChange={(e) => {
                setChatSearchQuery(e.target.value);
                setActiveSearchIndex(0);
              }}
              placeholder="Search in conversation..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
            />
          </div>
          {chatSearchQuery.trim() && (
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium whitespace-nowrap">
              {searchResults.length > 0 ? (
                <>
                  <span>{activeSearchIndex + 1} of {searchResults.length}</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={handlePrevSearch} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronUp size={16} /></button>
                    <button onClick={handleNextSearch} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronDown size={16} /></button>
                  </div>
                </>
              ) : (
                <span>No matches</span>
              )}
            </div>
          )}
          <button onClick={() => { setIsChatSearchOpen(false); setChatSearchQuery(''); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {showScheduledManager && (
        <div className="bg-white border-b border-slate-200/60 p-4 z-10 shadow-sm flex-shrink-0 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><CalendarClock size={16} className="text-sky-500" /> Scheduled Messages</h3>
            <button onClick={() => setShowScheduledManager(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          {isLoadingScheduled ? (
            <div className="text-center py-4 text-xs text-gray-400">Loading...</div>
          ) : scheduledMessages.length === 0 ? (
            <div className="text-center py-4 text-xs text-gray-400">Nothing scheduled yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {scheduledMessages.map(msg => (
                <div key={msg.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2">
                  {editingScheduledMessage?.id === msg.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editingScheduledMessage.text}
                        onChange={(e) => setEditingScheduledMessage({ ...editingScheduledMessage, text: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-sky-400"
                      />
                      <input
                        type="datetime-local"
                        value={(() => {
                          const d = new Date(editingScheduledMessage.scheduledFor);
                          const pad = n => n.toString().padStart(2, '0');
                          return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                        })()}
                        onChange={(e) => setEditingScheduledMessage({ ...editingScheduledMessage, scheduledFor: new Date(e.target.value).toISOString() })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-sky-400"
                      />
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <button onClick={() => setEditingScheduledMessage(null)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                        <button onClick={() => updateScheduledMessage(msg.id, editingScheduledMessage.text, new Date(editingScheduledMessage.scheduledFor))} className="text-xs text-sky-600 hover:text-sky-700 font-medium">Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-700 truncate">{msg.text}</p>
                        <span className="text-[10px] font-semibold text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">Scheduled</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12}/> {new Date(msg.scheduledFor).toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingScheduledMessage(msg)} className="text-xs text-sky-600 hover:text-sky-700 font-medium">Edit</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => cancelScheduledMessage(msg.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Cancel</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => sendScheduledNow(msg.id)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Send now</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-4 flex flex-col gap-1">
        {groupedMessages.map((group) => (
          <div key={`date-group-${group.date}`} className="flex flex-col gap-1">
            <div className="flex items-center justify-center my-4 relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200/60"></div>
              </div>
              <span className="relative text-[11px] font-600 text-slate-400 uppercase tracking-widest bg-slate-50 px-3">
                {group.date}
              </span>
            </div>

            {group.messages.map((message, index) => {
              const isMine = message.senderId === currentUserId;
              const isConsecutive = index > 0 && group.messages[index - 1].senderId === message.senderId;

              return (
                <div 
                  key={message.id} 
                  ref={(el) => { if (el) messageRefs.current.set(message.id, el); else messageRefs.current.delete(message.id); }} 
                  className={`transition-colors duration-500 ${searchResults[activeSearchIndex] === message.id && isChatSearchOpen ? 'bg-sky-50/50 ring-2 ring-sky-200 ring-offset-2 rounded-xl' : ''}`}
                >
                <MessageBubble
                  message={message}
                  chatSearchQuery={isChatSearchOpen ? chatSearchQuery : ''}
                  isMine={isMine}
                  isConsecutive={isConsecutive}
                  currentUserId={currentUserId}
                  onCopyMessage={() => copyMessageText(message.text)}
                  onDeleteForMe={() => setConfirmDelete({ id: message.id, scope: 'me' })}
                  onDeleteForEveryone={() => setConfirmDelete({ id: message.id, scope: 'everyone' })}
                  onEditMessage={() => startEditMessage(message)}
                  onReact={(emoji) => toggleReaction(message.id, emoji)}
                  onImageClick={(url, name) => setViewerImage({ url, name })}
                  onStartCall={() => onStartCall?.(conversation.id, message.callType || 'voice')}
                  senderName={
                    !isMine && conversation.isGroup
                      ? message.senderName || message.senderId
                      : undefined
                  }
                  senderAvatar={!isMine && !isConsecutive ? conversation.avatar : undefined}
                  senderAvatarAlt={conversation.avatarAlt}
                />
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Edit banner */}
      {editingMessage && (
        <div className="bg-sky-50 border-t border-sky-100 px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <Pencil size={14} className="text-sky-600" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sky-700">Editing message</p>
            <p className="text-xs text-sky-600 truncate">{editingMessage.text}</p>
          </div>
          <button onClick={cancelEdit} className="text-sky-400 hover:text-sky-600">
            <X size={16} />
          </button>
        </div>
      )}

      {showEmoji && (
        <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500">Insert emoji</p>
            <button onClick={() => setShowEmoji(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {TEXT_EMOJI_LIST.map((emoji) => (
              <button
                key={`emoji-${emoji}`}
                onClick={() => appendEmoji(emoji)}
                className="text-xl px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
              {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSchedulePicker && (
        <div className="bg-white border-t border-slate-100 px-4 py-3 flex-shrink-0 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <CalendarClock size={18} className="text-sky-600" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-700">Schedule Message</span>
              <span className="text-[10px] text-slate-500">Pick a time to automatically send this message</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="datetime-local" 
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
              min={new Date().toISOString().slice(0, 16)}
            />
            <button onClick={() => { setShowSchedulePicker(false); setScheduleDate(''); }} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Analyzer Panel */}
      {showAnalyzer && (
        <div className="bg-white border-t border-slate-200/60 p-4 flex-shrink-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] max-h-80 overflow-y-auto chat-scrollbar">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-sky-600" />
              <p className="text-sm font-semibold text-slate-800">Chat Analyzer</p>
              {analyzeResult?.tone && (
                <span className="text-[10px] font-semibold bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {analyzeResult.tone}
                </span>
              )}
            </div>
            <button onClick={() => setShowAnalyzer(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          
          {analyzeError ? (
            <div className="text-sm text-red-500 py-4 text-center bg-red-50 rounded-xl">{analyzeError}</div>
          ) : !analyzeResult ? (
            <div className="text-sm text-slate-500 py-4 text-center flex flex-col items-center gap-2">
              <RefreshCw size={24} className="animate-spin text-sky-400" />
              Analyzing conversation...
            </div>
          ) : (
            <div className="space-y-4">
              {analyzeResult.summary && (
                <div>
                  <p className="text-[11px] font-600 text-slate-400 uppercase tracking-widest mb-1">Summary</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100/60">{analyzeResult.summary}</p>
                </div>
              )}
              
              {analyzeResult.pendingQuestions?.length > 0 ? (
                <div>
                  <p className="text-[11px] font-600 text-slate-400 uppercase tracking-widest mb-1">Pending Questions</p>
                  <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                    {analyzeResult.pendingQuestions.map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] font-600 text-slate-400 uppercase tracking-widest mb-1">Pending Questions</p>
                  <p className="text-sm text-slate-500 italic">No open questions found.</p>
                </div>
              )}

              {analyzeResult.actionItems?.length > 0 && (
                <div>
                  <p className="text-[11px] font-600 text-slate-400 uppercase tracking-widest mb-1">Action Items</p>
                  <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                    {analyzeResult.actionItems.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}

              {analyzeResult.suggestedReplies?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-600 text-slate-400 uppercase tracking-widest">Suggested Replies</p>
                    <div className="flex items-center gap-2">
                      <select 
                        value={analyzeTone} 
                        onChange={(e) => {
                          setAnalyzeTone(e.target.value);
                          handleAnalyze(e.target.value);
                        }}
                        className="text-xs border border-slate-200/60 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      >
                        <option value="friendly">Friendly</option>
                        <option value="casual">Casual</option>
                        <option value="professional">Professional</option>
                        <option value="short">Short</option>
                      </select>
                      <button 
                        onClick={() => handleAnalyze()}
                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200/60"
                        title="Regenerate"
                      >
                        <RefreshCw size={14} className={isAnalyzing ? "animate-spin" : ""} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {analyzeResult.suggestedReplies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInputText(reply.text);
                          setShowAnalyzer(false);
                          inputRef.current?.focus();
                        }}
                        className="text-left bg-sky-50/50 hover:bg-sky-50 border border-sky-100 text-slate-700 rounded-xl px-3 py-2 text-sm transition-colors"
                      >
                        <span className="font-semibold text-sky-600 block text-[11px] mb-0.5">{reply.label}</span>
                        {reply.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white border-t border-slate-200/60 px-4 py-3.5 flex items-center gap-3 flex-shrink-0 z-10 shadow-sm">
        <div className="relative group">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSelectImage}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleSelectFile}
          />
          <button
            disabled={isUploading}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-sky-600 transition-all duration-150"
            title="Attach file"
          >
            <Paperclip size={19} />
          </button>
          <div className="absolute bottom-12 left-0 bg-white border border-gray-100 rounded-xl shadow-lg p-1 hidden group-hover:flex flex-col gap-0.5 w-36 z-10">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ImageIcon size={15} className="text-sky-500" />
              Photo
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <FileText size={15} className="text-emerald-500" />
              Document
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 ${
            showEmoji ? 'bg-sky-50 text-sky-600' : 'text-gray-400 hover:bg-gray-100 hover:text-sky-600'
          }`}
          title="Emoji"
        >
          <Smile size={19} />
        </button>

        <button
          onClick={() => handleAnalyze()}
          disabled={isAnalyzing}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 ${
            showAnalyzer || isAnalyzing ? 'bg-sky-50 text-sky-600' : 'text-gray-400 hover:bg-gray-100 hover:text-sky-600'
          }`}
          title="Analyze chat"
        >
          {isAnalyzing ? (
            <RefreshCw size={19} className="animate-spin" />
          ) : (
            <Bot size={19} />
          )}
        </button>

        <button
          onClick={() => setShowSchedulePicker(!showSchedulePicker)}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 ${
            showSchedulePicker || scheduleDate ? 'bg-sky-50 text-sky-600' : 'text-gray-400 hover:bg-gray-100 hover:text-sky-600'
          }`}
          title="Schedule message"
        >
          <CalendarClock size={19} />
        </button>

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
            onBlur={() => emitTyping(false)}
            onKeyDown={handleKeyDown}
            className="w-full bg-slate-50 border border-slate-200/60 rounded-full px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-400 transition-all duration-200"
          />
        </div>

        {inputText.trim() ? (
          <button
            onClick={sendMessage}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white transition-all duration-150 shadow-sm shadow-sky-200 flex-shrink-0"
            title="Send message"
          >
            <Send size={17} />
          </button>
        ) : (
          <button
            onClick={() => (isUploading ? null : toast.info('Voice recording coming soon'))}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-sky-600 transition-all duration-150 flex-shrink-0"
            title={isUploading ? 'Uploading...' : 'Record voice message'}
          >
            {isUploading ? (
              <svg className="animate-spin w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Mic size={19} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  chatSearchQuery,
  isMine,
  isConsecutive,
  currentUserId,
  onCopyMessage,
  onDeleteForMe,
  onDeleteForEveryone,
  onEditMessage,
  onReact,
  onImageClick,
  onStartCall,
  senderName,
  senderAvatar,
  senderAvatarAlt,
}) {
  const [showActions, setShowActions] = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const attachmentUrl = normalizeAttachmentUrl(message.fileUrl || message.text);
  const attachmentName = message.fileName || (message.type === 'image' ? 'image' : 'attachment');
  const reactions = message.reactions || {};
  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${isConsecutive ? 'mt-0.5' : 'mt-3'}`}>
      {!isMine && (
        <div className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ${isConsecutive ? 'invisible' : ''}`}>
          {senderAvatar ? (
            <AppImage src={senderAvatar} alt={senderAvatarAlt} width={28} height={28} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-500">
                {senderName?.charAt(0) ?? '?'}
              </span>
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[65%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
        {senderName && !isConsecutive && (
          <p className="text-xs font-semibold text-sky-600 px-1">{senderName}</p>
        )}
        
        {message.status === 'scheduled' && (
          <p className="text-[10px] font-semibold text-sky-500 uppercase tracking-widest flex items-center gap-1 mb-0.5 px-1">
            <Clock size={10} /> Scheduled
          </p>
        )}

        {/* Reply-to preview */}
        {message.replyToMessage && (
          <div className={`text-xs px-3 py-1.5 rounded-lg border-l-2 mb-0.5 ${isMine ? 'bg-sky-600/30 border-white/40 text-sky-100' : 'bg-gray-100 border-sky-400 text-gray-600'}`}>
            <span className="font-semibold">{message.replyToMessage.senderName}</span>
            <p className="truncate max-w-[200px]">{message.replyToMessage.text}</p>
          </div>
        )}

        {message.type === 'image' ? (
          <div className={`p-1.5 rounded-2xl shadow-sm border ${
            isMine ? 'message-bubble-sent border-sky-700/80' : 'message-bubble-received border-slate-200'
          }`}>
            {attachmentUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => onImageClick?.(attachmentUrl, attachmentName)}
                  className={`block w-[220px] h-[220px] rounded-xl p-1 cursor-pointer ${isMine ? 'bg-sky-950/20' : 'bg-slate-200/80'}`}
                  title="View image"
                >
                  <AppImage
                    src={attachmentUrl}
                    alt={attachmentName || 'Shared image'}
                    width={220}
                    height={220}
                    className={`w-full h-full object-contain rounded-lg ${
                      isMine ? 'ring-1 ring-white/40' : 'ring-1 ring-slate-200'
                    }`}
                  />
                </button>
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={attachmentUrl}
                    download={attachmentName}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${
                      isMine ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
              </>
            ) : (
              <div className={`w-[220px] h-[220px] rounded-xl p-2 flex items-center justify-center text-xs ${isMine ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                Image unavailable
              </div>
            )}
          </div>
        ) : message.type === 'file' ? (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm ${
            isMine ? 'message-bubble-sent' : 'message-bubble-received'
          }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isMine ? 'bg-white/20' : 'bg-sky-50'
            }`}>
              <FileText size={16} className={isMine ? 'text-white' : 'text-sky-600'} />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isMine ? 'text-white' : 'text-gray-800'}`}>
                <HighlightedText text={message.fileName} query={chatSearchQuery} />
              </p>
              <p className={`text-xs ${isMine ? 'text-sky-100' : 'text-gray-400'}`}>
                {message.fileSize}
              </p>
              {attachmentUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={attachmentUrl}
                    download={attachmentName}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${
                      isMine ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : message.type === 'call_log' ? (
          <div className="flex items-center justify-center my-3 w-full">
            <div className="bg-gray-100/80 rounded-2xl px-4 py-2 flex items-center justify-between gap-4 w-full max-w-[280px] shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.callStatus === 'missed' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {message.callType === 'video' ? <Video size={14} /> : <Phone size={14} />}
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-xs font-semibold text-gray-800">
                    {message.callStatus === 'missed' ? 'Missed call' : message.callStatus === 'cancelled' ? 'Cancelled call' : 'Call ended'}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {message.callStatus === 'missed' ? message.timestamp : message.duration || '0s'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onStartCall}
                className="w-8 h-8 rounded-full bg-white hover:bg-sky-50 shadow-sm border border-gray-200 flex items-center justify-center text-sky-600 transition-colors shrink-0"
                title={`Call back (${message.callType})`}
              >
                {message.callType === 'video' ? <Video size={14} /> : <Phone size={14} />}
              </button>
            </div>
          </div>
        ) : (
          <div className={`px-4 py-2.5 shadow-sm ${
            isMine ? 'message-bubble-sent' : 'message-bubble-received'
          }`}>
            <p className={`text-sm leading-relaxed ${isMine ? 'text-white' : 'text-gray-800'}`}>
              <HighlightedText text={message.text} query={chatSearchQuery} />
            </p>
          </div>
        )}

        {/* Reactions display */}
        {hasReactions && (
          <div className="flex flex-wrap gap-1 px-1">
            {Object.entries(reactions).map(([emoji, users]) => {
              if (!users?.length) return null;
              const iReacted = users.includes(currentUserId);
              return (
                <button
                  key={`reaction-${emoji}`}
                  onClick={() => onReact?.(emoji)}
                  className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                    iReacted ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="font-semibold">{users.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Timestamp + status + edited */}
        <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className={`text-xs ${isMine ? 'text-sky-700' : 'text-gray-400'}`}>{message.timestamp}</span>
          {message.isEdited && <span className="text-xs text-gray-400 italic">edited</span>}
          {isMine && <MessageStatus status={message.status} />}
        </div>
      </div>

      {/* Actions */}
      <div className="relative self-start">
        <button
          type="button"
          onClick={() => { setShowActions((prev) => !prev); setShowReactPicker(false); }}
          className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Message actions"
        >
          <ChevronDown size={14} />
        </button>

        {showActions && (
          <div className={`absolute z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white shadow-lg p-1 ${isMine ? 'right-0' : 'left-0'}`}>
            <button
              type="button"
              onClick={() => { setShowActions(false); onCopyMessage?.(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <Copy size={14} />
              Copy
            </button>
            {/* React button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowReactPicker((prev) => !prev)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                <Smile size={14} />
                React
              </button>
              {showReactPicker && (
                <div className="flex gap-1 px-3 py-1.5 bg-slate-50 rounded-lg mb-1">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={`react-${emoji}`}
                      onClick={() => { setShowActions(false); setShowReactPicker(false); onReact?.(emoji); }}
                      className="text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Edit (own text messages only) */}
            {isMine && message.type === 'text' && (
              <button
                type="button"
                onClick={() => { setShowActions(false); onEditMessage?.(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                <Pencil size={14} />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => { setShowActions(false); onDeleteForMe?.(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <Trash2 size={14} />
              Delete for me
            </button>
            {isMine && (
              <button
                type="button"
                onClick={() => { setShowActions(false); onDeleteForEveryone?.(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                <Trash2 size={14} />
                Delete for everyone
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeAttachmentUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('uploads/')) {
    return `/${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Older messages can store only the generated filename (without /uploads prefix).
  // Treat file-like names as files under public/uploads.
  if (!trimmed.includes('/') && /\.[a-z0-9]{2,8}$/i.test(trimmed)) {
    return `/uploads/${trimmed}`;
  }

  return `/${trimmed.replace(/^\/+/, '')}`;
}

function MessageStatus({ status }) {
  if (status === 'sending') {
    return (
      <svg className="animate-spin w-3 h-3 text-sky-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    );
  }
  if (status === 'sent') return <Check size={12} className="text-sky-600" />;
  if (status === 'delivered') return <CheckCheck size={12} className="text-sky-600" />;
  if (status === 'read') return <CheckCheck size={12} className="text-sky-700" />;
  return null;
}

function HighlightedText({ text, query }) {
  if (!query || !text) return text;
  try {
    const parts = text.split(new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\\\^$|#\\s]/g, '\\\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? <mark key={i} className="bg-yellow-300 text-slate-900 rounded-[2px] px-0.5">{part}</mark> : part
        )}
      </>
    );
  } catch(e) {
    return text;
  }
}