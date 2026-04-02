'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import ConversationList from './convoList';
import ChatWindow from './chatWindow';
import ContactInfoPanel from './contactInfoPAge';

export default function ChatDashboard() {
  const router = useRouter();
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messagesByConversation, setMessagesByConversation] = useState({});
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
    } catch {
      // Keep existing UI state if message fetch fails.
    }
  };

  const handleMessageSent = (conversationId, message) => {
    setMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), message],
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

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden font-sans antialiased selection:bg-sky-200 selection:text-sky-900 transition-colors duration-300">
      <Toaster position="bottom-right" richColors toastOptions={{ className: 'rounded-xl shadow-lg border-0 bg-white/90 backdrop-blur-sm' }} />

      {/* Left â€” Conversation list */}
      <div className="w-80 xl:w-96 flex-shrink-0 bg-white shadow-[1px_0_10px_-5px_rgba(0,0,0,0.1)] border-r border-slate-100 flex flex-col h-full z-10 transition-transform duration-300">
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
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 relative z-0 shadow-[inset_0_0_10px_2px_rgba(0,0,0,0.01)] transition-all duration-300">
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
            onToggleInfo={() => setShowInfoPanel(!showInfoPanel)}
            onMessageSent={handleMessageSent}
            showInfo={showInfoPanel}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6">
            <div className="text-center">
              <p className="text-lg font-600 text-slate-700">Select a chat to start messaging</p>
              <p className="mt-2 text-sm text-slate-500">Pick any conversation from the left panel.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right — Info panel */}
      {showInfoPanel && activeConversation && (
        <div className="w-72 xl:w-80 flex-shrink-0 bg-white border-l border-gray-100 flex flex-col h-full">
          <ContactInfoPanel
            conversation={activeConversation}
            onClose={() => setShowInfoPanel(false)}
          />
        </div>
      )}
    </div>
  );
}