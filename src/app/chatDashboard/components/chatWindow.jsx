"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
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
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const EMOJI_LIST = [':)', '<3', ':D', ';)', ':P', 'XD', ':(', ':|'];

export default function ChatWindow({
  conversation,
  currentUserId,
  onToggleInfo,
  onMessageSent,
  showInfo,
}) {
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const messages = useMemo(() => conversation.messages || [], [conversation.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    setShowEmoji(false);

    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type: 'text' }),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || 'Failed to send message');
        return;
      }

      onMessageSent?.(conversation.id, payload.message);
    } catch {
      toast.error('Unable to send message right now.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const appendEmoji = (emoji) => {
    setInputText((prev) => `${prev}${emoji}`);
    inputRef.current?.focus();
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
            {conversation.isOnline && !conversation.isGroup
              ? 'Online'
              : conversation.lastSeen ?? (conversation.isGroup ? 'Tap to view group info' : 'Offline')}
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
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-sky-600 transition-all duration-150"
            title="Attach file"
          >
            <Paperclip size={19} />
          </button>
          <div className="absolute bottom-12 left-0 bg-white border border-gray-100 rounded-xl shadow-lg p-1 hidden group-hover:flex flex-col gap-0.5 w-36 z-10">
            <button
              onClick={() => toast.info('Photo sharing coming soon')}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ImageIcon size={15} className="text-sky-500" />
              Photo
            </button>
            <button
              onClick={() => toast.info('File sharing coming soon')}
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
            onChange={(e) => setInputText(e.target.value)}
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
            onClick={() => toast.info('Voice recording coming soon')}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-sky-600 transition-all duration-150 flex-shrink-0"
            title="Record voice message"
          >
            <Mic size={19} />
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
  senderName,
  senderAvatar,
  senderAvatarAlt,
}) {
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

        {message.type === 'file' ? (
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
          <span className="text-xs text-gray-400">{message.timestamp}</span>
          {isMine && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
}

function MessageStatus({ status }) {
  if (status === 'sending') {
    return (
      <svg className="animate-spin w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    );
  }
  if (status === 'sent') return <Check size={12} className="text-gray-400" />;
  if (status === 'delivered') return <CheckCheck size={12} className="text-gray-400" />;
  if (status === 'read') return <CheckCheck size={12} className="text-sky-500" />;
  return null;
}