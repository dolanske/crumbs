// Needs its own file so it can be mocked in tests since Blob is not available.
// Tests replace this with btoa
export function createModuleUrl(code: string): string {
  const blob = new Blob([code], { type: 'text/javascript' })
  return URL.createObjectURL(blob)
}
