import type { CSSProperties } from "react";

export type Frame = {
  viewport: [number, number];
  rect: {
    y: number;
    x: number;
    width?: number | null;
    height?: number | null;
    transform?: CSSProperties["transform"] | null;
  };
};

export function styleForFrame(
  ctx: { containerRect: DOMRectReadOnly },
  frame: Frame,
): CSSProperties {
  const viewportRatio = frame.viewport[0] / frame.viewport[1];
  const containerRatio = ctx.containerRect.width / ctx.containerRect.height;

  const width =
    viewportRatio < containerRatio
      ? ctx.containerRect.width
      : ctx.containerRect.height * viewportRatio;

  const height =
    viewportRatio < containerRatio
      ? ctx.containerRect.width / viewportRatio
      : ctx.containerRect.height;

  const backgroundXScale = width / frame.viewport[0];
  const backgroundYScale = height / frame.viewport[1];

  const backgroundOffset = {
    x: (ctx.containerRect.width - width) / 2,
    y: (ctx.containerRect.height - height) / 2,
  };

  const style: CSSProperties = {
    position: "absolute",
    left: frame.rect.x * backgroundXScale + backgroundOffset.x,
    top: frame.rect.y * backgroundYScale + backgroundOffset.y,
  };

  if (frame.rect.width != null && frame.rect.width !== 0) {
    style.width = frame.rect.width * backgroundXScale;
  }
  if (frame.rect.height != null && frame.rect.height !== 0) {
    style.height = frame.rect.height * backgroundYScale;
  }
  if (frame.rect.transform != null && frame.rect.transform !== "") {
    style.transform = frame.rect.transform;
    style.transformOrigin = "top";
  }

  return style;
}
