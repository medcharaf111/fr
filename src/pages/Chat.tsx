import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Bot, Send, MessageSquare, Plus, Trash2, Loader2,
  Sparkles, BookOpen, ClipboardList, Users, Lightbulb
} from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  function_name?: string;
  function_result?: any;
  created_at: string;
}

interface Conversation {
  id: number;
  title: string;
  message_count: number;
  last_message?: {
    role: string;
    content: string;
    created_at: string;
  };
  created_at: string;
  updated_at: string;
}

const Chat: React.FC = () => {
  const { t, dir } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.error('No access token found');
        window.location.href = '/login';
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/chatbot/conversations/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        // Token expired or invalid
        console.error('Authentication failed');
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversation = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/chatbot/conversations/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setCurrentConversationId(id);
        setShowWelcome(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setShowWelcome(false);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.error('No access token found');
        window.location.href = '/login';
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/chatbot/conversations/chat/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: currentConversationId
        })
      });

      if (response.status === 401) {
        // Token expired or invalid
        console.error('Authentication failed');
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        // Update conversation ID if new
        if (!currentConversationId && data.conversation_id) {
          setCurrentConversationId(data.conversation_id);
          fetchConversations(); // Refresh conversation list
        }

        // Add AI response
        const aiMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);

        // Handle function calls - show success notifications
        if (data.function_calls && data.function_calls.length > 0) {
          data.function_calls.forEach((fc: any) => {
            if (fc.result && fc.result.success) {
              // Add a success notification message
              const successMsg: Message = {
                id: Date.now() + 2,
                role: 'system',
                content: `✅ ${fc.result.message || 'Action completed successfully!'}`,
                created_at: new Date().toISOString()
              };
              setMessages(prev => [...prev, successMsg]);
              
              // Log for debugging
              console.log('Function executed:', fc.name, fc.result);
            }
          });
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: t('chat.error'),
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setShowWelcome(true);
  };

  const deleteConversation = async (id: number) => {
    if (!confirm(t('chat.deleteConfirm'))) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/chatbot/conversations/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchConversations();
        if (currentConversationId === id) {
          startNewConversation();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const examplePrompts = [
    { icon: BookOpen, text: t('chat.examples.lessonPlan'), prompt: 'Create a lesson plan for teaching algebra to 5th grade students' },
    { icon: ClipboardList, text: t('chat.examples.quiz'), prompt: 'Generate a 10-question quiz about the water cycle' },
    { icon: Users, text: t('chat.examples.analyze'), prompt: 'Analyze student performance in mathematics' },
    { icon: Lightbulb, text: t('chat.examples.suggestions'), prompt: 'Give me suggestions for making grammar lessons more engaging' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-xl sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('chat.title')}</h1>
                <p className="text-indigo-100 text-sm">{t('chat.subtitle')}</p>
              </div>
            </div>
            
            <button
              onClick={startNewConversation}
              className="flex items-center space-x-2 rtl:space-x-reverse bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl backdrop-blur-sm transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">{t('chat.newConversation')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
          {/* Sidebar - Conversations */}
          <div className="col-span-3 bg-white rounded-2xl shadow-xl p-6 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2 rtl:space-x-reverse">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <span>{t('chat.conversations')}</span>
            </h2>

            {isLoadingConversations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-semibold mb-1">{t('chat.noConversations')}</p>
                <p className="text-sm">{t('chat.noConversations.desc')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`p-4 rounded-xl cursor-pointer transition-all group ${
                      currentConversationId === conv.id
                        ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">
                        {conv.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {conv.last_message?.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {conv.message_count} messages
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="col-span-9 bg-white rounded-2xl shadow-xl flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {showWelcome && messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-8 rounded-3xl mb-8">
                    <Sparkles className="w-20 h-20 text-indigo-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('chat.welcome')}</h2>
                  </div>

                  <div className="w-full max-w-2xl">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('chat.examples.title')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {examplePrompts.map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputMessage(example.prompt);
                            setShowWelcome(false);
                          }}
                          className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-200 hover:border-indigo-300 transition-all hover:scale-105 text-left group"
                        >
                          <example.icon className="w-8 h-8 text-indigo-600 mb-3 group-hover:scale-110 transition-transform" />
                          <p className="font-semibold text-gray-800">{example.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 
                        message.role === 'system' ? 'justify-center' : 
                        'justify-start'
                      }`}
                    >
                      <div
                        className={`${message.role === 'system' ? 'max-w-[80%]' : 'max-w-[70%]'} rounded-2xl px-6 py-4 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                            : message.role === 'system'
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                            <Bot className="w-5 h-5 text-indigo-600" />
                            <span className="text-sm font-semibold text-indigo-600">AI Assistant</span>
                          </div>
                        )}
                        <div className={`prose prose-sm max-w-none ${
                          message.role === 'user' ? '[&_*]:!text-white' : 
                          message.role === 'system' ? 'prose-green' : 
                          ''
                        }`}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize]}
                            components={{
                              // Custom styling for markdown elements
                              h1: ({node, ...props}) => <h1 className={`text-2xl font-bold mb-3 mt-4 ${message.role === 'user' ? '!text-white' : ''}`} {...props} />,
                              h2: ({node, ...props}) => <h2 className={`text-xl font-bold mb-2 mt-3 ${message.role === 'user' ? '!text-white' : ''}`} {...props} />,
                              h3: ({node, ...props}) => <h3 className={`text-lg font-semibold mb-2 mt-2 ${message.role === 'user' ? '!text-white' : ''}`} {...props} />,
                              p: ({node, ...props}) => <p className={`mb-2 leading-relaxed ${message.role === 'user' ? '!text-white' : ''}`} {...props} />,
                              ul: ({node, ...props}) => <ul className={`list-disc list-inside mb-2 space-y-1 ${message.role === 'user' ? '!text-white' : ''}`} {...props} />,
                              ol: ({node, ...props}) => <ol className={`list-decimal list-inside mb-2 space-y-1 ${message.role === 'user' ? '!text-white' : ''}`} {...props} />,
                              li: ({node, ...props}) => <li className={`ml-2 ${message.role === 'user' ? '!text-white' : ''}`} {...props} />,
                              strong: ({node, ...props}) => <strong className={`font-bold ${message.role === 'user' ? '!text-white' : ''}`} {...props} />,
                              em: ({node, ...props}) => <em className={`italic ${message.role === 'user' ? '!text-white' : ''}`} {...props} />,
                              code: ({node, inline, ...props}: any) => 
                                inline ? 
                                  <code className={`px-1.5 py-0.5 rounded text-sm font-mono ${message.role === 'user' ? 'bg-white/20 !text-white' : 'bg-gray-200'}`} {...props} /> :
                                  <code className={`block p-3 rounded-lg text-sm font-mono overflow-x-auto ${message.role === 'user' ? 'bg-white/20 !text-white' : 'bg-gray-200'}`} {...props} />,
                              blockquote: ({node, ...props}) => <blockquote className={`border-l-4 pl-4 italic my-2 ${message.role === 'user' ? 'border-white/50 !text-white' : 'border-indigo-300'}`} {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl px-6 py-4 flex items-center space-x-3 rtl:space-x-reverse">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        <span className="text-gray-600">{t('chat.thinking')}</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t-2 border-gray-100 p-6">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={t('chat.placeholder')}
                  className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-lg"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2 rtl:space-x-reverse font-semibold"
                >
                  <Send className="w-5 h-5" />
                  <span>{t('chat.send')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
