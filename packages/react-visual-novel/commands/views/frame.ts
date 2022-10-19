import {cover} from 'intrinsic-scale'
import type {Property} from 'csstype'

export interface Frame {
  viewport: [number, number]
  rect: {
    y: number
    x: number
    width?: number | null
    height?: number | null
    transform?: Property.Transform | null
  }
}

export function styleForFrame(
  ctx: {containerRect: DOMRectReadOnly},
  frame: Frame,
): React.CSSProperties {
  const backgroundResizeInfo = cover(
    ctx.containerRect.width,
    ctx.containerRect.height,
    frame.viewport[0],
    frame.viewport[1],
  )
  const backgroundXScale = backgroundResizeInfo.width / frame.viewport[0]
  const backgroundYScale = backgroundResizeInfo.height / frame.viewport[1]
  const backgroundOffset = backgroundResizeInfo
    ? {x: backgroundResizeInfo.x, y: backgroundResizeInfo.y}
    : {x: 0, y: 0}
  return {
    position: 'absolute',
    left: frame.rect.x * backgroundXScale + backgroundOffset.x,
    top: frame.rect.y * backgroundYScale + backgroundOffset.y,
    ...(frame.rect.width && {
      width: frame.rect.width * backgroundXScale,
    }),
    ...(frame.rect.height && {
      height: frame.rect.height * backgroundYScale,
    }),
    ...(frame.rect.transform && {
      transform: frame.rect.transform,
      transformOrigin: 'top',
    }),
  }
}
