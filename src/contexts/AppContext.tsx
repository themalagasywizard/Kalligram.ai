'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Project, Chapter, AppState } from '@/types';

interface AppContextType extends AppState {
  setCurrentProject: (project: Project | null) => void;
  setCurrentChapter: (chapter: Chapter | null) => void;
  setIsDirty: (isDirty: boolean) => void;
  setWordTarget: (target: number) => void;
  updateChapterCache: (chapterId: string, chapter: Chapter) => void;
  removeFromChapterCache: (chapterId: string) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentProject: null,
    currentChapter: null,
    currentUser: null,
    isDirty: false,
    wordTarget: 1000,
    chapterCache: new Map(),
    isLoading: false,
    loadingMessage: ''
  });

  const setCurrentProject = useCallback((project: Project | null) => {
    setState(prev => ({ ...prev, currentProject: project }));
  }, []);

  const setCurrentChapter = useCallback((chapter: Chapter | null) => {
    setState(prev => ({ ...prev, currentChapter: chapter }));
  }, []);

  const setIsDirty = useCallback((isDirty: boolean) => {
    setState(prev => ({ ...prev, isDirty }));
  }, []);

  const setWordTarget = useCallback((target: number) => {
    setState(prev => ({ ...prev, wordTarget: target }));
  }, []);

  const updateChapterCache = useCallback((chapterId: string, chapter: Chapter) => {
    setState(prev => {
      const newCache = new Map(prev.chapterCache);
      newCache.set(chapterId, chapter);
      return { ...prev, chapterCache: newCache };
    });
  }, []);

  const removeFromChapterCache = useCallback((chapterId: string) => {
    setState(prev => {
      const newCache = new Map(prev.chapterCache);
      newCache.delete(chapterId);
      return { ...prev, chapterCache: newCache };
    });
  }, []);

  const setLoading = useCallback((isLoading: boolean, message = '') => {
    setState(prev => ({ ...prev, isLoading, loadingMessage: message }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setCurrentProject,
        setCurrentChapter,
        setIsDirty,
        setWordTarget,
        updateChapterCache,
        removeFromChapterCache,
        setLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
