"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import {
  Phone,
  Video,
  Info,
  MoreVertical,
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
} from 'lucide-react';
import { toast } from 'sonner';

const EMOJI_LIST = [':)', '<3', ':D', ';)', ':P', 'XD', ':(', ':|'];
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
  onConversationUnavailable,
  showInfo,
}) {
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const messages = useMemo(() => conversation.messages || [], [conversation.messages]);

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

    setInputText('');
    setShowEmoji(false);
    emitTyping(false);

    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type: 'text' }),
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

      onMessageSent?.(conversation.id, payload.message);
    } catch {
      toast.error('Unable to send message right now.');
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
    const date = 'Today';
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(message);
    } else {
      groupedMessages.push({ date, messages: [message] });
    }
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
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
            <p className="text-sm font-700 text-gray-900 truncate">{conversation.name}</p>
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
            onClick={() => toast.info('Voice call starting...')}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-sky-600 transition-all duration-150"
            title="Voice call"
          >
            <Phone size={18} />
          </button>
          <button
            onClick={() => toast.info('Video call starting...')}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-sky-600 transition-all duration-150"
            title="Video call"
          >
            <Video size={18} />
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
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-150"
            title="More options"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-4 flex flex-col gap-1">
        {groupedMessages.map((group) => (
          <div key={`date-group-${group.date}`} className="flex flex-col gap-1">
            <div className="flex items-center justify-center my-3">
              <span className="text-xs text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">
                {group.date}
              </span>
            </div>

            {group.messages.map((message, index) => {
              const isMine = message.senderId === currentUserId;
              const isConsecutive = index > 0 && group.messages[index - 1].senderId === message.senderId;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isMine={isMine}
                  isConsecutive={isConsecutive}
                  onCopyMessage={() => copyMessageText(message.text)}
                  onDeleteForMe={() => deleteMessage(message.id, 'me')}
                  onDeleteForEveryone={() => deleteMessage(message.id, 'everyone')}
                  senderName={
                    !isMine && conversation.isGroup
                      ? message.senderName || message.senderId
                      : undefined
                  }
                  senderAvatar={!isMine && !isConsecutive ? conversation.avatar : undefined}
                  senderAvatarAlt={conversation.avatarAlt}
                />
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showEmoji && (
        <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-600 text-gray-500">Quick reactions</p>
            <button onClick={() => setShowEmoji(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={`emoji-${emoji}`}
                onClick={() => appendEmoji(emoji)}
                className="text-sm px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2 flex-shrink-0">
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

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
            onBlur={() => emitTyping(false)}
            onKeyDown={handleKeyDown}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:bg-white transition-all duration-150"
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
  isMine,
  isConsecutive,
  onCopyMessage,
  onDeleteForMe,
  onDeleteForEveryone,
  senderName,
  senderAvatar,
  senderAvatarAlt,
}) {
  const [showActions, setShowActions] = useState(false);
  const attachmentUrl = normalizeAttachmentUrl(message.fileUrl || message.text);
  const attachmentName = message.fileName || (message.type === 'image' ? 'image' : 'attachment');

  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${isConsecutive ? 'mt-0.5' : 'mt-3'}`}>
      {/* Avatar (only for received, non-consecutive) */}
      {!isMine && (
        <div className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ${isConsecutive ? 'invisible' : ''}`}>
          {senderAvatar ? (
            <AppImage src={senderAvatar} alt={senderAvatarAlt} width={28} height={28} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs font-600 text-gray-500">
                {senderName?.charAt(0) ?? '?'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[65%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Sender name in groups */}
        {senderName && !isConsecutive && (
          <p className="text-xs font-600 text-sky-600 px-1">{senderName}</p>
        )}

        {message.type === 'image' ? (
          <div className={`p-1.5 rounded-2xl shadow-sm border ${
            isMine
              ? 'message-bubble-sent border-sky-700/80'
              : 'message-bubble-received border-slate-200'
          }`}>
            {attachmentUrl ? (
              <>
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`block w-[220px] h-[220px] rounded-xl p-1 ${isMine ? 'bg-sky-950/20' : 'bg-slate-200/80'}`}
                  title="Open image in new tab"
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
                </a>
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 text-xs font-600 px-2.5 py-1 rounded-md ${
                      isMine ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <ExternalLink size={12} />
                    Open
                  </a>
                  <a
                    href={attachmentUrl}
                    download={attachmentName}
                    className={`inline-flex items-center gap-1.5 text-xs font-600 px-2.5 py-1 rounded-md ${
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
              <p className={`text-xs font-600 ${isMine ? 'text-white' : 'text-gray-800'}`}>
                {message.fileName}
              </p>
              <p className={`text-xs ${isMine ? 'text-sky-100' : 'text-gray-400'}`}>
                {message.fileSize}
              </p>
              {attachmentUrl ? (
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 text-xs font-600 px-2.5 py-1 rounded-md ${
                      isMine ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <ExternalLink size={12} />
                    Open
                  </a>
                  <a
                    href={attachmentUrl}
                    download={attachmentName}
                    className={`inline-flex items-center gap-1.5 text-xs font-600 px-2.5 py-1 rounded-md ${
                      isMine ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
              ) : (
                <p className={`mt-1 text-xs ${isMine ? 'text-sky-100' : 'text-gray-500'}`}>
                  Attachment unavailable
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className={`px-4 py-2.5 shadow-sm ${
            isMine ? 'message-bubble-sent' : 'message-bubble-received'
          }`}>
            <p className={`text-sm leading-relaxed ${isMine ? 'text-white' : 'text-gray-800'}`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Timestamp + status */}
        <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className={`text-xs ${isMine ? 'text-sky-700' : 'text-gray-400'}`}>{message.timestamp}</span>
          {isMine && <MessageStatus status={message.status} />}
        </div>
      </div>

      <div className="relative self-start">
        <button
          type="button"
          onClick={() => setShowActions((prev) => !prev)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Message actions"
        >
          <ChevronDown size={14} />
        </button>

        {showActions && (
          <div className={`absolute z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1 ${isMine ? 'right-0' : 'left-0'}`}>
            <button
              type="button"
              onClick={() => {
                setShowActions(false);
                onCopyMessage?.();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <Copy size={14} />
              Copy
            </button>
            <button
              type="button"
              onClick={() => {
                setShowActions(false);
                onDeleteForMe?.();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <Trash2 size={14} />
              Delete for me
            </button>
            {isMine && (
              <button
                type="button"
                onClick={() => {
                  setShowActions(false);
                  onDeleteForEveryone?.();
                }}
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