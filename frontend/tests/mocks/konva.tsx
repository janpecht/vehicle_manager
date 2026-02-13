import React from 'react';

export const Stage = ({ children, onMouseDown, onMouseUp, ...props }: Record<string, unknown>) => (
  <div
    data-testid="konva-stage"
    data-width={props.width}
    data-height={props.height}
    onMouseDown={onMouseDown as React.MouseEventHandler}
    onMouseUp={onMouseUp as React.MouseEventHandler}
  >
    {children as React.ReactNode}
  </div>
);

export const Layer = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="konva-layer">{children}</div>
);

export const Path = (props: Record<string, unknown>) => (
  <div data-testid="konva-path" data-fill={props.fill} />
);

export const Rect = ({ onClick, ...props }: Record<string, unknown>) => (
  <div
    data-testid="konva-rect"
    data-fill={props.fill}
    data-damage-id={props['data-damage-id'] as string}
    onClick={onClick as React.MouseEventHandler}
  />
);

export const Circle = ({ onClick, ...props }: Record<string, unknown>) => (
  <div
    data-testid="konva-circle"
    data-fill={props.fill}
    data-damage-id={props['data-damage-id'] as string}
    onClick={onClick as React.MouseEventHandler}
  />
);

export const Image = (props: Record<string, unknown>) => (
  <div data-testid="konva-image" data-width={props.width} data-height={props.height} />
);
