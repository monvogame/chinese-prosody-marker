import React, { useState } from 'react';

interface DirectiveInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const PRESETS: Record<string, string> = {
  "角色聚焦": "请只分析并输出角色「」的台词。其他角色和旁白仅作为上下文参考，不在最终结果中展示。",
  "自媒体口播": "这是一段自媒体口播文案，受众是18-35岁的互联网用户。风格要求：自然口语化，节奏明快，重音突出关键信息，适当使用停顿制造悬念或强调。避免播音腔。",
  "有声书": "这是有声书/小说演播内容。要求：区分旁白和人物对话，旁白用第三人称叙述感，人物台词要有角色代入感。注意情景再现和画面感。",
  "配音": "这是影视配音台词。要求：贴合角色性格和情境，注意口型节奏，情感要到位但不过度。",
  "播音": "这是新闻/专题播音稿。要求：规范、庄重、清晰，语速适中，重音准确，停连符合逻辑。",
  "鬼畜/恶搞": "这是网络鬼畜/恶搞风格的文本。要求：夸张的重音和停顿，戏剧化的语调变化，大胆的气息标记，可以突破常规的停连规则。",
};

export const DirectiveInput: React.FC<DirectiveInputProps> = ({ value, onChange, disabled }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full">
      {/* 折叠头部 */}
      <button
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
        className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors py-1"
      >
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="currentColor" viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span>引导描述 {value ? `（已填写）` : ''}</span>
        <span className="text-gray-400">— 角色聚焦、风格引导、场景补充</span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {/* 快捷标签 */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PRESETS).map(([label, text]) => (
              <button
                key={label}
                onClick={() => onChange(text)}
                disabled={disabled}
                className="px-2 py-1 text-xs rounded-full border border-gray-300 dark:border-slate-600
                           text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800
                           hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {label}
              </button>
            ))}
          </div>

          {/* 输入框 */}
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="例如：只标记林黛玉的台词、用B站鬼畜风格、这是角色临终前的独白..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg resize-y
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                       disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed
                       text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                       bg-white dark:bg-slate-800
                       transition-all duration-200"
          />
        </div>
      )}
    </div>
  );
};
