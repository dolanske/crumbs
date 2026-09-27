// Removes a trailing slash (except for the root path), so `/users/` and
// `/users` are treated as the same route.
export function normalizePath(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}

// Splits a path (or a full URL) into its normalized pathname segments
export function splitPath(path: string): string[] {
  return normalizePath(new URL(path, location.origin).pathname).split('/')
}

export function isDynamic(path: string): boolean {
  return path.split('/').some(segment => segment.startsWith(':'))
}

export function countDynamicSegments(path: string): number {
  return path.split('/').filter(segment => segment.startsWith(':')).length
}

export function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  }
  catch {
    return segment
  }
}

export function currentLocation(): string {
  return location.pathname + location.search + location.hash
}
