'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AI_MODELS } from '@/components/ai/AIAssistant';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [enabledModels, setEnabledModels] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      const savedKey = localStorage.getItem('openrouter_api_key') || '';
      setApiKey(savedKey);
      
      const savedModels = localStorage.getItem('enabled_models');
      if (savedModels) {
        setEnabledModels(JSON.parse(savedModels));
      } else {
        // Enable all models by default
        setEnabledModels(AI_MODELS.map(m => m.id));
      }
    }
  }, [open]);

  const toggleModel = (modelId: string) => {
    setEnabledModels(prev => 
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openrouter_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('openrouter_api_key');
    }
    
    localStorage.setItem('enabled_models', JSON.stringify(enabledModels));
    toast.success('Settings saved successfully');
    onOpenChange(false);
  };

  const hasApiKey = apiKey.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your AI settings and API keys
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="api" className="w-full">
          <div className="flex items-center justify-center mb-6">
            <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1">
              <TabsTrigger value="api" className="px-4">API Key</TabsTrigger>
              <TabsTrigger value="models" className="px-4">Models</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="api" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">OpenRouter API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-or-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  openrouter.ai/keys
                </a>
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="models" className="space-y-4">
            {!hasApiKey ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm mb-2">🔒 Add an API key first</p>
                <p className="text-xs">Go to the API Key tab to add your OpenRouter key</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Available Models</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select which models appear in the AI assistant
                  </p>
                </div>
                <div className="space-y-3">
                  {AI_MODELS.map(model => (
                    <div key={model.id} className="flex items-center space-x-3 py-1">
                      <Checkbox
                        id={model.id}
                        checked={enabledModels.includes(model.id)}
                        onCheckedChange={() => toggleModel(model.id)}
                      />
                      <label
                        htmlFor={model.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {model.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
