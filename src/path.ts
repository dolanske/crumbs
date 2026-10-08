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

// Base path the application is served from, eg. `/my-repo` on GitHub pages.
// Stored without a trailing slash, the root base is an empty string.
let base = ''

export function normalizeBase(value: string = ''): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}` : ''
}

export function setBase(value?: string): void {
  base = normalizeBase(value)
}

export function getBase(): string {
  return base
}

// Removes the base from a browser pathname, returning the app path. Returns
// null when the pathname lies outside of the base.
export function stripBase(pathname: string): string | null {
  if (!base)
    return pathname
  if (pathname === base)
    return '/'
  if (pathname.startsWith(`${base}/`))
    return pathname.slice(base.length)
  return null
}

// Prefixes an app path (which may include query and hash) with the base
export function withBase(path: string): string {
  return base ? base + path : path
}

// Current location relative to the base. Pathnames outside of the base are
// returned as they are.
export function currentLocation(): string {
  const pathname = stripBase(location.pathname) ?? location.pathname
  return pathname + location.search + location.hash
}
