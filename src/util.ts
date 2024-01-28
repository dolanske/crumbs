/**
 * Execute given callback on the next browser repaint. It also returns a
 * promise, so instead of a callback, it can be awaited.
 *
 * @param callback
 * @returns Promise
 */
export function nextTick(callback?: () => void) {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      if (callback)
        callback()
      resolve(true)
    })
  })
}
