import { supabase } from './supabaseClient';
import { type ChatMessage } from '../context/GameContext';

export interface RealtimeChatPayload {
  msg: ChatMessage;
}

let activeChannel: ReturnType<typeof supabase.channel> | null = null;

// Initialize and subscribe to real-time chat broadcast channel
export function initRealtimeChat(
  onMessageReceived: (msg: ChatMessage) => void,
  onOnlineCountChange?: (count: number) => void,
  username?: string
) {
  if (activeChannel) {
    supabase.removeChannel(activeChannel);
  }

  const channel = supabase.channel('stake_community_chat', {
    config: {
      broadcast: { self: false },
      presence: { key: username || `guest_${Math.random().toString(36).substring(2, 7)}` },
    },
  });

  // 1. Listen for real broadcast chat messages sent by any connected player
  channel.on(
    'broadcast',
    { event: 'chat_message' },
    ({ payload }: { payload: RealtimeChatPayload }) => {
      if (payload && payload.msg) {
        onMessageReceived(payload.msg);
      }
    }
  );

  // 2. Track real online presence of connected users
  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    const totalOnline = Object.keys(state).length;
    if (onOnlineCountChange) {
      onOnlineCountChange(Math.max(1, totalOnline));
    }
  });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        online_at: new Date().toISOString(),
        user: username || 'guest',
      });
    }
  });

  activeChannel = channel;

  return {
    broadcastMessage: async (msg: ChatMessage) => {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'chat_message',
          payload: { msg },
        });

        // Also attempt to persist in Supabase if chat_messages table exists
        supabase.from('chat_messages').insert({
          id: msg.id,
          username: msg.user,
          text: msg.text,
          badge: msg.badge || null,
          is_admin: Boolean(msg.isAdmin),
          is_system: Boolean(msg.isSystem),
          created_at: Date.now(),
        }).then(() => {});
      } catch (err) {
        console.warn('Realtime chat broadcast notice:', err);
      }
    },
    unsubscribe: () => {
      supabase.removeChannel(channel);
      activeChannel = null;
    },
  };
}

// Fetch historical messages from Supabase if table exists
export async function fetchHistoricalChatMessages(): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) return [];

    return data.reverse().map((row: any) => ({
      id: row.id,
      user: row.username,
      text: row.text,
      badge: row.badge || undefined,
      isAdmin: Boolean(row.is_admin),
      isSystem: Boolean(row.is_system),
      time: new Date(Number(row.created_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  } catch {
    return [];
  }
}
