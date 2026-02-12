import type React from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Path, Rect, Circle } from 'react-konva';
import { getSprinterView, type ViewSide } from './sprinterSvgPaths.ts';
import type { DamageMarking, CanvasTool } from '../../types/damage.ts';
import { SEVERITY_COLORS } from '../../types/damage.ts';
import type Konva from 'konva';

interface SprinterCanvasProps {
  viewSide: ViewSide;
  damages?: DamageMarking[];
  activeTool?: CanvasTool;
  selectedDamageId?: string | null;
  stageRef?: React.RefObject<Konva.Stage | null>;
  onCanvasClick?: (relativeX: number, relativeY: number) => void;
  onDamageClick?: (damage: DamageMarking) => void;
}

export function SprinterCanvas({
  viewSide,
  damages = [],
  activeTool = 'POINTER',
  selectedDamageId,
  stageRef,
  onCanvasClick,
  onDamageClick,
}: SprinterCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const view = getSprinterView(viewSide);
  const { viewBox } = view;
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

  function handleStagePointer(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (!isDrawing || !onCanvasClick) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert pixel coords to viewBox coords, then to relative 0-1
    const relX = pointer.x / scale / viewBox.width;
    const relY = pointer.y / scale / viewBox.height;

    onCanvasClick(
      Math.max(0, Math.min(1, relX)),
      Math.max(0, Math.min(1, relY)),
    );
  }

  function handleDamagePointer(damage: DamageMarking, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    e.cancelBubble = true;
    onDamageClick?.(damage);
  }

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
          onClick={handleStagePointer}
          onTap={handleStagePointer}
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

            {/* Van body */}
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
          </Layer>

          {/* Damage markers layer */}
          <Layer>
            {damages.map((damage) => {
              const color = SEVERITY_COLORS[damage.severity];
              const isSelected = damage.id === selectedDamageId;
              const isRepaired = !damage.isActive;
              const opacity = isRepaired ? 0.2 : 0.5;
              const dash = isRepaired ? [4, 4] : undefined;
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
                    fill={color}
                    opacity={opacity}
                    stroke={isSelected ? '#000000' : color}
                    strokeWidth={isSelected ? 2 : 1}
                    dash={dash}
                    onClick={(e) => handleDamagePointer(damage, e)}
                    onTap={(e) => handleDamagePointer(damage, e)}
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
                  fill={color}
                  opacity={opacity}
                  stroke={isSelected ? '#000000' : color}
                  strokeWidth={isSelected ? 2 : 1}
                  dash={dash}
                  onClick={(e) => handleDamagePointer(damage, e)}
                  onTap={(e) => handleDamagePointer(damage, e)}
                  data-damage-id={damage.id}
                />
              );
            })}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
