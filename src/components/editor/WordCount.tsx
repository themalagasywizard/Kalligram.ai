'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';

interface WordCountProps {
  content: string;
  target: number;
}

export function WordCount({ content, target }: WordCountProps) {
  const wordCount = useMemo(() => {
    const cleanText = content.replace(/<[^>]*>/g, '');
    const words = cleanText.trim().split(/\s+/);
    return words.filter(word => word.length > 0).length;
  }, [content]);

  const percentage = useMemo(() => {
    return Math.min(Math.round((wordCount / target) * 100), 100);
  }, [wordCount, target]);

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="border-t bg-muted/50 px-6 py-3 min-h-[98px]">
      <div className="flex items-center justify-end gap-4 h-full">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16">
            <svg className="transform -rotate-90" width="64" height="64">
              {/* Background circle */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                className="text-muted"
              />
              {/* Progress circle */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="text-primary transition-all duration-300"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium">{percentage}%</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">
              {wordCount.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              words / {target.toLocaleString()} target
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
