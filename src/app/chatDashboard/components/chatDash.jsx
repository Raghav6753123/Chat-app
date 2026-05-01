'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import ConversationList from './convoList';
import ChatWindow from './chatWindow';
import ContactInfoPanel from './contactInfoPAge';
import { getPusherClient } from '@/lib/pusher-client';

export default function ChatDashboard() {
  const router = useRouter();
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [typingByConversation, setTypingByConversation] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const meResponse = await fetch('/api/auth/me');
        if (!meResponse.ok) {
          router.replace('/signup-login-screen');
          return;
        }

        const meData = await meResponse.json();
        if (!mounted) return;
        setCurrentUser(meData.user);

        const conversationsResponse = await fetch('/api/conversations');
        const conversationData = await conversationsResponse.json();
        if (!conversationsResponse.ok) {
          setConversations([]);
          return;
        }
        if (!mounted) return;
        setConversations(conversationData.conversations || []);
      } catch {
        if (mounted) {
          setConversations([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [router]);

  const activeConversationBase = conversations.find((c) => c.id === activeConversationId) ?? null;
  const activeConversation = useMemo(() => {
    if (!activeConversationBase) {
      return null;
    }

    return {
      ...activeConversationBase,
      messages: messagesByConversation[activeConversationBase.id] || [],
    };
  }, [activeConversationBase, messagesByConversation]);

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const conversationIdList = useMemo(
    () => conversations.map((conversation) => conversation.id),
    [conversations]
  );
  const conversationIdKey = useMemo(
    () => [...conversationIdList].sort().join('|'),
    [conversationIdList]
  );

  useEffect(() => {
    if (!currentUser?.id || !conversationIdList.length) {
      return undefined;
    }

    const pusherClient = getPusherClient();
    if (!pusherClient) {
      return undefined;
    }

    const subscriptions = conversationIdList.map((conversationId) => {
      const channelName = `private-conversation-${conversationId}`;
      const channel = pusherClient.subscribe(channelName);

      const onIncomingMessage = (payload) => {
        const incomingConversationId = payload?.conversationId;
        const incomingMessage = payload?.message;

        if (!incomingConversationId || !incomingMessage?.id) {
          return;
        }

        setMessagesByConversation((prev) => {
          const existing = prev[incomingConversationId] || [];
          if (existing.some((message) => message.id === incomingMessage.id)) {
            return prev;
          }

          return {
            ...prev,
            [incomingConversationId]: [...existing, incomingMessage],
          };
        });

        setConversations((prev) =>
          prev.map((conversation) => {
            if (conversation.id !== incomingConversationId) {
              return conversation;
            }

            const isFromCurrentUser = incomingMessage.senderId === currentUser.id;
            let unreadCount = conversation.unreadCount || 0;

            if (activeConversationId === incomingConversationId) {
              unreadCount = 0;
            } else if (!isFromCurrentUser) {
              unreadCount += 1;
            }

            return {
              ...conversation,
              lastMessage: incomingMessage.text || incomingMessage.type,
              lastMessageTime: incomingMessage.timestamp,
              unreadCount,
            };
          })
        );

        if (incomingMessage.senderId) {
          setTypingByConversation((prev) => {
            const existing = prev[incomingConversationId];
            if (!existing || !existing[incomingMessage.senderId]) {
              return prev;
            }

            const nextConversationTyping = { ...existing };
            delete nextConversationTyping[incomingMessage.senderId];

            const next = { ...prev };
            if (Object.keys(nextConversationTyping).length) {
              next[incomingConversationId] = nextConversationTyping;
            } else {
              delete next[incomingConversationId];
            }
            return next;
          });
        }
      };

      const onDeletedMessage = (payload) => {
        const incomingConversationId = payload?.conversationId;
        const deletedMessageId = payload?.messageId;

        if (!incomingConversationId || !deletedMessageId) {
          return;
        }

        setMessagesByConversation((prev) => ({
          ...prev,
          [incomingConversationId]: (prev[incomingConversationId] || []).filter(
            (message) => message.id !== deletedMessageId
          ),
        }));

        setConversations((prev) =>
          prev.map((conversation) => {
            if (conversation.id !== incomingConversationId) {
              return conversation;
            }

            return {
              ...conversation,
              lastMessage:
                typeof payload?.lastMessage === 'string' && payload.lastMessage
                  ? payload.lastMessage
                  : conversation.lastMessage,
              lastMessageTime:
                typeof payload?.lastMessageTime === 'string' && payload.lastMessageTime
                  ? payload.lastMessageTime
                  : conversation.lastMessageTime,
            };
          })
        );
      };

      const onTypingStatus = (payload) => {
        const incomingConversationId = payload?.conversationId;
        const userId = payload?.userId;
        const userName = payload?.userName;
        const isTyping = Boolean(payload?.isTyping);

        if (!incomingConversationId || !userId || userId === currentUser?.id) {
          return;
        }

        setTypingByConversation((prev) => {
          const next = { ...prev };
          const existing = { ...(next[incomingConversationId] || {}) };

          if (isTyping) {
            existing[userId] = userName || 'Someone';
            next[incomingConversationId] = existing;
          } else {
            delete existing[userId];
            if (Object.keys(existing).length) {
              next[incomingConversationId] = existing;
            } else {
              delete next[incomingConversationId];
            }
          }

          return next;
        });
      };

      const onGroupUpdated = (payload) => {
        const incomingConversationId = payload?.conversationId;
        if (!incomingConversationId) {
          return;
        }

        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === incomingConversationId
              ? {
                  ...conversation,
                  members:
                    typeof payload?.members === 'number'
                      ? payload.members
                      : conversation.members,
                  lastMessage:
                    typeof payload?.lastMessage === 'string' && payload.lastMessage
                      ? payload.lastMessage
                      : conversation.lastMessage,
                  lastMessageTime:
                    typeof payload?.lastMessageTime === 'string' && payload.lastMessageTime
                      ? payload.lastMessageTime
                      : conversation.lastMessageTime,
                }
              : conversation
          )
        );
      };

      channel.bind('new-message', onIncomingMessage);
      channel.bind('deleted-message', onDeletedMessage);
      channel.bind('typing-status', onTypingStatus);
      channel.bind('group-updated', onGroupUpdated);

      const onMessageEdited = (payload) => {
        const cId = payload?.conversationId;
        const mId = payload?.messageId;
        if (!cId || !mId) return;
        setMessagesByConversation((prev) => ({
          ...prev,
          [cId]: (prev[cId] || []).map((m) =>
            m.id === mId ? { ...m, text: payload.text, isEdited: true, editedAt: payload.editedAt } : m
          ),
        }));
      };

      const onMessageReaction = (payload) => {
        const cId = payload?.conversationId;
        const mId = payload?.messageId;
        if (!cId || !mId) return;
        setMessagesByConversation((prev) => ({
          ...prev,
          [cId]: (prev[cId] || []).map((m) =>
            m.id === mId ? { ...m, reactions: payload.reactions } : m
          ),
        }));
      };

      channel.bind('message-edited', onMessageEdited);
      channel.bind('message-reaction', onMessageReaction);

      return {
        channelName,
        channel,
        onIncomingMessage,
        onDeletedMessage,
        onTypingStatus,
        onGroupUpdated,
        onMessageEdited,
        onMessageReaction,
      };
    });

    const userChannelName = `private-user-${currentUser.id}`;
    const userChannel = pusherClient.subscribe(userChannelName);

    const onConversationAdded = (payload) => {
      const conversation = payload?.conversation;
      if (!conversation?.id) {
        return;
      }

      setConversations((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === conversation.id);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            ...conversation,
          };
          return next;
        }

        return [conversation, ...prev];
      });

      toast.success(`Added to ${conversation.name}`);
    };

    userChannel.bind('conversation-added', onConversationAdded);

    return () => {
      subscriptions.forEach(({
        channelName,
        channel,
        onIncomingMessage,
        onDeletedMessage,
        onTypingStatus,
        onGroupUpdated,
        onMessageEdited,
        onMessageReaction,
      }) => {
        channel.unbind('new-message', onIncomingMessage);
        channel.unbind('deleted-message', onDeletedMessage);
        channel.unbind('typing-status', onTypingStatus);
        channel.unbind('group-updated', onGroupUpdated);
        channel.unbind('message-edited', onMessageEdited);
        channel.unbind('message-reaction', onMessageReaction);
        pusherClient.unsubscribe(channelName);
      });

      userChannel.unbind('conversation-added', onConversationAdded);
      pusherClient.unsubscribe(userChannelName);
    };
  }, [activeConversationId, conversationIdKey, conversationIdList, currentUser?.id]);

  const handleSelectConversation = async (conversationId) => {
    setActiveConversationId(conversationId);
    setShowInfoPanel(false);

    if (messagesByConversation[conversationId]) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));
          setMessagesByConversation((prev) => {
            const next = { ...prev };
            delete next[conversationId];
            return next;
          });
          setActiveConversationId(null);
          setShowInfoPanel(false);
          toast.error('This conversation is no longer available.');
        }
        return;
      }

      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: data.messages || [],
      }));

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );

      setTypingByConversation((prev) => {
        if (!prev[conversationId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
    } catch {
      // Keep existing UI state if message fetch fails.
    }
  };

  const handleConversationUnavailable = (conversationId) => {
    setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));
    setMessagesByConversation((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });

    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setShowInfoPanel(false);
    }

    toast.error('This conversation is no longer available.');
  };

  const handleMessageSent = (conversationId, message) => {
    setMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).some((existing) => existing.id === message.id)
        ? prev[conversationId]
        : [...(prev[conversationId] || []), message],
    }));

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lastMessage: message.text || message.type,
              lastMessageTime: message.timestamp,
            }
          : conversation
      )
    );
  };

  const handleMessageDeleted = (conversationId, messageId, options = {}) => {
    setMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).filter((message) => message.id !== messageId),
    }));

    if (options.updateConversationSummary) {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lastMessage: options.lastMessage ?? conversation.lastMessage,
                lastMessageTime: options.lastMessageTime ?? conversation.lastMessageTime,
              }
            : conversation
        )
      );
    }
  };

  const handleMessageEdited = (conversationId, messageId, newText) => {
    setMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map((m) =>
        m.id === messageId ? { ...m, text: newText, isEdited: true, editedAt: new Date().toISOString() } : m
      ),
    }));
  };

  const handleMessageReaction = (conversationId, messageId, reactions) => {
    setMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map((m) =>
        m.id === messageId ? { ...m, reactions } : m
      ),
    }));
  };

  const handleTypingStatusChange = async (conversationId, isTyping) => {
    try {
      await fetch(`/api/conversations/${conversationId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping }),
      });
    } catch {
      // Ignore typing transport errors to avoid noisy UX.
    }
  };

  const handleCreateConversation = async ({ memberEmails, name, isGroup }) => {
    const emails = Array.isArray(memberEmails)
      ? memberEmails.map((email) => String(email).toLowerCase().trim()).filter(Boolean)
      : [];

    if (!emails.length) {
      toast.error('Please choose at least one participant');
      return { ok: false };
    }

    if (isGroup && !String(name || '').trim()) {
      toast.error('Group name is required for group chats');
      return { ok: false };
    }

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isGroup,
          name: String(name || '').trim(),
          memberEmails: emails,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || 'Failed to create conversation');
        return { ok: false, error: payload.error || 'Failed to create conversation' };
      }

      if (payload.conversation) {
        setConversations((prev) => {
          const existing = prev.find((conversation) => conversation.id === payload.conversation.id);
          if (existing) {
            return prev;
          }
          return [payload.conversation, ...prev];
        });
        setActiveConversationId(payload.conversation.id);
      }

      toast.success(payload.existed ? 'Opened existing conversation' : 'Conversation created');
      return { ok: true };
    } catch {
      toast.error('Unable to create conversation right now');
      return { ok: false, error: 'Unable to create conversation right now' };
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/signup-login-screen');
    }
  };

  const handleCurrentUserUpdated = (nextUser) => {
    setCurrentUser(nextUser);
  };

  const handleConversationPreferencesUpdated = (conversationId, preferences) => {
    setConversations((prev) => {
      const next = prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              isMuted:
                typeof preferences.isMuted === 'boolean'
                  ? preferences.isMuted
                  : conversation.isMuted,
              isPinned:
                typeof preferences.isPinned === 'boolean'
                  ? preferences.isPinned
                  : conversation.isPinned,
            }
          : conversation
      );

      return [...next].sort((a, b) => {
        if (a.isPinned === b.isPinned) return 0;
        return a.isPinned ? -1 : 1;
      });
    });
  };

  const handleConversationRemoved = (conversationId) => {
    setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));
    setMessagesByConversation((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });

    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setShowInfoPanel(false);
    }
  };

  const handleConversationUpdated = useCallback((conversationId, updates) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              ...updates,
            }
          : conversation
      )
    );
  }, []);

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden font-sans antialiased selection:bg-sky-200 selection:text-sky-900 transition-colors duration-300">
      <Toaster position="bottom-right" richColors toastOptions={{ className: 'rounded-xl shadow-lg border-0 bg-white/90 backdrop-blur-sm' }} />

      {/* Left — Conversation list */}
      <div className={`w-full md:w-80 xl:w-96 shrink-0 bg-white shadow-[1px_0_10px_-5px_rgba(0,0,0,0.1)] border-r border-slate-100 flex flex-col h-full z-10 transition-transform duration-300 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        <ConversationList
          conversations={filteredConversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
          onLogout={handleLogout}
          onCurrentUserUpdated={handleCurrentUserUpdated}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentUser={currentUser}
        />
      </div>

      {/* Center — Chat window */}
      <div className={`flex-1 flex flex-col h-full min-w-0 bg-slate-50 relative z-0 shadow-[inset_0_0_10px_2px_rgba(0,0,0,0.01)] transition-all duration-300 ${activeConversationId ? 'flex' : 'hidden md:flex'}`}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center px-6">
            <div className="text-center">
              <p className="text-lg font-600 text-slate-700">Loading your chats...</p>
            </div>
          </div>
        ) : activeConversation ? (
          <ChatWindow
            key={activeConversation.id}
            conversation={activeConversation}
            currentUserId={currentUser?.id}
            activeTypingUsers={Object.values(typingByConversation[activeConversation.id] || {})}
            onToggleInfo={() => setShowInfoPanel(!showInfoPanel)}
            onTypingStatusChange={handleTypingStatusChange}
            onMessageSent={handleMessageSent}
            onMessageDeleted={handleMessageDeleted}
            onMessageEdited={handleMessageEdited}
            onMessageReaction={handleMessageReaction}
            onConversationUnavailable={handleConversationUnavailable}
            onBack={() => { setActiveConversationId(null); setShowInfoPanel(false); }}
            showInfo={showInfoPanel}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6">
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-700">Select a chat to start messaging</p>
              <p className="mt-2 text-sm text-slate-500">Pick any conversation from the left panel.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right — Info panel */}
      {showInfoPanel && activeConversation && (
        <div className="w-72 xl:w-80 shrink-0 bg-white border-l border-gray-100 flex flex-col h-full">
          <ContactInfoPanel
            conversation={activeConversation}
            currentUserId={currentUser?.id}
            onPreferencesUpdated={handleConversationPreferencesUpdated}
            onConversationUpdated={handleConversationUpdated}
            onConversationRemoved={handleConversationRemoved}
            onClose={() => setShowInfoPanel(false)}
          />
        </div>
      )}
    </div>
  );
}