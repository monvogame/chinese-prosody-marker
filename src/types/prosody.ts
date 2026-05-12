/**
 * 中文韵律标记 - 核心类型定义
 */
export type StressLevel = 'heavy' | 'normal' | 'light';
export type ToneDirection = 'up' | 'down' | 'flat';
export type PauseDuration = 'none' | 'short' | 'medium' | 'long';
export type BreathType = 'none' | 'inhale' | 'exhale';
export type VolumeTrend = 'none' | 'crescendo' | 'decrescendo';
export type SentenceWeight = 'heavy' | 'normal' | 'light';

export interface TokenMarks {
  stress: StressLevel;
  tone: ToneDirection;
  pause_after: PauseDuration;
  link_next: boolean;
  breath_before: BreathType;
  volume_trend: VolumeTrend;
}

export interface ProsodyToken {
  text: string;
  marks: TokenMarks;
}

export interface ProsodySentence {
  sentence_index: number;
  original_text: string;
  sentence_weight: SentenceWeight;
  emotion?: string;
  tokens: ProsodyToken[];
}

export interface ProsodyParagraph {
  paragraph_index: number;
  emotion: string;
  tempo?: string;
  sentences: ProsodySentence[];
}

export interface ProsodyResult {
  title?: string;
  overall_emotion: string;
  text_type?: string;
  paragraphs: ProsodyParagraph[];
  metadata?: {
    char_count: number;
    analysis_time_ms: number;
    model: string;
  };
}

export type AnalysisPhase = 'idle' | 'agent1' | 'agent2' | 'rendering' | 'complete' | 'error';

export interface AnalysisProgress {
  phase: AnalysisPhase;
  progress: number;
  estimated_remaining_sec: number;
  thinking_content: string;
  error?: string;
}

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'custom';

export interface ApiConfig {
  provider: LLMProvider;
  api_key: string;
  base_url?: string;
  model?: string;
}

export type SSEEventType = 'thinking' | 'progress' | 'phase_complete' | 'complete' | 'error';

export interface ThinkingEventData {
  phase: 'agent1' | 'agent2';
  content: string;
  progress: number;
}

export interface CompleteEventData {
  result: ProsodyResult;
}

export interface ErrorEventData {
  code: string;
  message: string;
  retry_after?: number;
}
