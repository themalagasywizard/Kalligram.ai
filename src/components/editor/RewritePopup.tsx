'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RewritePopupProps {
  show: boolean;
  position: { top: number; left: number };
  selectedText: string;
  selectionRange: Range | null;
  onRewrite: () => void;
  onClose: () => void;
  setIsDirty: (dirty: boolean) => void;
}

export function RewritePopup({
  show,
  position,
  selectedText,
  selectionRange,
  onRewrite,
  onClose,
  setIsDirty
}: RewritePopupProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenText, setRewrittenText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const diffElementRef = useRef<HTMLSpanElement | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    if (!show && !showDiff) {
      setShowDiff(false);
      setRewrittenText('');
      setOriginalText('');
    }
  }, [show, showDiff]);

  // Update button positions on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showDiff) {
        setForceUpdate(prev => prev + 1);
      }
    };

    if (showDiff) {
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [showDiff]);

  const handleRewrite = async () => {
    if (!selectionRange || !selectedText) return;

    setIsRewriting(true);
    setOriginalText(selectedText);
    onRewrite();

    // Immediately replace selected text with green highlighted version showing loading
    const span = document.createElement('span');
    span.className = 'bg-green-200 dark:bg-green-900/40 transition-colors relative px-1 rounded flex items-center gap-1';
    span.innerHTML = `${selectedText}<span class="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-1"></span>`;

    diffElementRef.current = span;
    selectionRange.deleteContents();
    selectionRange.insertNode(span);

    setShowDiff(true);
    setIsDirty(true);

    try {
      const apiKey = localStorage.getItem('openrouter_api_key');

      if (!apiKey) {
        throw new Error('Please add your OpenRouter API key in Settings');
      }

      // Get selected model from localStorage
      const savedModel = localStorage.getItem('selected_ai_model') || 'qwen/qwen3-235b-a22b:free';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a professional writing assistant. Rewrite the following text to improve its quality, clarity, and style while maintaining the original meaning. Only return the rewritten text without any explanation or additional commentary.'
            },
            {
              role: 'user',
              content: selectedText
            }
          ],
          model: savedModel,
          apiKey
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = typeof data.error === 'string' ? data.error : data.error?.message || data.message || 'Failed to get AI response';
        throw new Error(errorMsg);
      }

      const rewritten = data.message.trim();
      setRewrittenText(rewritten);

      // Update the span content with the rewritten text
      if (diffElementRef.current) {
        diffElementRef.current.innerHTML = rewritten;
      }

      toast.success('Text rewritten');
    } catch (error: any) {
      console.error('Rewrite error:', error);
      // On error, revert to original text
      if (diffElementRef.current) {
        diffElementRef.current.innerHTML = selectedText;
      }
      toast.error(error.message || 'Failed to rewrite text');
      setShowDiff(false);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleContinue = async () => {
    if (!selectionRange || !selectedText) return;

    setIsContinuing(true);
    setOriginalText(selectedText);
    onRewrite();

    // Immediately replace selected text with green highlighted version showing loading
    const span = document.createElement('span');
    span.className = 'bg-green-200 dark:bg-green-900/40 transition-colors relative px-1 rounded flex items-center gap-1';
    span.innerHTML = `${selectedText}<span class="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-1"></span>`;

    diffElementRef.current = span;
    selectionRange.deleteContents();
    selectionRange.insertNode(span);

    setShowDiff(true);
    setIsDirty(true);

    try {
      const apiKey = localStorage.getItem('openrouter_api_key');

      if (!apiKey) {
        throw new Error('Please add your OpenRouter API key in Settings');
      }

      // Get selected model from localStorage
      const savedModel = localStorage.getItem('selected_ai_model') || 'qwen/qwen3-235b-a22b:free';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a professional writing assistant. Continue the story naturally from the following text. Write a few more sentences or paragraphs to extend the narrative, maintaining the same style, tone, and voice. Only return the continuation text without any explanation or additional commentary.'
            },
            {
              role: 'user',
              content: selectedText
            }
          ],
          model: savedModel,
          apiKey
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = typeof data.error === 'string' ? data.error : data.error?.message || data.message || 'Failed to get AI response';
        throw new Error(errorMsg);
      }

      const continuedText = data.message.trim();
      setRewrittenText(selectedText + continuedText);

      // Update the span content with the continued text
      if (diffElementRef.current) {
        diffElementRef.current.innerHTML = selectedText + continuedText;
      }

      toast.success('Story continued');
    } catch (error: any) {
      console.error('Continue error:', error);
      // On error, revert to original text
      if (diffElementRef.current) {
        diffElementRef.current.innerHTML = selectedText;
      }
      toast.error(error.message || 'Failed to continue story');
      setShowDiff(false);
    } finally {
      setIsContinuing(false);
    }
  };

  const handleAccept = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (diffElementRef.current) {
      // Make the span editable and remove the green background
      diffElementRef.current.contentEditable = 'true';
      diffElementRef.current.className = '';
      diffElementRef.current.style.backgroundColor = 'transparent';
      diffElementRef.current.style.padding = '0';
      diffElementRef.current.style.borderRadius = '0';
      diffElementRef.current = null;
    }
    setShowDiff(false);
    setIsDirty(true);
    toast.success('Changes accepted');
    onClose();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (diffElementRef.current) {
      // Replace with original text
      const textNode = document.createTextNode(originalText);
      diffElementRef.current.parentNode?.replaceChild(textNode, diffElementRef.current);
      diffElementRef.current = null;
    }
    setShowDiff(false);
    setIsDirty(true);
    toast.info('Changes cancelled');
    onClose();
  };

  if (!show && !showDiff) return null;

  return (
    <>
      {/* Rewrite and Continue buttons popup */}
      {show && !showDiff && (
        <div
          className="fixed z-50 animate-in fade-in-0 zoom-in-95"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex gap-1 bg-card border rounded-lg shadow-lg p-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRewrite}
              disabled={isRewriting || isContinuing}
            >
              {isRewriting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Rewriting...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Rewrite
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleContinue}
              disabled={isRewriting || isContinuing}
            >
              {isContinuing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Continuing...
                </>
              ) : (
                <>
                  <ArrowRight className="h-3 w-3 mr-1.5" />
                  Continue
                </>
              )}
            </Button>
          </div>
        </div>
      )}


      {/* Accept/Cancel buttons - floating near the rewritten text */}
      {showDiff && diffElementRef.current && (
        <div
          className="fixed z-50 flex gap-1 bg-card border rounded-lg shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
          style={{
            top: `${diffElementRef.current.getBoundingClientRect().bottom + 5}px`,
            left: `${diffElementRef.current.getBoundingClientRect().left}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="default"
            className="h-7 bg-green-600 hover:bg-green-700"
            onClick={handleAccept}
          >
            <Check className="h-3 w-3 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={handleCancel}
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      )}
    </>
  );
}
