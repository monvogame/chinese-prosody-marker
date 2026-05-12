/**
 * 标记符号映射和 CSS 类名生成
 */
import type { TokenMarks } from '../types/prosody';

export function getMarksClass(marks: TokenMarks): string {
  const classes: string[] = [];

  if (marks.breath_before === 'inhale') classes.push('breath-inhale');
  if (marks.breath_before === 'exhale') classes.push('breath-exhale');

  if (marks.stress === 'heavy') classes.push('stress-heavy');
  if (marks.stress === 'light') classes.push('stress-light');

  if (marks.tone === 'up') classes.push('tone-up');
  if (marks.tone === 'down') classes.push('tone-down');

  if (marks.link_next) classes.push('link-next');

  if (marks.pause_after === 'short') classes.push('pause-short');
  if (marks.pause_after === 'medium') classes.push('pause-medium');
  if (marks.pause_after === 'long') classes.push('pause-long');

  if (marks.volume_trend === 'crescendo') classes.push('volume-crescendo');
  if (marks.volume_trend === 'decrescendo') classes.push('volume-decrescendo');

  return classes.join(' ');
}

export function getSentenceClass(weight: string): string {
  switch (weight) {
    case 'heavy': return 'sentence-heavy';
    case 'light': return 'sentence-light';
    default: return '';
  }
}
