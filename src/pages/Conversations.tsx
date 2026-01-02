import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Bot, User, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { API_ENDPOINTS } from '@/config/api';

interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'ai';
  timestamp: string;
}

interface Conversation {
  id: string;
  customerNumber: string;
  customerName: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
}

export default function Conversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_ENDPOINTS.CONVERSATIONS, {
        headers: {
          'x-user-id': user?.id || ''
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      
      // Apply limit: only show up to maxConversations
      let limitedData = data;
      if (user?.limits?.maxConversations) {
        limitedData = data.slice(0, user.limits.maxConversations);
      }
      
      setConversations(limitedData);
      
      // Select the first conversation if none is selected or if the selected one is no longer available
      if (limitedData.length > 0) {
        if (!selectedConversation || !limitedData.find((c: Conversation) => c.id === selectedConversation.id)) {
          setSelectedConversation(limitedData[0]);
        } else {
          // Update the selected conversation with fresh data
          const updated = limitedData.find((c: Conversation) => c.id === selectedConversation.id);
          if (updated) {
            setSelectedConversation(updated);
          }
        }
      } else {
        setSelectedConversation(null);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations. Please check your login and API URL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.customerNumber.includes(searchQuery)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
            <p className="text-muted-foreground mt-1">
              View all customer conversations and AI responses
            </p>
            {user?.limits && (
              <Badge 
                variant={conversations.length >= user.limits.maxConversations ? "destructive" : "secondary"}
                className="mt-2"
              >
                {conversations.length} / {user.limits.maxConversations} conversations
              </Badge>
            )}
          </div>
          <Button
            onClick={fetchConversations}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {user?.limits && conversations.length >= user.limits.maxConversations && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg p-4">
            <p className="text-sm font-medium">⚠️ Conversation Limit Reached</p>
            <p className="text-sm mt-1">
              You have reached your maximum limit of {user.limits.maxConversations} conversations. 
              Only the first {user.limits.maxConversations} conversations are displayed. 
              New incoming messages will receive an automated response informing customers you're at capacity. 
              Contact your admin to increase your limit.
            </p>
          </div>
        )}

        {loading && conversations.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-lg font-medium">No conversations yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Conversations will appear here when customers message you
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
            {/* Conversations List */}
            <Card className="lg:col-span-1 flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg mb-2 transition-colors",
                        selectedConversation?.id === conversation.id
                          ? "bg-[#25D366]/10 border border-[#25D366]"
                          : "hover:bg-gray-50 border border-transparent"
                      )}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">
                              {conversation.customerName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {conversation.customerNumber}
                            </p>
                          </div>
                        </div>
                        {conversation.unread > 0 && (
                          <Badge className="bg-[#25D366] text-white">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {conversation.timestamp}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Message Thread */}
            {selectedConversation && (
              <Card className="lg:col-span-2 flex flex-col h-full" style={{maxHeight:600}}>
                {/* Header */}
                <div className="p-4 border-b bg-white flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedConversation.customerName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedConversation.customerNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.sender === 'ai' ? "justify-start" : "justify-end"
                        )}
                      >
                        {message.sender === 'ai' && (
                          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg p-3",
                            message.sender === 'ai'
                              ? "bg-gray-100 text-gray-900"
                              : "bg-[#25D366] text-white"
                          )}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              message.sender === 'ai' ? "text-gray-500" : "text-white/80"
                            )}
                          >
                            {message.timestamp}
                          </p>
                        </div>
                        {message.sender === 'customer' && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  </ScrollArea>
                </div>

                {/* Info Banner */}
                <div className="p-4 bg-blue-50 border-t border-blue-100 flex-shrink-0">
                  <p className="text-sm text-blue-900 text-center">
                    <Bot className="w-4 h-4 inline mr-1" />
                    This is a read-only view. All responses are automatically handled by AI.
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
