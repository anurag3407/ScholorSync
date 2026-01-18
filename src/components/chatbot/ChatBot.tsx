'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Loader2
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  scholarships?: ScholarshipMatch[];
}

interface ScholarshipMatch {
  id: string;
  name: string;
  provider: string;
  amount: { min: number; max: number };
  deadline: string;
  applicationUrl: string;
  matchScore: number;
}

interface UserProfile {
  category?: string;
  income?: number;
  percentage?: number;
  state?: string;
  gender?: string;
  level?: string;
  name?: string;
  branch?: string;
  college?: string;
  year?: number;
}

interface ChatBotProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChatBot({ isOpen: controlledIsOpen, onOpenChange }: ChatBotProps) {
  const { user } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  // Build personalized greeting based on user profile
  const greeting = useMemo(() => {
    if (user?.profile?.name) {
      return `👋 Hi ${user.profile.name}! I'm ScholarSync AI, your personal scholarship advisor. I already have your profile information, so I can provide personalized recommendations.\n\nI can help you:\n• Find scholarships matching your profile\n• Check your eligibility for specific scholarships\n• Guide you through the application process\n• Answer any questions about scholarships\n\nHow can I help you today?`;
    }
    return "👋 Hi! I'm ScholarSync AI, your personal scholarship advisor. I can help you:\n\n• Find scholarships matching your profile\n• Check your eligibility for specific scholarships\n• Guide you through the application process\n• Answer any questions about scholarships\n\nHow can I help you today?";
  }, [user?.profile?.name]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    'Find scholarships for me',
    'What scholarships are available for SC students?',
    'Show me engineering scholarships',
    'What documents do I need?',
  ]);

  // Use actual user profile from auth context
  const userProfile = useMemo<UserProfile>(() => {
    if (!user?.profile) return {};
    return {
      name: user.profile.name || undefined,
      category: user.profile.category || undefined,
      income: user.profile.income || undefined,
      percentage: user.profile.percentage || undefined,
      state: user.profile.state || undefined,
      gender: user.profile.gender?.toLowerCase() || undefined,
      level: user.profile.year ? (user.profile.year <= 4 ? 'ug' : 'pg') : undefined,
      branch: user.profile.branch || undefined,
      college: user.profile.college || undefined,
      year: user.profile.year || undefined,
    };
  }, [user?.profile]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update greeting when user profile loads
  useEffect(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    }]);
  }, [greeting]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          message: text,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          userProfile,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          scholarships: data.scholarships?.slice(0, 3),
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (data.suggestedQuestions) {
          setSuggestedQuestions(data.suggestedQuestions);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again or rephrase your question.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Note: extractProfileFromMessage removed - profile now comes from Firebase auth context

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        // Bold
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Convert URLs to clickable links with word-break
        line = line.replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:text-green-800 underline break-all">$1</a>'
        );
        // Also handle plain URLs
        line = line.replace(
          /(?<!href=")(https?:\/\/[^\s<]+)/g,
          '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:text-green-800 underline break-all">$1</a>'
        );
        // Bullets
        if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
          return `<li key="${i}" class="ml-4 list-disc list-inside">${line.substring(2)}</li>`;
        }
        // Numbered list
        const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
        if (numberedMatch) {
          return `<li key="${i}" class="ml-4 list-decimal list-inside">${numberedMatch[2]}</li>`;
        }
        return line;
      })
      .join('<br/>');
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-[70px] w-[70px] rounded-full shadow-xl bg-white hover:bg-gray-50 hover:scale-105 transition-all border-2 border-green-500 p-1"
            >
              <img src="/chatbot-icon.png" alt="AI" className="h-14 w-12 object-contain" />
            </Button>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[550px] max-w-[calc(100vw-2rem)] sm:max-w-[1000px]"
            style={{ height: 'calc(100vh - 6rem)', maxHeight: '700px' }}
          >
            <Card className="shadow-2xl border-0 overflow-hidden flex flex-col h-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                      <img src="/chatbot-icon.png" alt="AI" className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-semibold">ScholarSync AI</h3>
                      <p className="text-xs text-white/80">Your scholarship advisor</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => setIsOpen(false)}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 min-h-0 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-emerald-100 text-emerald-600'
                          }`}
                      >
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user'
                          ? 'bg-green-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                          }`}
                      >
                        <div
                          className="text-sm whitespace-pre-wrap break-words overflow-hidden [overflow-wrap:anywhere] chatbot-message"
                          dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                        />

                        {/* Scholarship Cards */}
                        {message.scholarships && message.scholarships.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.scholarships.map((scholarship) => (
                              <Card key={scholarship.id} className="bg-white/90 p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                      {scholarship.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 truncate">
                                      {scholarship.provider}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        ₹{scholarship.amount.min.toLocaleString()} - ₹{scholarship.amount.max.toLocaleString()}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {scholarship.matchScore.toFixed(0)}% match
                                      </Badge>
                                    </div>
                                  </div>
                                  <a
                                    href={scholarship.applicationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Suggested Questions */}
              {suggestedQuestions.length > 0 && messages.length < 4 && (
                <div className="px-4 pb-2 flex-shrink-0">
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.slice(0, 3).map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => sendMessage(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <CardContent className="p-4 border-t flex-shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about scholarships..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatBot;
