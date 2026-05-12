import React, { useRef } from 'react';
import type { ProsodyResult as ProsodyResultType } from '../types/prosody';
import { ProsodyRenderer } from '../renderer/ProsodyRenderer';
import { exportToPng } from '../renderer/export';

interface ProsodyResultProps {
  data: ProsodyResultType | null;
  loading: boolean;
  onRetry: () => void;
}

export const ProsodyResultPanel: React.FC<ProsodyResultProps> = ({
  data,
  loading,
  onRetry,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleExport = async () => {
    const el = containerRef.current;
    if (!el) {
      alert('渲染区域未就绪，请稍后重试');
      return;
    }
    try {
      // 从分析结果中取文章前几个字作为文件名
      let prefix = '未命名';
      if (data?.paragraphs?.[0]?.sentences?.[0]?.original_text) {
        const raw = data.paragraphs[0].sentences[0].original_text.replace(/[，。！？；：""''、…—～·\s,.;:?!\"'…~\-()（）《》<>「」『』【】]/g, '');
        prefix = raw.slice(0, 8);
      }
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const filename = `【韵律】${prefix} ${timestamp}.png`;
      await exportToPng(el, filename);
    } catch (e) {
      console.error('Export failed:', e);
      alert(`导出失败：${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  if (!data && !loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
        输入文本并点击"开始分析"
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="max-h-[70vh] overflow-y-auto">
              <ProsodyRenderer data={data} containerRef={containerRef as React.RefObject<HTMLDivElement>} />
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleExport}
              className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg
                         hover:bg-blue-700 transition-colors shadow-sm"
            >
              保存为图片
            </button>
            <button
              onClick={onRetry}
              className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg
                         hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              重新分析
            </button>
          </div>
        </>
      )}
    </div>
  );
};
