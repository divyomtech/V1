import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { z } from 'zod';

const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be less than 2000 characters')
});

interface Message {
  id: string;
  content: string;
  from_user: string;
  to_user: string;
  created_at: string;
  read: boolean;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  ownerId: string;
  ownerName: string;
  ownerPhoto?: string;
}

export const ChatDialog = ({
  open,
  onOpenChange,
  propertyId,
  ownerId,
  ownerName,
  ownerPhoto,
}: ChatDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && user) {
      initializeConversation();
    }
  }, [open, user]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeConversation = async () => {
    try {
      // Check if conversation exists
      let { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('property_id', propertyId)
        .eq('customer_id', user!.id)
        .single();

      if (!existing) {
        // Create new conversation
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            property_id: propertyId,
            customer_id: user!.id,
            owner_id: ownerId,
          })
          .select('id')
          .single();

        if (error) throw error;
        existing = newConv;
      }

      setConversationId(existing.id);
    } catch (error: any) {
      console.error('Error initializing conversation:', error);
      toast({
        title: 'Error',
        description: 'Could not start conversation',
        variant: 'destructive',
      });
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('to_user', user!.id)
        .eq('read', false);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || sending) return;

    // Validate message content
    const validation = messageSchema.safeParse({ content: newMessage });
    if (!validation.success) {
      toast({
        title: 'Invalid Message',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        from_user: user!.id,
        to_user: ownerId,
        content: validation.data.content,
      });

      if (error) throw error;

      // Update conversation last message time
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      setNewMessage('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={ownerPhoto || ''} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            Chat with {ownerName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.from_user === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.from_user === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-70">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <form onSubmit={sendMessage} className="flex gap-2 pt-4 border-t">
          <div className="flex-1 flex flex-col gap-1">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
              maxLength={2000}
            />
            <span className="text-xs text-muted-foreground">
              {newMessage.length}/2000
            </span>
          </div>
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
