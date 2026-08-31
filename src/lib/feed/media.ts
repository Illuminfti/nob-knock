/** How many neighbours keep a real <video> (current ± this). */
export const PLAYER_RADIUS = 1;

/** Mount a decoder for the active clip, its neighbours, and wrap-to-first. */
export function wantsPlayer(index: number, activeIndex: number, length: number) {
  if (length <= 0) return false;
  if (Math.abs(index - activeIndex) <= PLAYER_RADIUS) return true;
  // Last clip wraps to the first on skip — keep that decoder warm.
  return activeIndex === length - 1 && index === 0;
}

/** Next clip in swipe order: the one we preload fully. */
export function isAhead(index: number, activeIndex: number, length: number) {
  if (length <= 1) return false;
  const next = activeIndex === length - 1 ? 0 : activeIndex + 1;
  return index === next;
}

