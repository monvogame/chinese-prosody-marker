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
  neutral_tone: boolean;
  erhua: boolean;
  // 测试版 (schema v2.0) 字段
  stress_level?: 'strong' | 'medium' | 'light' | 'none';
  stress_method?: 'volume' | 'duration' | 'pitch' | 'speed' | 'pause';
  pause_type?: string;
  speed_change?: 'faster' | 'slower' | 'normal';
  tone_direction?: 'up' | 'down' | 'flat' | 'curve';
  imagery_note?: string | null;
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
  // 测试版字段
  sentence_tone?: string;
  intonation?: 'up' | 'down' | 'flat' | 'curve';
  voice_quality?: string;
  emotion_note?: string;
}

export interface ProsodyParagraph {
  paragraph_index: number;
  emotion: string;
  tempo?: string;
  sentences: ProsodySentence[];
  // 测试版字段
  summary?: string;
  rhythm_type?: string;
  identity_sense?: string;
}

export interface DirectiveResponse {
  understood_directive: string;
  focus_character: string | null;
  focus_type: 'full' | 'character_only' | 'narrator_only';
  audience: string | null;
  style_guidance: string | null;
  scene_context: string | null;
  applied_adjustments: string[];
}

export interface ProsodyResult {
  title?: string;
  overall_emotion: string;
  text_type?: string;
  paragraphs: ProsodyParagraph[];
  directive_response?: DirectiveResponse;
  metadata?: {
    char_count: number;
    analysis_time_ms: number;
    model: string;
    // 测试版字段
    token_count?: number;
    paragraph_count?: number;
    sentence_count?: number;
    converted_at?: string;
    schema_version?: string;
  };
  // 测试版顶层字段
  overall_tone?: string;
  purpose?: string;
  imagery?: string;
  inner_meaning?: string;
  key_emotions?: string[];
  climax_position?: string;
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
