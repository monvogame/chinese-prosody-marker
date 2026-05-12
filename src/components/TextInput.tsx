import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  charCount: number;
}

const PLACEHOLDER = '请输入需要标记的中文文本...\n\n示例：\n夜深了，月光透过窗帘洒在地板上。她轻轻地推开门，走进了那间许久未曾踏入的房间。空气中弥漫着淡淡的灰尘味道，书架上的照片已经泛黄。';

export const TextInput: React.FC<TextInputProps> = ({ value, onChange, disabled, charCount }) => {
  return (
    <div className="w-full">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={PLACEHOLDER}
        rows={8}
        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg resize-y
                   focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                   disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed
                   text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                   bg-white dark:bg-slate-800
                   transition-all duration-200"
        style={{ minHeight: 160, fontSize: 15, lineHeight: 1.8 }}
      />
      <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
        <span>支持任意长度的中文文本</span>
        <span>{charCount} 字</span>
      </div>
    </div>
  );
};
