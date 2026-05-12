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

      {(data.overall_emotion || data.overall_tone) && (
        <div
          className="text-center text-sm text-gray-500 mb-6"
          style={{ userSelect: 'none' }}
        >
          {data.overall_tone
            ? `整体基调：${data.overall_tone}`
            : `情绪基调：${data.overall_emotion}`
          }
          {data.text_type && ` | ${data.text_type}`}
          {data.purpose && ` | 目的：${data.purpose}`}
        </div>
      )}

      {data.imagery && (
        <div className="text-center text-xs text-gray-400 mb-4" style={{ userSelect: 'none' }}>
          形象：{data.imagery}
        </div>
      )}

      {data.directive_response?.understood_directive && (
        <div className="text-center text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded px-3 py-2 mb-4" style={{ userSelect: 'none' }}>
          <span className="font-medium">引导响应：</span>
          {data.directive_response.understood_directive}
          {data.directive_response.focus_character && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              聚焦：{data.directive_response.focus_character}
            </span>
          )}
          {data.directive_response.audience && (
            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
              受众：{data.directive_response.audience}
            </span>
          )}
        </div>
      )}

      {data.key_emotions && data.key_emotions.length > 0 && (
        <div className="text-center text-xs text-gray-400 mb-4 flex justify-center gap-2" style={{ userSelect: 'none' }}>
          {data.key_emotions.map((e, i) => (
            <span key={i} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{e}</span>
          ))}
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
      {(paragraph.summary || paragraph.rhythm_type || paragraph.identity_sense) && (
        <div className="text-xs text-gray-400 mb-2 flex gap-3" style={{ userSelect: 'none' }}>
          {paragraph.summary && <span>{paragraph.summary}</span>}
          {paragraph.rhythm_type && <span className="text-purple-600">节奏：{paragraph.rhythm_type}</span>}
          {paragraph.identity_sense && <span className="text-orange-600">{paragraph.identity_sense}</span>}
        </div>
      )}
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
