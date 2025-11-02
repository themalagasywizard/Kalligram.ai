'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Editor as TTEditor } from '@tiptap/react';

interface RewritePopupProps {
  show: boolean;
  position: { top: number; left: number };
  selectedText: string;
  selectionRange: Range | null;
  selectionPos: { from: number; to: number } | null;
  editor: TTEditor | null;
  onRewrite: () => void;
  onClose: () => void;
  setIsDirty: (dirty: boolean) => void;
}

export function RewritePopup({
  show,
  position,
  selectedText,
  selectionRange,
  selectionPos,
  editor,
  onRewrite,
  onClose,
  setIsDirty
}: RewritePopupProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenText, setRewrittenText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [appliedRange, setAppliedRange] = useState<{ from: number; to: number } | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    if (!show && !showDiff) {
      setShowDiff(false);
      setRewrittenText('');
      setOriginalText('');
      setAppliedRange(null);
    }
  }, [show, showDiff]);

  const handleRewrite = async () => {
    if (!editor || !selectionPos || !selectedText) return;

    setIsRewriting(true);
    setOriginalText(selectedText);
    onRewrite();

    try {
      const apiKey = localStorage.getItem('openrouter_api_key');
      if (!apiKey) throw new Error('Please add your OpenRouter API key in Settings');
      const savedModel = localStorage.getItem('selected_ai_model') || 'qwen/qwen3-235b-a22b:free';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a professional writing assistant. Rewrite the following text to improve its quality, clarity, and style while maintaining the original meaning. Only return the rewritten text.' },
            { role: 'user', content: selectedText }
          ],
          model: savedModel,
          apiKey
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error((typeof data.error === 'string' ? data.error : data.error?.message) || data.message || 'Failed to get AI response');

      const rewritten = data.message.trim();
      setRewrittenText(rewritten);

      // Replace selection with rewritten content
      editor.chain().focus().insertContentAt({ from: selectionPos.from, to: selectionPos.to }, rewritten).run();
      setAppliedRange({ from: selectionPos.from, to: selectionPos.from + rewritten.length });

      toast.success('Text rewritten');
      setShowDiff(true);
      setIsDirty(true);
    } catch (error: any) {
      console.error('Rewrite error:', error);
      toast.error(error.message || 'Failed to rewrite text');
      setShowDiff(false);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleContinue = async () => {
    if (!editor || !selectionPos || !selectedText) return;

    setIsContinuing(true);
    setOriginalText(selectedText);
    onRewrite();

    try {
      const apiKey = localStorage.getItem('openrouter_api_key');
      if (!apiKey) throw new Error('Please add your OpenRouter API key in Settings');
      const savedModel = localStorage.getItem('selected_ai_model') || 'qwen/qwen3-235b-a22b:free';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a professional writing assistant. Continue the story naturally from the following text. Only return the continuation text.' },
            { role: 'user', content: selectedText }
          ],
          model: savedModel,
          apiKey
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error((typeof data.error === 'string' ? data.error : data.error?.message) || data.message || 'Failed to get AI response');

      const continuedText = data.message.trim();
      setRewrittenText(continuedText);

      // Insert continuation at the end of selection
      const insertAt = selectionPos.to;
      editor.chain().focus().insertContentAt(insertAt, (editor.isEmpty ? continuedText : ' ' + continuedText)).run();
      setAppliedRange({ from: insertAt, to: insertAt + continuedText.length + 1 });

      toast.success('Story continued');
      setShowDiff(true);
      setIsDirty(true);
    } catch (error: any) {
      console.error('Continue error:', error);
      toast.error(error.message || 'Failed to continue story');
      setShowDiff(false);
    } finally {
      setIsContinuing(false);
    }
  };

  const handleAccept = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDiff(false);
    setIsDirty(true);
    toast.success('Changes accepted');
    onClose();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editor && appliedRange) {
      // Revert to original selection text (for rewrite) or remove continuation (for continue)
      editor.chain().focus().insertContentAt({ from: appliedRange.from, to: appliedRange.to }, originalText || '').run();
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
          style={{ top: `${position.top}px`, left: `${position.left}px`, transform: 'translateX(-50%)' }}
        >
          <div className="flex gap-1 bg-card border rounded-lg shadow-lg p-1">
            <Button size="sm" variant="secondary" onClick={handleRewrite} disabled={isRewriting || isContinuing}>
              {isRewriting ? (<><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Rewriting...</>) : (<><Sparkles className="h-3 w-3 mr-1.5" />Rewrite</>)}
            </Button>
            <Button size="sm" variant="outline" onClick={handleContinue} disabled={isRewriting || isContinuing}>
              {isContinuing ? (<><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Continuing...</>) : (<><ArrowRight className="h-3 w-3 mr-1.5" />Continue</>)}
            </Button>
          </div>
        </div>
      )}

      {/* Accept/Cancel buttons - near current selection end */}
      {showDiff && (
        <div
          className="fixed z-50 flex gap-1 bg-card border rounded-lg shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
          style={{ top: `${position.top + 70}px`, left: `${position.left}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="default" className="h-7 bg-green-600 hover:bg-green-700" onClick={handleAccept}>
            <Check className="h-3 w-3 mr-1" />Accept
          </Button>
          <Button size="sm" variant="outline" className="h-7" onClick={handleCancel}>
            <X className="h-3 w-3 mr-1" />Cancel
          </Button>
        </div>
      )}
    </>
  );
}
