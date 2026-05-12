/**
 * 标记符号映射和 CSS 类名生成
 * 支持原版格式 (v1) 和测试版格式 (v2.0)
 */
import type { TokenMarks } from '../types/prosody';

function isTestFormat(marks: TokenMarks): boolean {
  return marks.stress_level !== undefined || marks.tone_direction !== undefined;
}

function getStressClass(marks: TokenMarks): string | null {
  if (isTestFormat(marks)) {
    switch (marks.stress_level) {
      case 'strong': return 'stress-heavy';
      case 'light': return 'stress-light';
      case 'none': return 'stress-light';
      default: return null;
    }
  }
  if (marks.stress === 'heavy') return 'stress-heavy';
  if (marks.stress === 'light') return 'stress-light';
  return null;
}

function getToneClass(marks: TokenMarks): string | null {
  const tone = isTestFormat(marks) ? marks.tone_direction : marks.tone;
  if (tone === 'up') return 'tone-up';
  if (tone === 'down') return 'tone-down';
  if (tone === 'curve') return 'tone-curve';
  return null;
}

function getVolumeClass(marks: TokenMarks): string | null {
  const vol = marks.volume_trend;
  if (vol === 'crescendo') return 'volume-crescendo';
  if (vol === 'decrescendo') return 'volume-decrescendo';
  return null;
}

export function getMarksClass(marks: TokenMarks): string {
  const classes: string[] = [];

  // 气息
  if (marks.breath_before === 'inhale') classes.push('breath-inhale');
  if (marks.breath_before === 'exhale') classes.push('breath-exhale');

  // 重音
  const sc = getStressClass(marks);
  if (sc) classes.push(sc);

  // 语调
  const tc = getToneClass(marks);
  if (tc) classes.push(tc);

  // 连读
  if (marks.link_next) classes.push('link-next');

  // 停顿
  if (marks.pause_after === 'short') classes.push('pause-short');
  if (marks.pause_after === 'medium') classes.push('pause-medium');
  if (marks.pause_after === 'long') classes.push('pause-long');

  // 音量趋势
  const vc = getVolumeClass(marks);
  if (vc) classes.push(vc);

  // 轻声/儿化
  if (marks.neutral_tone) classes.push('neutral-tone');
  if (marks.erhua) classes.push('erhua');

  // 测试版独有：语速变化
  if (marks.speed_change === 'faster') classes.push('speed-faster');
  if (marks.speed_change === 'slower') classes.push('speed-slower');

  return classes.join(' ');
}

export function getMarksTooltip(marks: TokenMarks): string {
  const parts: string[] = [];

  if (isTestFormat(marks)) {
    if (marks.pause_type && marks.pause_type !== '无')
      parts.push(`停顿:${marks.pause_type}`);
    if (marks.stress_method)
      parts.push(`重音法:${marks.stress_method}`);
    if (marks.imagery_note)
      parts.push(`视象:${marks.imagery_note}`);
  }

  return parts.join(' | ');
}

export function getSentenceClass(weight: string): string {
  switch (weight) {
    case 'heavy': return 'sentence-heavy';
    case 'light': return 'sentence-light';
    default: return '';
  }
}
