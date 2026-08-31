/** How many neighbours keep a real <video> (current ± this). */
export const PLAYER_RADIUS = 1;

/** Mount a decoder for the active clip, its neighbours, and wrap-to-first. */
export function wantsPlayer(index: number, activeIndex: number, length: number) {
  if (length <= 0) return false;
  const directDistance = Math.abs(index - activeIndex);
  const circularDistance = Math.min(directDistance, length - directDistance);
  return circularDistance <= PLAYER_RADIUS;
}

/** Next clip in swipe order: the one we preload fully. */
export function isAhead(index: number, activeIndex: number, length: number) {
  if (length <= 1) return false;
  const next = activeIndex === length - 1 ? 0 : activeIndex + 1;
  return index === next;
}

/** Snap index from a vertical feed scroller. */
export function indexFromScroll(scrollTop: number, height: number, length: number) {
  if (height <= 0 || length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, Math.round(scrollTop / height)));
}
