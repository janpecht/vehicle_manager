import type Konva from 'konva';

export function downloadCanvasAsPng(stage: Konva.Stage, filename: string): void {
  const dataUrl = stage.toDataURL({ pixelRatio: 2 });
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
