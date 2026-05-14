import React, { useEffect, useRef } from 'react';

const POOL = [
  '韵', '律', '声', '调', '轻', '重', '缓', '急', '停', '连',
  '气', '息', '吐', '字', '归', '音', '平', '仄', '抑', '扬',
  '顿', '挫', '朗', '读', '诵', '吟', '咏', '叹', '诗', '词',
  '文', '章', '情', '感', '节', '奏', '语', '言', '风', '骨',
  '清', '浊', '虚', '实', '刚', '柔', '高', '低', '强', '弱',
  '内', '外', '张', '弛', '开', '合', '起', '伏', '云', '水',
  '山', '月', '花', '鸟', '风', '雪', '春', '秋', '梦', '远',
];

interface CharItem {
  id: number;
  char: string;
  depth: 'near' | 'mid' | 'far';
  left: number;
  top: number;
  baseY: number;
  animDuration: number;
  animDelay: number;
  strength: number;
}

function generateChars(count: number): CharItem[] {
  const items: CharItem[] = [];
  for (let i = 0; i < count; i++) {
    const depthRand = Math.random();
    let depth: CharItem['depth'];
    let strength: number;
    if (depthRand < 0.25) {
      depth = 'near'; strength = 25;
    } else if (depthRand < 0.6) {
      depth = 'mid'; strength = 12;
    } else {
      depth = 'far'; strength = 6;
    }
    items.push({
      id: i,
      char: POOL[Math.floor(Math.random() * POOL.length)],
      depth,
      left: Math.random() * 100,
      top: Math.random() * 100,
      baseY: 0,
      animDuration: 3 + Math.random() * 6,
      animDelay: Math.random() * 5,
      strength,
    });
  }
  return items;
}

export const FloatingChars: React.FC = () => {
  const charsRef = useRef<CharItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Map<number, HTMLSpanElement>>(new Map());
  const rafRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number; inside: boolean }>({ x: -999, y: -999, inside: false });

  // 生成字符
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 20 : window.innerWidth < 1024 ? 35 : 50;
    charsRef.current = generateChars(count);
    containerRef.current?.replaceChildren();

    charsRef.current.forEach((item) => {
      const span = document.createElement('span');
      span.className = `floating-char ${item.depth}`;
      span.textContent = item.char;
      span.style.left = `${item.left}%`;
      span.style.top = `${item.top}%`;
      span.style.animation = `char-float-${item.depth} ${item.animDuration}s ${item.animDelay}s ease-in-out infinite`;
      span.dataset.strength = String(item.strength);
      containerRef.current?.appendChild(span);
      elementsRef.current.set(item.id, span);
    });

    return () => {
      elementsRef.current.clear();
    };
  }, []);

  // 鼠标跟随
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, inside: true };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -999, y: -999, inside: false };
    };

    const animate = () => {
      const { x: mx, y: my, inside } = mouseRef.current;

      elementsRef.current.forEach((el) => {
        if (!inside) {
          el.style.transform = 'translate3d(0, 0, 0)';
          return;
        }
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 350;
        if (dist < maxDist) {
          const strength = parseFloat(el.dataset.strength || '10');
          const force = (maxDist - dist) / maxDist;
          const offsetX = (dx / dist) * strength * force;
          const offsetY = (dy / dist) * strength * force;
          el.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
        } else {
          el.style.transform = 'translate3d(0, 0, 0)';
        }
      });
      rafRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <div ref={containerRef} className="floating-chars-layer" />;
};
