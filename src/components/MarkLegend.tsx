import React from 'react';

const LEGEND_ITEMS = [
  { symbol: '●', label: '重读', color: '#e53e3e', css: 'stress-heavy' },
  { symbol: '轻', label: '轻读', color: '#a0aec0', css: 'stress-light' },
  { symbol: '↑', label: '语调上扬', color: '#ed8936', css: 'tone-up' },
  { symbol: '↓', label: '语调下沉', color: '#4299e1', css: 'tone-down' },
  { symbol: '↗↘', label: '语调曲折', color: '#805ad5', css: 'tone-curve' },
  { symbol: '⌒', label: '连读', color: '#48bb78', css: 'link-next' },
  { symbol: '│', label: '短停顿', color: '#a0aec0', css: 'pause-short' },
  { symbol: '‖', label: '中停顿', color: '#4299e1', css: 'pause-medium' },
  { symbol: '‖‖', label: '长停顿', color: '#2b6cb0', css: 'pause-long' },
  { symbol: '△', label: '吸气', color: '#48bb78', css: 'breath-inhale' },
  { symbol: '▽', label: '呼气/叹气', color: '#ed8936', css: 'breath-exhale' },
  { symbol: '▸◂', label: '渐强', color: '#e53e3e', css: 'volume-crescendo' },
  { symbol: '◂▸', label: '渐弱', color: '#e53e3e', css: 'volume-decrescendo' },
  { symbol: '·', label: '轻声', color: '#805ad5', css: 'neutral-tone' },
  { symbol: 'ʴ', label: '儿化', color: '#dd6b20', css: 'erhua' },
  { symbol: '≈', label: '语速加快', color: '#e53e3e', css: 'speed-faster' },
  { symbol: '…', label: '语速减慢', color: '#4299e1', css: 'speed-slower' },
];

export const MarkLegend: React.FC = () => {
  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        标记符号说明
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {LEGEND_ITEMS.map((item) => (
          <div
            key={item.css}
            className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"
          >
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold"
              style={{ color: item.color, backgroundColor: `${item.color}15` }}
            >
              {item.symbol}
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
