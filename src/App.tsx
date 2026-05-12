import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TextInput } from './components/TextInput';
import { SettingsModal } from './components/SettingsModal';
import { ProgressPanel } from './components/ProgressPanel';
import { ProsodyResultPanel } from './components/ProsodyResult';
import { MarkLegend } from './components/MarkLegend';
import { connectSSE } from './services/sse';
import { loadApiConfig, saveApiConfig } from './services/storage';
import type {
  ApiConfig,
  AnalysisProgress,
  ProsodyResult,
  ThinkingEventData,
  CompleteEventData,
  ErrorEventData,
} from './types/prosody';

const INITIAL_PROGRESS: AnalysisProgress = {
  phase: 'idle',
  progress: 0,
  estimated_remaining_sec: 0,
  thinking_content: '',
};

export default function App() {
  const [text, setText] = useState('');
  const [config, setConfig] = useState<ApiConfig>(loadApiConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [agentVersion, setAgentVersion] = useState<string>('original');
  const [progress, setProgress] = useState<AnalysisProgress>(INITIAL_PROGRESS);
  const [result, setResult] = useState<ProsodyResult | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('prosody-dark-mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const abortRef = useRef<AbortController | null>(null);

  // 初始化 dark 类名
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 同步 dark 类名到 html 元素
  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('prosody-dark-mode', String(next));
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  const handleSaveConfig = useCallback((newConfig: ApiConfig) => {
    setConfig(newConfig);
    saveApiConfig(newConfig);
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!text.trim() || !config.api_key) return;

    // Reset state
    setAnalyzing(true);
    setResult(null);
    setProgress({
      phase: 'agent1',
      progress: 0,
      estimated_remaining_sec: Math.round(text.length * 0.05 + 15),
      thinking_content: '',
    });

    const charCount = text.length;
    const baseTime = config.provider === 'anthropic' ? 10 : 8;
    const totalEstimate = baseTime + charCount * 0.05 + 5;

    const controller = connectSSE(
      text,
      {
        provider: config.provider,
        api_key: config.api_key,
        base_url: config.base_url,
        model: config.model,
      },
      {
        onThinking: (data: ThinkingEventData, progressVal: number) => {
          setProgress((prev) => ({
            ...prev,
            phase: data.phase,
            progress: progressVal,
            estimated_remaining_sec: Math.max(1, Math.round(
              totalEstimate * (1 - progressVal / 100)
            )),
            thinking_content: (prev.thinking_content + data.content).slice(-2000),
          }));
        },
        onPhaseComplete: (phase: string) => {
          setProgress((prev) => ({
            ...prev,
            phase: phase as 'agent1' | 'agent2',
            progress: phase === 'agent1' ? 60 : 99,
          }));
        },
        onComplete: (data: CompleteEventData) => {
          setResult(data.result);
          setProgress({
            phase: 'complete',
            progress: 100,
            estimated_remaining_sec: 0,
            thinking_content: '',
          });
          setAnalyzing(false);
        },
        onError: (data: ErrorEventData) => {
          setProgress({
            phase: 'error',
            progress: 0,
            estimated_remaining_sec: 0,
            thinking_content: '',
            error: data.message,
          });
          setAnalyzing(false);
        },
      },
      agentVersion,
    );

    abortRef.current = controller;
  }, [text, config, agentVersion]);

  const handleRetry = useCallback(() => {
    setResult(null);
    setProgress(INITIAL_PROGRESS);
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Cmd/Ctrl + Enter to analyze
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!analyzing) handleAnalyze();
      }
    },
    [analyzing, handleAnalyze],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-slate-900/80 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">中文韵律标记助手</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">AI 驱动的朗读标记工具</p>
          </div>
          <div className="flex items-center gap-1">
            {/* 深色模式切换 */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={darkMode ? '切换到浅色模式' : '切换到深色模式'}
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {/* API 设置 */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="API 设置"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4" onKeyDown={handleKeyDown}>
        {/* Input */}
        <TextInput
          value={text}
          onChange={setText}
          disabled={analyzing}
          charCount={text.length}
        />

        {/* Analyze row with version selector */}
        <div className="flex gap-2">
          <select
            value={agentVersion}
            onChange={(e) => setAgentVersion(e.target.value)}
            disabled={analyzing}
            className="px-3 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg
                       text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <option value="test_claude">测试版本 Claude</option>
            <option value="origin_2.0">原版 Agent2.0</option>
            <option value="original">原版 Agent</option>
          </select>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !text.trim() || !config.api_key}
            className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors shadow-sm
                       flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                分析中...
              </>
            ) : (
              '开始分析'
            )}
          </button>
        </div>

        {/* Progress */}
        <ProgressPanel
          progress={progress}
          visible={analyzing || progress.phase === 'error'}
        />

        {/* Mark Legend */}
        <MarkLegend />

        {/* Error display */}
        {progress.phase === 'error' && !analyzing && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-400">
            {progress.error}
            <button
              onClick={handleRetry}
              className="ml-4 underline hover:no-underline"
            >
              重试
            </button>
          </div>
        )}

        {/* Result */}
        <ProsodyResultPanel
          data={result}
          loading={analyzing}
          onRetry={handleRetry}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        config={config}
        onSave={handleSaveConfig}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 dark:text-gray-600">
        中文韵律标记助手 · 基于 AI 的朗读标记工具 · 纯前端存储 API Key
      </footer>
    </div>
  );
}
