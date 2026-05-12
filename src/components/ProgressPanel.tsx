import React from 'react';
import type { AnalysisProgress } from '../types/prosody';

interface ProgressPanelProps {
  progress: AnalysisProgress;
  visible: boolean;
}

export const ProgressPanel: React.FC<ProgressPanelProps> = ({ progress, visible }) => {
  if (!visible) return null;

  const phaseLabel = {
    idle: '',
    agent1: '韵律分析中',
    agent2: '标记转换中',
    rendering: '渲染中',
    complete: '完成',
    error: '错误',
  }[progress.phase];

  const progressColor = progress.phase === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className="w-full space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{phaseLabel}</span>
          <span>
            {progress.phase !== 'error'
              ? `${progress.progress}% · 预计剩余 ${progress.estimated_remaining_sec}s`
              : progress.error}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${progressColor}`}
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      </div>

      {/* Thinking window */}
      {progress.thinking_content && (
        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 max-h-32 overflow-y-auto">
          <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap break-words leading-relaxed">
            {progress.thinking_content.slice(-500)}
          </p>
        </div>
      )}
    </div>
  );
};
