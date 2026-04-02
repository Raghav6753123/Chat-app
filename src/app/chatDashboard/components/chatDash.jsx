'use client';
import { useState } from 'react';
import { Toaster } from 'sonner';
import ConversationList from './convoList';
import ChatWindow from './chatWindow';
import ContactInfoPanel from './contactInfoPAge';
import { conversations } from './mockData';

export default function ChatDashboard() {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden font-sans antialiased selection:bg-sky-200 selection:text-sky-900 transition-colors duration-300">
      <Toaster position="bottom-right" richColors toastOptions={{ className: 'rounded-xl shadow-lg border-0 bg-white/90 backdrop-blur-sm' }} />

      {/* Left â€” Conversation list */}
      <div className="w-80 xl:w-96 flex-shrink-0 bg-white shadow-[1px_0_10px_-5px_rgba(0,0,0,0.1)] border-r border-slate-100 flex flex-col h-full z-10 transition-transform duration-300">
        <ConversationList
          conversations={filteredConversations}
          activeId={activeConversationId}
          onSelect={(conversationId) => {
            setActiveConversationId(conversationId);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Center — Chat window */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 relative z-0 shadow-[inset_0_0_10px_2px_rgba(0,0,0,0.01)] transition-all duration-300">
        {activeConversation ? (
          <ChatWindow
            key={activeConversation.id}
            conversation={activeConversation}
            onToggleInfo={() => setShowInfoPanel(!showInfoPanel)}
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