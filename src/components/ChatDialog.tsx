import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
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
      // Poll for new messages every 5 seconds (replaces real-time subscription)
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeConversation = async () => {
    try {
      // Try to get existing conversations
      const conversations = await api.getConversations();
      const existing = conversations.find(
        (c: any) => c.property_id === propertyId && c.customer_id === user!.id
      );

      if (existing) {
        setConversationId(existing.id);
      } else {
        // Send a message to create conversation
        setConversationId('new');
      }
    } catch (error: any) {
      console.error('Error initializing conversation:', error);
      // Just allow sending a new message to start conversation
      setConversationId('new');
    }
  };

  const fetchMessages = async () => {
    if (!conversationId || conversationId === 'new') return;

    try {
      const data = await api.getMessages(conversationId);
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;

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
      await api.sendMessage({
        to_user: ownerId,
        property_id: propertyId,
        content: validation.data.content,
      });

      setNewMessage('');
      // Refresh messages after sending
      if (conversationId && conversationId !== 'new') {
        fetchMessages();
      } else {
        // Re-initialize to get the conversation ID
        initializeConversation();
      }
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
                  className={`flex ${message.from_user === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${message.from_user === user?.id
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
