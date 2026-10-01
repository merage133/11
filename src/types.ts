export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  model: string;
  provider: ProviderType;
}

export type ProviderType = 'ollama' | 'gigachat' | 'yandexgpt';

export interface ProviderConfig {
  type: ProviderType;
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  available: boolean;
  description: string;
  setupInstructions: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  language?: string;
  expanded?: boolean;
}

export interface AppSettings {
  provider: ProviderType;
  ollamaUrl: string;
  gigachatToken: string;
  yandexToken: string;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  theme: 'dark' | 'light';
}
