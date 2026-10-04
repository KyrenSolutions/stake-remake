import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Users, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGame, type ChatMessage } from '../../context/GameContext';

export const LiveChat: React.FC = () => {
  const { currentUser, vipInfo, openAuthModal } = useAuth();
  const { chatMessages, addChatMessage, chatBotsEnabled } = useGame();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Simulate incoming bot messages periodically for lively chat feel (if enabled)
  useEffect(() => {
    if (!chatBotsEnabled) return;

    const botUsers = ['AceStriker', 'WhaleRider', 'MoonBuster', 'Satoshi99', 'NeonRider'];
    const botMessages = [
      'Anyone hit 100x on Crash today?',
      'Plinko 16 rows medium risk is my meta',
      'Dragon Tower 3 level egg streak!',
      'Blackjack dealer just busted with 26 haha',
      'Good luck everyone! 🚀',
      'Daily rakeback claimed, time to multiply'
    ];

    const interval = setInterval(() => {
      const randomUser = botUsers[Math.floor(Math.random() * botUsers.length)];
      const randomMsg = botMessages[Math.floor(Math.random() * botMessages.length)];
      const newMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2),
        user: randomUser,
        badge: Math.random() > 0.5 ? 'VIP GOLD' : undefined,
        text: randomMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      addChatMessage(newMsg);
    }, 9000);

    return () => clearInterval(interval);
  }, [chatBotsEnabled, addChatMessage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!currentUser) {
      openAuthModal('register', 'Create an account to chat with the community!');
      return;
    }

    const myMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2),
      user: currentUser.username,
      badge: vipInfo ? `VIP ${vipInfo.tier.toUpperCase()}` : 'VIP',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    addChatMessage(myMsg);
    setInput('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 bg-[#1a2c38] text-white p-3.5 rounded-full border border-[#213743] shadow-2xl hover:bg-[#2f4553] transition z-30 flex items-center gap-2 font-bold text-xs cursor-pointer group"
      >
        <MessageSquare className="w-4 h-4 text-[#00e701] group-hover:scale-110 transition" />
        <span>Live Chat</span>
      </button>
    );
  }

  return (
    <aside className="fixed bottom-5 right-5 w-80 h-[500px] bg-[#071624] border border-[#213743] rounded-2xl flex flex-col select-none shrink-0 shadow-2xl z-40 overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-[#213743] px-4 flex items-center justify-between bg-[#1a2c38]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <MessageSquare className="w-4 h-4 text-[#00e701]" />
          <span>Community Chat</span>
        </div>
        <div className="flex items-center gap-2 text-[#87909c] text-xs font-semibold">
          <span className="flex items-center gap-1 bg-[#0f212e] px-2 py-1 rounded-md text-[10px] text-[#00e701] font-mono border border-[#213743]">
            <Users className="w-3 h-3 text-[#00e701]" />
            1,429
          </span>
          <button 
            onClick={() => setIsOpen(false)}
            className="ml-1 hover:text-white p-1 rounded transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3 text-xs">
        {chatMessages.map(m => {
          if (m.isAdmin) {
            return (
              <div key={m.id} className="bg-amber-500/15 p-2.5 rounded-lg border border-amber-500/40 text-amber-300 font-bold text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="uppercase font-black text-[10px] tracking-wider">OFFICIAL ADMIN BROADCAST</span>
                  <span className="text-[10px] text-amber-400/70 ml-auto font-mono">{m.time}</span>
                </div>
                <p className="text-white text-xs leading-relaxed font-semibold">{m.text}</p>
              </div>
            );
          }

          if (m.isSystem) {
            return (
              <div key={m.id} className="bg-[#1a2c38]/80 p-2.5 rounded-lg border border-[#00e701]/30 text-[#00e701] font-bold text-[11px]">
                {m.text}
              </div>
            );
          }

          return (
            <div key={m.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#b1bad2] hover:text-white cursor-pointer">{m.user}</span>
                {m.badge && (
                  <span className="bg-[#213743] text-[#00e701] text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-[#00e701]/20">
                    {m.badge}
                  </span>
                )}
                <span className="text-[10px] text-[#87909c] ml-auto font-mono">{m.time}</span>
              </div>
              <p className="text-white bg-[#1a2c38] p-2.5 rounded-lg border border-[#213743] break-words text-[11px] leading-relaxed">
                {m.text}
              </p>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3.5 border-t border-[#213743] bg-[#1a2c38] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={currentUser ? "Type a message..." : "Sign in or create account to chat..."}
          className="flex-1 bg-[#0f212e] border border-[#213743] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00e701] transition"
        />
        <button
          type="submit"
          className="bg-[#00e701] text-black p-2.5 rounded-lg hover:bg-[#1fff20] transition font-bold cursor-pointer shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
};
