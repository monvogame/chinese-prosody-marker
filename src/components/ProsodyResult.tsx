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
      await exportToPng(el);
    } catch (e) {
      console.error('Export failed:', e);
      alert(`导出失败：${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  if (!data && !loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        输入文本并点击"开始分析"
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
              className="px-6 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg
                         hover:bg-gray-50 transition-colors"
            >
              重新分析
            </button>
          </div>
        </>
      )}
    </div>
  );
};
