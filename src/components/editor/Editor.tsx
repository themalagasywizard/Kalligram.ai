'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { EditorToolbar } from './EditorToolbar';
import { RewritePopup } from './RewritePopup';
import { cn } from '@/lib/utils';

export function Editor() {
  const { currentChapter, setIsDirty, isDirty } = useApp();
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [showPopup, setShowPopup] = useState(false);

  const countWords = useCallback((text: string): number => {
    const cleanText = text.replace(/<[^>]*>/g, '');
    const words = cleanText.trim().split(/\s+/);
    return words.filter(word => word.length > 0).length;
  }, []);

  const handleInput = useCallback(() => {
    if (!isDirty) {
      setIsDirty(true);
    }
  }, [isDirty, setIsDirty]);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      const text = selection.toString().trim();
      if (text.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setSelectionRange(range);
        setPopupPosition({
          top: rect.top - 50,
          left: rect.left + rect.width / 2
        });
        setShowPopup(true);
      } else {
        setShowPopup(false);
      }
    } else {
      setShowPopup(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  useEffect(() => {
    if (editorRef.current && currentChapter) {
      editorRef.current.innerHTML = currentChapter.content || '<p class="mb-4">Start writing your story here...</p>';
    }
  }, [currentChapter?.id]); // Only update when chapter changes

  const getContent = useCallback(() => {
    return editorRef.current?.innerHTML || '';
  }, []);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value || undefined);
    setIsDirty(true);
    editorRef.current?.focus();
  }, [setIsDirty]);

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar onCommand={execCommand} />
      <RewritePopup
        show={showPopup}
        position={popupPosition}
        selectedText={selectedText}
        selectionRange={selectionRange}
        onRewrite={() => setShowPopup(false)}
        onClose={() => setShowPopup(false)}
        setIsDirty={setIsDirty}
      />
      
      <div className="flex-1 overflow-y-auto px-8 pt-6 pb-0">
        <div className="max-w-4xl mx-auto">
          {currentChapter ? (
            <>
              <h2 className="text-3xl font-bold text-primary mb-6">
                {currentChapter.title}
              </h2>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                className={cn(
                  "prose prose-lg dark:prose-invert max-w-none",
                  "focus:outline-none min-h-[500px]",
                  "font-serif leading-relaxed"
                )}
                style={{
                  fontFamily: "'Merriweather', serif",
                  lineHeight: 1.8
                }}
              />
            </>
          ) : (
            <div className="text-center text-muted-foreground py-20">
              <p className="text-xl">Select a chapter to start writing...</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
