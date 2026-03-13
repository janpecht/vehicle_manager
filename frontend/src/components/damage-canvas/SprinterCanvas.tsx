import type React from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Path, Rect, Circle, Image as KonvaImage } from 'react-konva';
import { getSprinterView, type ViewSide } from './sprinterSvgPaths.ts';
import type { DamageMarking, CanvasTool } from '../../types/damage.ts';
import { SEVERITY_COLORS } from '../../types/damage.ts';
import type Konva from 'konva';

/** Hook to load an HTMLImageElement from a URL */
function useImage(url: string | undefined): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = url;
  }, [url]);

  return image;
}

/** Minimum relative size (if drag is smaller, use this as default) */
const MIN_SIZE = 0.03;

interface SprinterCanvasProps {
  viewSide: ViewSide;
  damages?: DamageMarking[];
  activeTool?: CanvasTool;
  selectedDamageId?: string | null;
  stageRef?: React.RefObject<Konva.Stage | null>;
  /** URL for a custom background image (replaces the default SVG silhouette). */
  backgroundImageUrl?: string;
  /** Called when user finishes drawing a shape (drag-to-size or click). */
  onCanvasDraw?: (relX: number, relY: number, relW: number, relH: number) => void;
  /** @deprecated Use onCanvasDraw instead. Kept for backwards compat (report views). */
  onCanvasClick?: (relX: number, relY: number) => void;
  onDamageClick?: (damage: DamageMarking) => void;
  /** Called when a damage marker is dragged to a new position. */
  onDamageMove?: (damageId: string, relX: number, relY: number) => void;
}

interface DrawState {
  /** Relative 0-1 coords of the drag start (one corner) */
  startX: number;
  startY: number;
  /** Relative 0-1 coords of the current pointer (opposite corner) */
  currentX: number;
  currentY: number;
}

export function SprinterCanvas({
  viewSide,
  damages = [],
  activeTool = 'CIRCLE',
  selectedDamageId,
  stageRef,
  backgroundImageUrl,
  onCanvasDraw,
  onCanvasClick,
  onDamageClick,
  onDamageMove,
}: SprinterCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [drawState, setDrawState] = useState<DrawState | null>(null);

  const bgImage = useImage(backgroundImageUrl);
  const view = getSprinterView(viewSide);

  // When a custom background image is loaded, use its natural aspect ratio
  // to avoid stretching/distortion. The viewBox is adjusted so the image
  // fills it exactly while keeping the same coordinate scale.
  const viewBox = bgImage
    ? { width: bgImage.naturalWidth, height: bgImage.naturalHeight }
    : view.viewBox;
  const aspectRatio = viewBox.width / viewBox.height;

  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const maxHeight = 500;
    let width = containerWidth;
    let height = width / aspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    setDimensions({ width, height });
  }, [aspectRatio]);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  const scale = dimensions.width > 0 ? dimensions.width / viewBox.width : 1;
  const isDrawing = activeTool === 'CIRCLE' || activeTool === 'RECTANGLE';

  function pointerToRel(stage: Konva.Stage): { relX: number; relY: number } | null {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return {
      relX: Math.max(0, Math.min(1, pointer.x / scale / viewBox.width)),
      relY: Math.max(0, Math.min(1, pointer.y / scale / viewBox.height)),
    };
  }

  function handleDrawStart(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = pointerToRel(stage);
    if (!pos) return;

    setDrawState({
      startX: pos.relX,
      startY: pos.relY,
      currentX: pos.relX,
      currentY: pos.relY,
    });
  }

  function handleDrawMove(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (!drawState) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = pointerToRel(stage);
    if (!pos) return;

    setDrawState((prev) =>
      prev ? { ...prev, currentX: pos.relX, currentY: pos.relY } : null,
    );
  }

  function handleDrawEnd() {
    if (!drawState) return;

    const { startX, startY, currentX, currentY } = drawState;
    setDrawState(null);

    let relW = Math.abs(currentX - startX);
    let relH = Math.abs(currentY - startY);
    let centerX: number;
    let centerY: number;

    // If drag was very small (just a click), use minimum size
    if (relW < MIN_SIZE && relH < MIN_SIZE) {
      relW = MIN_SIZE;
      relH = MIN_SIZE;
      centerX = startX;
      centerY = startY;
    } else {
      // For circles: use the larger dimension for both
      if (activeTool === 'CIRCLE') {
        const maxDim = Math.max(relW, relH);
        relW = maxDim;
        relH = maxDim;
      }
      centerX = (startX + currentX) / 2;
      centerY = (startY + currentY) / 2;
    }

    if (onCanvasDraw) {
      onCanvasDraw(centerX, centerY, relW, relH);
    } else if (onCanvasClick) {
      onCanvasClick(centerX, centerY);
    }
  }

  const canDrag = !!onDamageMove;

  function handleDamagePointer(damage: DamageMarking, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    e.cancelBubble = true;
    onDamageClick?.(damage);
  }

  function handleDamageDragEnd(damage: DamageMarking, e: Konva.KonvaEventObject<DragEvent>) {
    if (!onDamageMove) return;
    const node = e.target;

    // node position is in viewBox coords; for rects it's the top-left corner
    let absX = node.x();
    let absY = node.y();

    // Rectangles are positioned at top-left, convert to center
    if (damage.shape === 'RECTANGLE') {
      const absW = damage.width * viewBox.width;
      const absH = damage.height * viewBox.height;
      absX += absW / 2;
      absY += absH / 2;
    }

    const relX = Math.max(0, Math.min(1, absX / viewBox.width));
    const relY = Math.max(0, Math.min(1, absY / viewBox.height));
    onDamageMove(damage.id, relX, relY);
  }

  // Compute preview shape geometry in viewBox coordinates
  function getPreviewGeometry() {
    if (!drawState) return null;

    const { startX, startY, currentX, currentY } = drawState;
    let relW = Math.abs(currentX - startX);
    let relH = Math.abs(currentY - startY);

    if (activeTool === 'CIRCLE') {
      const maxDim = Math.max(relW, relH);
      relW = maxDim;
      relH = maxDim;
    }

    const centerX = (startX + currentX) / 2;
    const centerY = (startY + currentY) / 2;

    return {
      absX: centerX * viewBox.width,
      absY: centerY * viewBox.height,
      absW: Math.max(relW, 0.005) * viewBox.width,
      absH: Math.max(relH, 0.005) * viewBox.height,
    };
  }

  const preview = getPreviewGeometry();

  return (
    <div
      ref={containerRef}
      className="flex justify-center"
      style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
    >
      {dimensions.width > 0 && (
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={handleDrawStart}
          onTouchStart={handleDrawStart}
          onMouseMove={handleDrawMove}
          onTouchMove={handleDrawMove}
          onMouseUp={handleDrawEnd}
          onTouchEnd={handleDrawEnd}
        >
          <Layer>
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={viewBox.width}
              height={viewBox.height}
              fill="#f0f4f8"
            />

            {bgImage ? (
              /* Custom background image from vehicle type */
              <KonvaImage
                image={bgImage}
                x={0}
                y={0}
                width={viewBox.width}
                height={viewBox.height}
              />
            ) : (
              <>
                {/* Default SVG van body */}
                <Path data={view.bodyPath} fill="#d1d5db" stroke="#6b7280" strokeWidth={2} />

                {/* Detail elements */}
                {view.details.map((detail, i) => (
                  <Path
                    key={i}
                    data={detail.path}
                    fill={detail.fill ?? 'none'}
                    stroke={detail.stroke ?? 'none'}
                    strokeWidth={detail.stroke ? 1.5 : 0}
                  />
                ))}
              </>
            )}
          </Layer>

          {/* Damage markers layer */}
          <Layer>
            {damages.map((damage) => {
              const color = SEVERITY_COLORS[damage.severity];
              const isSelected = damage.id === selectedDamageId;
              const isRepaired = !damage.isActive;
              const fillColor = isRepaired ? 'transparent' : color;
              const opacity = isRepaired ? 1 : 0.5;
              const dash = isRepaired ? [6, 4] : undefined;
              const strokeColor = isSelected ? '#000000' : color;
              const strokeW = isSelected ? 2 : isRepaired ? 2 : 1;
              const absX = damage.x * viewBox.width;
              const absY = damage.y * viewBox.height;
              const absW = damage.width * viewBox.width;
              const absH = damage.height * viewBox.height;

              if (damage.shape === 'CIRCLE') {
                const radius = Math.max(absW, absH) / 2;
                return (
                  <Circle
                    key={damage.id}
                    x={absX}
                    y={absY}
                    radius={radius}
                    fill={fillColor}
                    opacity={opacity}
                    stroke={strokeColor}
                    strokeWidth={strokeW}
                    dash={dash}
                    draggable={canDrag}
                    onClick={(e) => handleDamagePointer(damage, e)}
                    onTap={(e) => handleDamagePointer(damage, e)}
                    onDragEnd={(e) => handleDamageDragEnd(damage, e)}
                    data-damage-id={damage.id}
                  />
                );
              }

              return (
                <Rect
                  key={damage.id}
                  x={absX - absW / 2}
                  y={absY - absH / 2}
                  width={absW}
                  height={absH}
                  fill={fillColor}
                  opacity={opacity}
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  dash={dash}
                  draggable={canDrag}
                  onClick={(e) => handleDamagePointer(damage, e)}
                  onTap={(e) => handleDamagePointer(damage, e)}
                  onDragEnd={(e) => handleDamageDragEnd(damage, e)}
                  data-damage-id={damage.id}
                />
              );
            })}

            {/* Draw preview */}
            {preview && activeTool === 'CIRCLE' && (
              <Circle
                x={preview.absX}
                y={preview.absY}
                radius={Math.max(preview.absW, preview.absH) / 2}
                fill="#3b82f6"
                opacity={0.3}
                stroke="#3b82f6"
                strokeWidth={2}
                dash={[6, 3]}
                listening={false}
              />
            )}
            {preview && activeTool === 'RECTANGLE' && (
              <Rect
                x={preview.absX - preview.absW / 2}
                y={preview.absY - preview.absH / 2}
                width={preview.absW}
                height={preview.absH}
                fill="#3b82f6"
                opacity={0.3}
                stroke="#3b82f6"
                strokeWidth={2}
                dash={[6, 3]}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
