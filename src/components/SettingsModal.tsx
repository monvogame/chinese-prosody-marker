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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">API 设置</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">模型提供商</label>
          <select
            value={local.provider}
            onChange={(e) => setLocal({ ...local, provider: e.target.value as LLMProvider })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">API Key</label>
          <input
            type="password"
            value={local.api_key}
            onChange={(e) => setLocal({ ...local, api_key: e.target.value })}
            placeholder={local.provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        {/* Base URL (for custom) */}
        {local.provider === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Base URL</label>
            <input
              type="text"
              value={local.base_url || ''}
              onChange={(e) => setLocal({ ...local, base_url: e.target.value })}
              placeholder="https://api.example.com/v1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
        )}

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Model (可选)</label>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`text-sm px-3 py-2 rounded-lg ${
            testResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            {testResult.msg}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleTest}
            disabled={testing || !local.api_key}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg
                       hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
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
