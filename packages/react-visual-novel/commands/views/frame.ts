import type { Property } from "csstype";
import { cover } from "intrinsic-scale";
import type { CSSProperties } from "react";

export type Frame = {
  viewport: [number, number];
  rect: {
    y: number;
    x: number;
    width?: number | null;
    height?: number | null;
    transform?: Property.Transform | null;
  };
};

export function styleForFrame(
  ctx: { containerRect: DOMRectReadOnly },
  frame: Frame,
): CSSProperties {
  const backgroundResizeInfo = cover(
    ctx.containerRect.width,
    ctx.containerRect.height,
    frame.viewport[0],
    frame.viewport[1],
  );

  const backgroundXScale = backgroundResizeInfo.width / frame.viewport[0];
  const backgroundYScale = backgroundResizeInfo.height / frame.viewport[1];

  const backgroundOffset = {
    x: backgroundResizeInfo.x,
    y: backgroundResizeInfo.y,
  };

  return {
    position: "absolute",
    left: frame.rect.x * backgroundXScale + backgroundOffset.x,
    top: frame.rect.y * backgroundYScale + backgroundOffset.y,
    ...(frame.rect.width != null &&
      frame.rect.width !== 0 && {
        width: frame.rect.width * backgroundXScale,
      }),
    ...(frame.rect.height != null &&
      frame.rect.height !== 0 && {
        height: frame.rect.height * backgroundYScale,
      }),
    ...(frame.rect.transform != null &&
      frame.rect.transform !== "" && {
        transform: frame.rect.transform,
        transformOrigin: "top",
      }),
  };
}
