import { useState, useEffect, useRef } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetUserMessages, useSendMessage, useGetConversationMessages, useGetUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Send, Loader2, MessageSquare, Search } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import type { Message } from '../backend';

export default function MessagingSection() {
  const { identity } = useInternetIdentity();
  const currentUserPrincipal = identity?.getPrincipal() || null;
  
  const { data: allMessages = [], isLoading } = useGetUserMessages(currentUserPrincipal);
  const sendMessage = useSendMessage();
  
  const [selectedConversation, setSelectedConversation] = useState<Principal | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get conversation messages
  const { data: conversationMessages = [] } = useGetConversationMessages(selectedConversation);

  // Get profile of selected conversation participant
  const { data: selectedUserProfile } = useGetUserProfile(selectedConversation);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Extract unique conversation participants
  const conversations = Array.from(
    new Set(
      allMessages.map((msg) => {
        if (!currentUserPrincipal) return null;
        return msg.sender.toString() === currentUserPrincipal.toString()
          ? msg.recipient.toString()
          : msg.sender.toString();
      }).filter(Boolean)
    )
  ).map((principalStr) => Principal.fromText(principalStr as string));

  // Filter conversations by search query
  const filteredConversations = conversations.filter((principal) => {
    if (!searchQuery) return true;
    return principal.toString().toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedConversation) return;

    sendMessage.mutate(
      { recipient: selectedConversation, content: messageContent.trim() },
      {
        onSuccess: () => {
          setMessageContent('');
        },
      }
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getLastMessage = (participant: Principal) => {
    if (!currentUserPrincipal) return null;
    const msgs = allMessages.filter(
      (msg) =>
        (msg.sender.toString() === participant.toString() &&
          msg.recipient.toString() === currentUserPrincipal.toString()) ||
        (msg.sender.toString() === currentUserPrincipal.toString() &&
          msg.recipient.toString() === participant.toString())
    );
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
        <p className="text-muted-foreground">Chat directly with customers and team members</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </CardTitle>
            <CardDescription>Select a conversation to view messages</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Separator />
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredConversations.map((participant) => {
                    const lastMsg = getLastMessage(participant);
                    const isSelected = selectedConversation?.toString() === participant.toString();
                    return (
                      <button
                        key={participant.toString()}
                        onClick={() => setSelectedConversation(participant)}
                        className={`w-full flex items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent ${
                          isSelected ? 'bg-accent' : ''
                        }`}
                      >
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(participant.toString().slice(0, 5))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">
                              {participant.toString().slice(0, 10)}...
                            </p>
                            {lastMsg && (
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatTimestamp(lastMsg.timestamp)}
                              </span>
                            )}
                          </div>
                          {lastMsg && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {lastMsg.content}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedConversation ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(selectedConversation.toString().slice(0, 5))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-semibold">
                      {selectedUserProfile?.name || `${selectedConversation.toString().slice(0, 10)}...`}
                    </p>
                    <p className="text-xs text-muted-foreground font-normal">
                      {selectedConversation.toString()}
                    </p>
                  </div>
                </div>
              ) : (
                'Select a conversation'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {selectedConversation ? (
              <>
                <ScrollArea className="h-[400px] px-4">
                  {conversationMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Start the conversation below</p>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      {conversationMessages.map((msg) => {
                        const isSentByMe = msg.sender.toString() === currentUserPrincipal?.toString();
                        return (
                          <div
                            key={msg.id.toString()}
                            className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isSentByMe
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm break-words">{msg.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isSentByMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                }`}
                              >
                                {formatTimestamp(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                <Separator />
                <form onSubmit={handleSendMessage} className="p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      disabled={sendMessage.isPending}
                    />
                    <Button type="submit" disabled={sendMessage.isPending || !messageContent.trim()}>
                      {sendMessage.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-center px-4">
                <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No conversation selected</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
