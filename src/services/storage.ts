/**
 * LocalStorage 管理 - API 配置持久化
 */
import type { ApiConfig } from '../types/prosody';

const STORAGE_KEY = 'prosody-api-config';

const defaultConfig: ApiConfig = {
  provider: 'openai',
  api_key: '',
  base_url: '',
  model: '',
};

export function loadApiConfig(): ApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultConfig };
    const parsed = JSON.parse(raw);
    return {
      provider: parsed.provider || 'openai',
      api_key: parsed.api_key || '',
      base_url: parsed.base_url || '',
      model: parsed.model || '',
    };
  } catch {
    return { ...defaultConfig };
  }
}

export function saveApiConfig(config: ApiConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    provider: config.provider,
    api_key: config.api_key,
    base_url: config.base_url || '',
    model: config.model || '',
  }));
}
