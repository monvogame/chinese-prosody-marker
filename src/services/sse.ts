/**
 * SSE 流式连接管理
 */
import type {
  ThinkingEventData,
  CompleteEventData,
  ErrorEventData,
} from '../types/prosody';

interface SSECallbacks {
  onThinking: (data: ThinkingEventData, progress: number) => void;
  onPhaseComplete: (phase: string) => void;
  onComplete: (data: CompleteEventData) => void;
  onError: (data: ErrorEventData) => void;
}

export function connectSSE(
  text: string,
  apiConfig: { provider: string; api_key: string; base_url?: string; model?: string },
  callbacks: SSECallbacks,
  version: string = 'original',
  directive: string = '',
): AbortController {
  const controller = new AbortController();

  const baseUrl = (window as any).electronAPI ? 'http://localhost:8000' : '';
  fetch(`${baseUrl}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, api_config: apiConfig, version, directive }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              handleSSEEvent(currentEvent, data, callbacks);
            } catch {
              // skip malformed data
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        callbacks.onError({
          code: 'NETWORK_ERROR',
          message: `网络连接失败: ${err.message}`,
        });
      }
    });

  return controller;
}

function handleSSEEvent(
  eventType: string,
  data: Record<string, unknown>,
  callbacks: SSECallbacks,
): void {
  switch (eventType) {
    case 'thinking': {
      const thinkingData = data as unknown as ThinkingEventData;
      callbacks.onThinking(thinkingData, thinkingData.progress || 0);
      break;
    }
    case 'phase_complete': {
      callbacks.onPhaseComplete((data as { phase: string }).phase);
      break;
    }
    case 'complete': {
      callbacks.onComplete(data as unknown as CompleteEventData);
      break;
    }
    case 'error': {
      callbacks.onError(data as unknown as ErrorEventData);
      break;
    }
  }
}
