/**
 * 后端 API 调用（非 SSE 部分）
 */
import type { ApiConfig } from '../types/prosody';

interface TestConnectionResult {
  success: boolean;
  message: string;
  model_info?: { name: string; supports_thinking: boolean };
}

export async function testConnection(config: ApiConfig): Promise<TestConnectionResult> {
  const resp = await fetch('/api/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_config: config }),
  });
  return resp.json();
}
