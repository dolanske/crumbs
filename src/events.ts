import { normalizePath } from './path'
import type { ResolvedRoute, SerializedRoute } from './types/types'

// On navigation (before resolve) callback
type Stopper = () => void
type OnNavigationCb<T = SerializedRoute> = (route: T) => void | boolean | Promise<void | boolean>
type OnNavigationCbFn = OnNavigationCb

export const onPathNavigationCbs: Record<string, Set<OnNavigationCb>> = {}
export const onNavigationCbs = new Set<OnNavigationCb>()

// Runs whenever a route or a specific path has been navigated to. Returns a
// function, which will remove the callback from being ran.
export function onNavigation(path: OnNavigationCbFn): Stopper
export function onNavigation(path: string, cb: OnNavigationCbFn): Stopper
export function onNavigation(path: string | OnNavigationCbFn, cb?: OnNavigationCbFn): Stopper {
  if (typeof path === 'string') {
    if (!cb)
      return () => {}

    const key = normalizePath(path)
    if (!onPathNavigationCbs[key])
      onPathNavigationCbs[key] = new Set()
    onPathNavigationCbs[key].add(cb)
    return () => onPathNavigationCbs[key]?.delete(cb)
  }

  onNavigationCbs.add(path)
  return () => onNavigationCbs.delete(path)
}

// @internal
// Executes all the callbacks for given route. Callbacks may be async and are
// awaited in order. Returns false as soon as one of them returns false.
export async function runOnNavigationCallbacks(route: SerializedRoute): Promise<boolean> {
  const callbacks = [
    ...onNavigationCbs,
    ...(onPathNavigationCbs[route.path] ?? []),
  ]

  for (const cb of callbacks) {
    if (await cb(route) === false)
      return false
  }

  return true
}

/**
 * Runs whenever a route has been resolved. That means the route exists and its loader has successfully fetched data.
 *
 * @param path Route path
 * @param cb Callback
 */

type OnResolveRouteCb = (route: ResolvedRoute) => void

// On route resolve, ran after route has been successfully navigated to
export const onPathRouteResolveCbs: Record<string, Set<OnResolveRouteCb>> = {}
export const onRouteResolveCbs: Set<OnResolveRouteCb> = new Set()

export function onRouteResolve(path: OnResolveRouteCb): Stopper
export function onRouteResolve(path: string, cb: OnResolveRouteCb): Stopper
export function onRouteResolve(path: string | OnResolveRouteCb, cb?: OnResolveRouteCb): Stopper {
  // With path
  if (typeof path === 'string') {
    if (!cb)
      return () => {}

    const key = normalizePath(path)
    if (!onPathRouteResolveCbs[key])
      onPathRouteResolveCbs[key] = new Set()
    onPathRouteResolveCbs[key].add(cb)
    return () => onPathRouteResolveCbs[key]?.delete(cb)
  }

  // Without path
  onRouteResolveCbs.add(path)
  return () => onRouteResolveCbs.delete(path)
}

// @internal
// Executes all the callbacks for given route
export function runOnRouteResolveCallbacks(route: ResolvedRoute): void {
  const callbacks = [
    ...onRouteResolveCbs,
    ...(onPathRouteResolveCbs[route.path] ?? []),
  ]

  for (const cb of callbacks)
    cb(route)
}

// On navigation error
type NavigationErrorCb = (route: SerializedRoute | null, error: any) => void

export const onRoutePathErrorCbs: Record<string, Set<NavigationErrorCb>> = {}
export const onRouteErrorcbs = new Set<NavigationErrorCb>()

export function onRouteError(path: NavigationErrorCb): Stopper
export function onRouteError(path: string, cb: NavigationErrorCb): Stopper
export function onRouteError(path: string | NavigationErrorCb, cb?: NavigationErrorCb): Stopper {
  // With path
  if (typeof path === 'string') {
    if (!cb)
      return () => {}

    const key = normalizePath(path)
    if (!onRoutePathErrorCbs[key])
      onRoutePathErrorCbs[key] = new Set()
    onRoutePathErrorCbs[key].add(cb)
    return () => onRoutePathErrorCbs[key]?.delete(cb)
  }

  // Without path
  onRouteErrorcbs.add(path)
  return () => onRouteErrorcbs.delete(path)
}

// @internal
// Executes all the callbacks for given route
export function runOnRouteErrorCallbacks(route: SerializedRoute | null, error: any): void {
  const callbacks = [
    ...onRouteErrorcbs,
    ...(route ? onRoutePathErrorCbs[route.path] ?? [] : []),
  ]

  for (const cb of callbacks)
    cb(route, error)
}
