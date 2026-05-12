/**
 * 标记渲染组件
 * 将 ProsodyResult 渲染为带 CSS 标记的 DOM
 */
import React from 'react';
import type {
  ProsodyResult,
  ProsodyParagraph,
  ProsodySentence,
  ProsodyToken,
} from '../types/prosody';
import { getMarksClass, getSentenceClass } from './marks';

interface ProsodyRendererProps {
  data: ProsodyResult;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const ProsodyRenderer: React.FC<ProsodyRendererProps> = ({ data, containerRef }) => {
  return (
    <div
      ref={containerRef}
      className="prosody-result bg-white rounded-lg p-8 space-y-8"
      style={{
        maxWidth: 800,
        fontSize: 16,
        lineHeight: 2.2,
        fontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Serif CJK SC", serif',
      }}
    >
      {data.title && (
        <h2 className="text-2xl font-bold text-center mb-4" style={{ userSelect: 'none' }}>
          {data.title}
        </h2>
      )}

      {data.overall_emotion && (
        <div
          className="text-center text-sm text-gray-500 mb-6"
          style={{ userSelect: 'none' }}
        >
          情绪基调：{data.overall_emotion}
          {data.text_type && ` | ${data.text_type}`}
        </div>
      )}

      {data.paragraphs.map((para) => (
        <ParagraphBlock key={para.paragraph_index} paragraph={para} />
      ))}

      {data.metadata && (
        <div
          className="text-right text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200"
          style={{ userSelect: 'none' }}
        >
          字数：{data.metadata.char_count} · 分析耗时：{(data.metadata.analysis_time_ms / 1000).toFixed(1)}s
          {data.metadata.model && ` · 模型：${data.metadata.model}`}
        </div>
      )}
    </div>
  );
};

const ParagraphBlock: React.FC<{ paragraph: ProsodyParagraph }> = ({ paragraph }) => {
  return (
    <div className="paragraph-block">
      {paragraph.sentences.map((sent) => (
        <SentenceBlock key={sent.sentence_index} sentence={sent} />
      ))}
    </div>
  );
};

const SentenceBlock: React.FC<{ sentence: ProsodySentence }> = ({ sentence }) => {
  const cls = getSentenceClass(sentence.sentence_weight);
  if (!sentence.tokens || sentence.tokens.length === 0) {
    return (
      <span className={cls}>
        {sentence.original_text}
      </span>
    );
  }

  return (
    <span className={cls}>
      {sentence.tokens.map((token, idx) => (
        <TokenSpan key={idx} token={token} />
      ))}
    </span>
  );
};

const TokenSpan: React.FC<{ token: ProsodyToken }> = ({ token }) => {
  const classes = getMarksClass(token.marks);

  return (
    <span className={classes}>
      {token.text}
    </span>
  );
};

export default ProsodyRenderer;
