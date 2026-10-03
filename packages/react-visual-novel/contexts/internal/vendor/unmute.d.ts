// NOTE: This declaration describes the retained vendor helper without
// changing its playback behavior or source bytes.
export function unmute(
  context: AudioContext,
  allowBackgroundPlayback?: boolean,
  forceIOSBehavior?: boolean,
): { dispose: () => void };
