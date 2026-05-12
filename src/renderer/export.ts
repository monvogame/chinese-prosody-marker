/**
 * html2canvas 导出逻辑
 */
import html2canvas from 'html2canvas';

export async function exportToPng(
  element: HTMLElement,
  filename: string = 'prosody-result.png',
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
