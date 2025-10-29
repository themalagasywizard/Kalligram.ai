'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    if (!show) {
      setShowDiff(false);
      setRewrittenText('');
      setOriginalText('');
    }
  }, [show]);

  const handleRewrite = async () => {
    if (!selectionRange || !selectedText) return;

    setIsRewriting(true);
    setOriginalText(selectedText);
    onRewrite();

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

      // Replace the selected text with rewritten version
      const span = document.createElement('span');
      span.className = 'bg-green-200 dark:bg-green-900/40 transition-colors relative px-1 rounded';
      span.textContent = rewritten;
      span.contentEditable = 'false';
      
      diffElementRef.current = span;
      selectionRange.deleteContents();
      selectionRange.insertNode(span);

      setShowDiff(true);
      setIsDirty(true);
      toast.success('Text rewritten');
    } catch (error: any) {
      console.error('Rewrite error:', error);
      toast.error(error.message || 'Failed to rewrite text');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleAccept = () => {
    if (diffElementRef.current) {
      // Replace the span with plain text
      const textNode = document.createTextNode(rewrittenText);
      diffElementRef.current.parentNode?.replaceChild(textNode, diffElementRef.current);
      diffElementRef.current = null;
    }
    setShowDiff(false);
    setIsDirty(true);
    toast.success('Changes accepted');
    onClose();
  };

  const handleCancel = () => {
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
      {/* Rewrite button popup */}
      {show && !showDiff && (
        <div
          className="fixed z-50 animate-in fade-in-0 zoom-in-95"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <Button
            size="sm"
            variant="secondary"
            className="shadow-lg"
            onClick={handleRewrite}
            disabled={isRewriting}
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
