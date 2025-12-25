'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm ScholarSync AI, your personal scholarship advisor. I can help you:\n\n• Find scholarships matching your profile\n• Check your eligibility for specific scholarships\n• Guide you through the application process\n• Answer any questions about scholarships\n\nHow can I help you today?",
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
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

        // Extract profile info from conversation
        extractProfileFromMessage(text);
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

  const extractProfileFromMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Extract category
    if (lowerMessage.includes('sc ') || lowerMessage.includes('scheduled caste')) {
      setUserProfile(prev => ({ ...prev, category: 'SC' }));
    } else if (lowerMessage.includes('st ') || lowerMessage.includes('scheduled tribe')) {
      setUserProfile(prev => ({ ...prev, category: 'ST' }));
    } else if (lowerMessage.includes('obc')) {
      setUserProfile(prev => ({ ...prev, category: 'OBC' }));
    } else if (lowerMessage.includes('general')) {
      setUserProfile(prev => ({ ...prev, category: 'General' }));
    }

    // Extract gender
    if (lowerMessage.includes('girl') || lowerMessage.includes('female')) {
      setUserProfile(prev => ({ ...prev, gender: 'female' }));
    } else if (lowerMessage.includes('boy') || lowerMessage.includes('male')) {
      setUserProfile(prev => ({ ...prev, gender: 'male' }));
    }

    // Extract education level
    if (lowerMessage.includes('engineering') || lowerMessage.includes('btech') || lowerMessage.includes('b.tech')) {
      setUserProfile(prev => ({ ...prev, level: 'ug', course: 'engineering' }));
    } else if (lowerMessage.includes('medical') || lowerMessage.includes('mbbs')) {
      setUserProfile(prev => ({ ...prev, level: 'ug', course: 'medical' }));
    } else if (lowerMessage.includes('pg') || lowerMessage.includes('masters') || lowerMessage.includes('mtech')) {
      setUserProfile(prev => ({ ...prev, level: 'pg' }));
    } else if (lowerMessage.includes('phd') || lowerMessage.includes('research')) {
      setUserProfile(prev => ({ ...prev, level: 'phd' }));
    }

    // Extract income (if mentioned)
    const incomeMatch = message.match(/(\d+)\s*(?:lakh|lac|l)/i);
    if (incomeMatch) {
      setUserProfile(prev => ({ ...prev, income: parseInt(incomeMatch[1]) * 100000 }));
    }

    // Extract percentage
    const percentMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)/i);
    if (percentMatch) {
      setUserProfile(prev => ({ ...prev, percentage: parseFloat(percentMatch[1]) }));
    }
  };

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
          '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all">$1</a>'
        );
        // Also handle plain URLs
        line = line.replace(
          /(?<!href=")(https?:\/\/[^\s<]+)/g,
          '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all">$1</a>'
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
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <MessageCircle className="h-6 w-6" />
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
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Bot className="h-6 w-6" />
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
                        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-md'
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
                                    className="text-blue-600 hover:text-blue-800"
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
                      <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
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
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
