'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Send, X, ArrowDownToLine } from 'lucide-react';
import { AIMode, ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText?: (text: string) => void;
}

export const AI_MODELS = [
  { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat' },
  { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen 3 235B (Free)' }
];

export function AIAssistant({ isOpen, onClose, onInsertText }: AIAssistantProps) {
  const [mode, setMode] = useState<AIMode>('write');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [width, setWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[3].id); // Qwen 3 (Free)
  const [enabledModels, setEnabledModels] = useState<string[]>(AI_MODELS.map(m => m.id));
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load enabled models from settings
  useEffect(() => {
    const savedModels = localStorage.getItem('enabled_models');
    if (savedModels) {
      setEnabledModels(JSON.parse(savedModels));
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      // Smooth scroll to bottom when new messages arrive
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 320 && newWidth <= 800) {
          setWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      const apiKey = localStorage.getItem('openrouter_api_key');
      
      if (!apiKey) {
        throw new Error('Please add your OpenRouter API key in Settings');
      }

      // Build context based on mode
      let systemPrompt = '';
      if (mode === 'write') {
        systemPrompt = 'You are a creative writing assistant. Help users write compelling stories, improve their prose, and develop their narrative ideas.';
      } else if (mode === 'brainstorm') {
        systemPrompt = 'You are a brainstorming assistant. Help users generate creative ideas, explore plot possibilities, and develop story concepts.';
      } else {
        systemPrompt = 'You are a helpful writing assistant for novelists and storytellers.';
      }

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: currentInput }
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel,
          apiKey
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = typeof data.error === 'string' ? data.error : data.error?.message || data.message || 'Failed to get AI response';
        throw new Error(errorMsg);
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('AI error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="border-l bg-card flex flex-col h-full relative"
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-50"
        onMouseDown={() => setIsResizing(true)}
      />
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-px bg-border",
          isResizing && "bg-primary"
        )}
      />
      {/* Header aligned with toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-2 px-4 py-2">
          <h3 className="font-semibold text-sm">AI Assistant</h3>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Start a conversation with AI
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-lg p-3 max-w-[85%] group",
                    message.role === 'user'
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap mb-2">{message.content}</p>
                  {message.role === 'assistant' && onInsertText && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onInsertText(message.content)}
                    >
                      <ArrowDownToLine className="h-3 w-3 mr-1" />
                      Insert into editor
                    </Button>
                  )}
                </div>
              ))
            )}
            {isGenerating && (
              <div className="mr-auto bg-muted rounded-lg p-3 max-w-[85%]">
                <p className="text-sm text-muted-foreground">AI is thinking...</p>
              </div>
            )}
          </div>
        </div>

        {/* Modern Cursor-style footer with full-width chatbar */}
        <div className="bg-card p-4">
          <div className="relative rounded-lg border bg-card overflow-hidden">
            {/* Chat input with scrollable text */}
            <div className="relative max-h-[200px] overflow-y-auto">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI for help..."
                className="resize-none w-full border-0 focus-visible:ring-0 pr-12 pl-2 pt-2 pb-10 min-h-[80px]"
                style={{ height: 'auto', minHeight: '80px' }}
              />
            </div>
            
            {/* Sticky selectors at bottom with gradient background */}
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card to-transparent pt-2 pb-2 px-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                        {mode === 'write' ? 'Write' : mode === 'brainstorm' ? 'Brainstorm' : 'Chat'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => setMode('write')}>Write</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setMode('brainstorm')}>Brainstorm</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setMode('chat')}>Chat</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                    {AI_MODELS.find(m => m.id === selectedModel)?.name || 'Select Model'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {AI_MODELS.filter(model => enabledModels.includes(model.id)).map(model => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                    >
                      {model.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
                </div>
                
                {/* Send button at bottom-right */}
                <Button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isGenerating}
                  size="icon"
                  className="h-8 w-8"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
