import React, { useState } from 'react';
import {
  X,
  Folder,
  File,
  FileCode,
  ChevronRight,
  ChevronDown,
  Plus,
  Upload,
  GitBranch,
  Trash2,
} from 'lucide-react';
import { FileNode } from '../types';

interface FileManagerProps {
  files: FileNode[];
  allFiles: FileNode[];
  onAddFile: (file: FileNode) => void;
  onRemoveFile: (id: string) => void;
  onClose: () => void;
  attachedFileIds: string[];
  onToggleAttach: (id: string, file?: FileNode) => void;
}

const FileTreeItem: React.FC<{
  node: FileNode;
  depth: number;
  attachedFileIds: string[];
  onToggleAttach: (id: string, file?: FileNode) => void;
  onRemove: (id: string) => void;
}> = ({ node, depth, attachedFileIds, onToggleAttach, onRemove }) => {
  const [expanded, setExpanded] = useState(true);
  const isAttached = attachedFileIds.includes(node.id);

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext || '')) return <FileCode className="w-4 h-4 text-accent" />;
    if (['py'].includes(ext || '')) return <FileCode className="w-4 h-4 text-green" />;
    if (['json', 'yaml', 'yml', 'toml'].includes(ext || '')) return <FileCode className="w-4 h-4 text-orange" />;
    if (['md', 'txt'].includes(ext || '')) return <File className="w-4 h-4 text-text-secondary" />;
    return <File className="w-4 h-4 text-text-muted" />;
  };

  if (node.type === 'folder') {
    return (
      <div>
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-bg-hover cursor-pointer transition-colors"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
          )}
          <Folder className="w-4 h-4 text-accent/70" />
          <span className="text-sm text-text-primary">{node.name}</span>
        </div>
        {expanded && node.children?.map((child) => (
          <FileTreeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            attachedFileIds={attachedFileIds}
            onToggleAttach={onToggleAttach}
            onRemove={onRemove}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${
        isAttached ? 'bg-accent/10' : 'hover:bg-bg-hover'
      }`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={() => onToggleAttach(node.id, node)}
    >
      <div className="w-3.5" />
      {getFileIcon(node.name)}
      <span className="text-sm text-text-secondary flex-1 truncate">{node.name}</span>
      {isAttached && (
        <span className="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded">✓</span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(node.id);
        }}
        className="opacity-0 hover:opacity-100 p-0.5 rounded hover:bg-red/10 text-text-muted hover:text-red transition-all"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};

const DEMO_REPO: FileNode = {
  id: 'root',
  name: 'my-project',
  type: 'folder',
  expanded: true,
  children: [
    {
      id: 'src',
      name: 'src',
      type: 'folder',
      children: [
        { id: 'app-ts', name: 'App.tsx', type: 'file', content: 'export default function App() {\n  return <div>Hello World</div>;\n}', language: 'typescript' },
        { id: 'main-ts', name: 'main.tsx', type: 'file', content: 'import React from "react";\nimport App from "./App";\n\nReact.render(<App />, document.getElementById("root"));', language: 'typescript' },
        { id: 'utils-ts', name: 'utils.ts', type: 'file', content: 'export function formatDate(date: Date): string {\n  return date.toLocaleDateString("ru-RU");\n}', language: 'typescript' },
      ],
    },
    {
      id: 'pkg',
      name: 'package.json',
      type: 'file',
      content: '{\n  "name": "my-project",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  }\n}',
      language: 'json',
    },
    {
      id: 'readme',
      name: 'README.md',
      type: 'file',
      content: '# My Project\n\nОписание проекта.\n\n## Установка\n\n```bash\nnpm install\nnpm run dev\n```',
      language: 'markdown',
    },
  ],
};

export const FileManager: React.FC<FileManagerProps> = ({
  files,
  allFiles,
  onAddFile,
  onRemoveFile,
  onClose,
  attachedFileIds,
  onToggleAttach,
}) => {
  const [repoFiles] = useState<FileNode[]>([DEMO_REPO]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const newFile: FileNode = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          type: 'file',
          content,
          language: file.name.split('.').pop(),
        };
        onAddFile(newFile);
      };
      reader.readAsText(file);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-bg-secondary border border-border rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-accent" />
              Файлы репозитория
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Прикрепите файлы к чату для анализа кода нейросетью
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            Загрузить файлы
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept=".ts,.tsx,.js,.jsx,.py,.json,.md,.txt,.yaml,.yml,.css,.html,.go,.rs,.java,.c,.cpp,.h,.sh"
            />
          </label>
          <button
            onClick={() => {
              const newFile: FileNode = {
                id: `file-${Date.now()}`,
                name: 'new-file.ts',
                type: 'file',
                content: '// Новый файл\n',
                language: 'typescript',
              };
              onAddFile(newFile);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Новый файл
          </button>
          <div className="flex-1" />
          <span className="text-xs text-text-muted">
            Прикреплено: {attachedFileIds.length}
          </span>
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Demo Repository */}
          <div className="mb-4">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2 px-2">
              Демо-репозиторий
            </div>
            {repoFiles.map((node) => (
              <FileTreeItem
                key={node.id}
                node={node}
                depth={0}
                attachedFileIds={attachedFileIds}
                onToggleAttach={onToggleAttach}
                onRemove={onRemoveFile}
              />
            ))}
          </div>

          {/* Uploaded Files */}
          {files.length > 0 && (
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-2 px-2">
                Загруженные файлы
              </div>
              {files.map((node) => (
                <FileTreeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  attachedFileIds={attachedFileIds}
                  onToggleAttach={onToggleAttach}
                  onRemove={onRemoveFile}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-bg-tertiary">
          <p className="text-xs text-text-muted text-center">
            💡 Выберите файлы кликом, чтобы прикрепить их к следующему сообщению. Нейросеть увидит их содержимое.
          </p>
        </div>
      </div>
    </div>
  );
};
