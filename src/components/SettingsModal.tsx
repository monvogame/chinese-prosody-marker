import React, { useState, useEffect } from 'react';
import type { ApiConfig, LLMProvider } from '../types/prosody';
import { testConnection } from '../services/api';

interface SettingsModalProps {
  open: boolean;
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
  onClose: () => void;
}

const PROVIDERS: { value: LLMProvider; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'custom', label: '自定义 (OpenAI 兼容)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, config, onSave, onClose }) => {
  const [local, setLocal] = useState<ApiConfig>({ ...config });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    setLocal({ ...config });
    setTestResult(null);
  }, [config, open]);

  if (!open) return null;

  const handleSave = () => {
    onSave(local);
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(local);
      setTestResult({ ok: result.success, msg: result.message });
    } catch {
      setTestResult({ ok: false, msg: '网络请求失败' });
    }
    setTesting(false);
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">API 设置</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Provider */}
        <div>
          <label className={labelClass}>模型提供商</label>
          <select
            value={local.provider}
            onChange={(e) => setLocal({ ...local, provider: e.target.value as LLMProvider })}
            className={inputClass}
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className={labelClass}>API Key</label>
          <input
            type="password"
            value={local.api_key}
            onChange={(e) => setLocal({ ...local, api_key: e.target.value })}
            placeholder={local.provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
            className={inputClass}
          />
        </div>

        {/* Base URL (for custom) */}
        {local.provider === 'custom' && (
          <div>
            <label className={labelClass}>Base URL</label>
            <input
              type="text"
              value={local.base_url || ''}
              onChange={(e) => setLocal({ ...local, base_url: e.target.value })}
              placeholder="https://api.example.com/v1"
              className={inputClass}
            />
          </div>
        )}

        {/* Model */}
        <div>
          <label className={labelClass}>Model (可选)</label>
          <input
            type="text"
            value={local.model || ''}
            onChange={(e) => setLocal({ ...local, model: e.target.value })}
            placeholder={
              local.provider === 'openai' ? '默认: gpt-4o' :
              local.provider === 'anthropic' ? '默认: claude-sonnet-4-20250514' :
              local.provider === 'deepseek' ? '默认: deepseek-v4-pro[1m]' :
              '输入模型名称'
            }
            className={inputClass}
          />
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`text-sm px-3 py-2 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap break-all ${
            testResult.ok
              ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
          }`}>
            {testResult.msg}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleTest}
            disabled={testing || !local.api_key}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg
                       hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {testing ? '测试中...' : '测试连接'}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
