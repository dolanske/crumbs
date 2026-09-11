import type { ShallowReadonly } from './type-helpers'

// Initial user input
interface Route {
  title?: string
  html: string | Element
  // Fallback should be used together with loader, to display error state
  fallback?: string | Element
  // Declared as a method on purpose: method parameters are checked
  // bivariantly, so loaders typed with a narrower params shape such as
  // `({ id }: { id: string })` are accepted.
  // eslint-disable-next-line ts/method-signature-style
  loader?(params: Record<string, string>): Promise<any>
  default?: boolean
  meta?: Record<string, any>
}

type RenderedHtml = Element | DocumentFragment

// Serialized route after router has been initialized
interface SerializedRoute extends Route {
  path: string
  renderedHtml: RenderedHtml | null
  hash: string
  query: Record<string, string>
  props: Record<string, any>
}

// The currently active route
interface ResolvedRoute extends Route {
  path: string
  renderedHtml: RenderedHtml
  resolvedPath: string
  params: Record<string, string>
  data: any
  hash: string
  query: Record<string, string>
  props: Record<string, any>
}

// Shape of the object stored in `history.state` for every entry the router
// creates. Entries the router did not create (for example the very first one)
// have a `null` state.
interface HistoryState {
  path: string
  props: Record<string, any>
}

type Router = Record<string, Route | string>

let __baseRouter: Router = {}
let routes: SerializedRoute[] = []
let rootSelector: string = ''
let currentRoute: null | ResolvedRoute = null
let running = false

// Incremented on every navigation. A navigation whose id is no longer the
// latest one has been superseded and must not touch the DOM or history.
let navigationId = 0

// Returns the current active route
function getRoute(): Readonly<ResolvedRoute> | null {
  return currentRoute
}

// Creates router by serializing all the provided routes
function defineRouter(definitions: Router) {
  if (running)
    stop()

  __baseRouter = Object.freeze(definitions)

  routes = Object.entries(definitions).map(([path, route]) => {
    const base = typeof route === 'string' ? { html: route } : route

    return {
      ...base,
      path: normalizePath(path),
      renderedHtml: null,
      query: {},
      hash: '',
      props: {},
      meta: base.meta ?? {},
    }
  })

  return {
    /**
     * Start the router. Resolves once the initial route has been rendered (or
     * failed to render, in which case `onRouteError` has been called).
     *
     * @param selector DOM selector
     */
    run: (selector: string) => {
      if (running)
        stop()

      rootSelector = selector
      // Validate the root early, so a wrong selector fails loudly on startup
      getRouterRoot()

      running = true
      window.addEventListener('popstate', popstateHandler)
      document.addEventListener('click', clickHandler)

      // The initial navigation replaces the current history entry instead of
      // pushing a new one. Otherwise the entry that existed before the router
      // started would remain, without any state, and pressing Back would land
      // on it.
      return navigate(getDefaultRoute(routes), { replace: true }).catch(() => null)
    },
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop,
  }
}

// @internal
// Stops the router and resets its runtime state. Route definitions and
// registered callbacks are kept.
function stop() {
  running = false
  rootSelector = ''
  currentRoute = null
  navigationId++
  window.removeEventListener('popstate', popstateHandler)
  document.removeEventListener('click', clickHandler)
}

// @internal
// Executes whenever user uses the browser native navigation
function popstateHandler(event: PopStateEvent) {
  const state = event.state as HistoryState | null
  // Entries which were not created by the router carry no state. Fall back to
  // whatever the address bar says.
  const path = state?.path ?? currentLocation()
  // Props are the only object not being saved in the path itself, so pass
  // them manually here
  navigate(path, { props: state?.props ?? {}, isPopState: true }).catch(() => {})
}

// @internal
// Delegated click handler. Any <a link> element anywhere in the document
// navigates through the router instead of reloading the page, provided the
// click is a plain left click, the link is same-origin and it matches a route.
function clickHandler(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0)
    return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return

  const target = event.target as Element | null
  const link = target?.closest?.('a[link]')
  if (!link)
    return

  const href = link.getAttribute('href')
  if (!href)
    return

  const linkTarget = link.getAttribute('target')
  if (linkTarget && linkTarget !== '_self')
    return

  const url = new URL(href, location.href)
  if (url.origin !== location.origin)
    return

  // Only navigate if link is actually matching, otherwise let the browser
  // handle it
  if (!matchRoute(routes, url.pathname))
    return

  event.preventDefault()
  navigate(url.pathname + url.search + url.hash).catch(() => {})
}

// @internal
function currentLocation(): string {
  return location.pathname + location.search + location.hash
}

// @internal
// Find the default route path
function getDefaultRoute(routes: SerializedRoute[]): string {
  // 1. The current URL matches a route
  if (matchRoute(routes, location.pathname))
    return currentLocation()

  // 2. Look for `default` or `/` route
  const explicit = routes.find(r => r.default || r.path === '/')
  if (explicit)
    return explicit.path

  // 3. Pick the shortest static route. Sort a copy, so the lookup order of the
  // route table is not changed.
  const shortest = routes
    .filter(r => !isDynamic(r.path))
    .sort((a, b) => a.path.length - b.path.length)[0]
  if (shortest)
    return shortest.path

  throw new Error('No default route found. Please define one by settings its path to `/` or adding the `default` property to the route definitions. Note, it is not possible to set dynamic routes as default routes.')
}

// @internal
// Converts string template into a piece of DOM. A template with a single root
// element yields that element, anything else yields a DocumentFragment
// containing every parsed node.
function parseToHtml(template: string | Element): RenderedHtml {
  if (template instanceof Element)
    return template

  const tpl = document.createElement('template')
  tpl.innerHTML = template
  const content = tpl.content

  const meaningful = Array.from(content.childNodes).filter((node) => {
    if (node.nodeType === Node.ELEMENT_NODE)
      return true
    return node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0
  })

  if (meaningful.length === 1 && meaningful[0].nodeType === Node.ELEMENT_NODE)
    return meaningful[0] as Element

  return content
}

// Returns the router root dom node, or crashes (as it should)
function getRouterRoot(): Element {
  if (!rootSelector)
    throw new Error('No root selector found. Did you start the router?')
  const root = document.querySelector(rootSelector)
  if (!root)
    throw new Error('Invalid root node selector. Please select a valid HTML element.')
  return root
}

function getRouterConfig() {
  return __baseRouter as ShallowReadonly<Router>
}

type FindRouteOptions = Record<'path', string> | Record<'title', string> | Record<'startsWith', string> | Record<'html', string> | Record<'renderedHtml', Element>

/**
 * Find a route based on some of its properties.
 *
 * @param option An object with a single property
 * @returns SerializedRoute | undefined
 */
function findRoute(option: FindRouteOptions): SerializedRoute | undefined {
  const [key, value] = Object.entries(option)[0]

  return routes.find((r) => {
    switch (key) {
      case 'path':
        return r.path === normalizePath(value as string)

      case 'html':
      case 'title':
        return r[key] === value

      case 'startsWith':
        return r.path.startsWith(value as string)

      case 'renderedHtml':
        return r.renderedHtml?.isEqualNode(value as Element) ?? false

      default:
        return false
    }
  })
}

// @internal
// Removes a trailing slash (except for the root path), so `/users/` and
// `/users` are treated as the same route.
function normalizePath(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}

// @internal
// Splits a path (or a full URL) into its normalized pathname segments
function splitPath(path: string): string[] {
  return normalizePath(new URL(path, location.origin).pathname).split('/')
}

// @internal
function isDynamic(path: string): boolean {
  return path.split('/').some(segment => segment.startsWith(':'))
}

// @internal
function countDynamicSegments(path: string): number {
  return path.split('/').filter(segment => segment.startsWith(':')).length
}

/**
 * Checks whether two paths are matching. A path is matching, if its dynamic
 * parameter definitions are that of a path, which has them replaced with actual
 * values.
 *
 * For example `/main/users/:id` should match with `/main/users/10` and so on.
 * Both paths must have the same amount of segments and dynamic segments must
 * be filled with a non-empty value.
 *
 * @param sourcePath The originally defined path. Containing dynamic parameters as `/:param`
 * @param pathWithValues The actual path used when navigating
 * @returns boolean
 */
function isMatching(sourcePath: string, pathWithValues: string): boolean {
  const sourceSplit = splitPath(sourcePath)
  const valuesSplit = splitPath(pathWithValues)

  if (sourceSplit.length !== valuesSplit.length)
    return false

  return sourceSplit.every((segment, index) => {
    if (segment.startsWith(':'))
      return valuesSplit[index].length > 0
    return segment === valuesSplit[index]
  })
}

// @internal
// Finds the best matching route for a pathname. Static routes take precedence
// over dynamic ones (`/users/new` wins over `/users/:id`). Between equally
// specific routes, definition order wins.
function matchRoute(routes: SerializedRoute[], pathname: string): SerializedRoute | undefined {
  return routes
    .filter(r => isMatching(r.path, pathname))
    .sort((a, b) => countDynamicSegments(a.path) - countDynamicSegments(b.path))[0]
}

interface ResolvedPathOptions {
  resolvedPath: string
  sourcePath: string
  params: Record<string, string>
  query: Record<string, string>
  hash: string
}

// @internal
// Takes a path, checks if it is matching with any of the defined routes and
// extracts parameters, query and hash from it.
function resolvePath(_path: string, routes: SerializedRoute[]): ResolvedPathOptions {
  const url = new URL(_path, location.origin)
  const hash = url.hash.replace(/^#/, '')
  const query = Object.fromEntries(url.searchParams)
  const path = normalizePath(url.pathname)

  // 1. Match current path against an existing route
  const source = matchRoute(routes, path)
  if (!source)
    throw new Error(`No matching route found for the path "${path}"`)

  // 2. Extract parameters into an object
  // /main/users/:id means we want an object with { id: <value> } which is extracted from /main/users/10
  const sourceSplit = source.path.split('/')
  const pathSplit = path.split('/')
  const params: Record<string, string> = {}

  for (let index = 0; index < sourceSplit.length; index++) {
    const sourceSegment = sourceSplit[index]
    if (!sourceSegment.startsWith(':'))
      continue

    params[sourceSegment.substring(1)] = decodeSegment(pathSplit[index])
  }

  return {
    resolvedPath: path,
    sourcePath: source.path,
    params,
    hash,
    query,
  }
}

// @internal
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  }
  catch {
    return segment
  }
}

interface NavigateOptions {
  hash?: string | boolean | number
  query?: Record<string, string | number | boolean>
  props?: Record<string, any>
  replace?: boolean
  isPopState?: boolean
}

/**
 * Navigate to the provided path.
 *
 * @param path Path to navigate to
 * @param options {NavigateOptions} Navigation options
 * @returns Promise, which resolves with the route once it has been rendered,
 * with `null` when the navigation was cancelled or superseded by a newer one,
 * and rejects when the navigation failed.
 */
async function navigate(path: string, options: NavigateOptions = {}): Promise<ResolvedRoute | null> {
  const {
    replace = false,
    hash: optionsHash,
    query: optionsQuery,
    props = {},
    isPopState = false,
  } = options

  const id = ++navigationId
  const isLatest = () => id === navigationId

  let route: SerializedRoute | undefined
  let hash = ''
  let query: Record<string, string> = {}

  try {
    if (!running)
      throw new Error('Router is not running. Call `defineRouter(...).run(selector)` first.')

    const resolved = resolvePath(path, routes)
    const { resolvedPath, sourcePath, params } = resolved
    hash = resolved.hash
    query = resolved.query

    // Options provided parameters will overwrite URL's
    if (optionsHash !== undefined)
      hash = optionsHash === false ? '' : String(optionsHash).replace(/^#/, '')
    if (optionsQuery) {
      for (const key of Object.keys(optionsQuery))
        query[key] = String(optionsQuery[key])
    }

    route = findRoute({ path: sourcePath })
    if (!route)
      throw new Error('Invalid path. Could not match route.')

    let renderedHtml = parseToHtml(route.html)

    // onNavigation() callbacks run. If any callback returns false, the
    // navigation is cancelled.
    const proceed = await runOnNavigationCallbacks({ ...route, renderedHtml, hash, query, props })
    if (proceed === false || !isLatest())
      return null

    // Check if loader has data
    let data: any = null
    if (route.loader) {
      try {
        data = await route.loader(params)
      }
      catch (error) {
        if (!route.fallback)
          throw error
        renderedHtml = parseToHtml(route.fallback)
      }

      if (!isLatest())
        return null
    }

    const searchParams = new URLSearchParams(query).toString()
    const finalPath = resolvedPath + (searchParams ? `?${searchParams}` : '') + (hash ? `#${hash}` : '')

    // Rendering and history updates happen together, after the last await, so
    // a superseded navigation can never get this far.
    const root = getRouterRoot()

    currentRoute = Object.freeze({
      ...route,
      path: sourcePath,
      resolvedPath,
      renderedHtml,
      params,
      data,
      hash,
      query,
      props,
    })

    if (!isPopState) {
      // Update the URL. Since props are not part of the url, pass them into the
      // state here. Navigating to the exact same URL replaces the entry, so
      // repeated clicks do not pile up history entries.
      const state: HistoryState = { path: finalPath, props }
      if (replace || finalPath === currentLocation())
        history.replaceState(state, '', finalPath)
      else
        history.pushState(state, '', finalPath)
    }

    root.replaceChildren(renderedHtml)

    // Set document title if it has it
    if (route.title)
      document.title = route.title

    // History API does not scroll to the hash target, so do it manually
    if (hash) {
      const anchor = document.getElementById(hash)
      if (anchor && typeof anchor.scrollIntoView === 'function')
        anchor.scrollIntoView()
    }

    runOnRouteResolveCallbacks(currentRoute)
    return currentRoute
  }
  catch (error) {
    // NOTE: this will not be triggered when navigation into a route was cancelled
    runOnRouteErrorCallbacks(route ? { ...route, hash, query, props } : null, error)
    throw error
  }
}

// On navigation (before resolve) callback
type Stopper = () => void
type OnNavigationCb<T = SerializedRoute> = (route: T) => void | boolean | Promise<void | boolean>
type OnNavigationCbFn = OnNavigationCb

const onPathNavigationCbs: Record<string, Set<OnNavigationCb>> = {}
const onNavigationCbs = new Set<OnNavigationCb>()

// Runs whenever a route or a specific path has been navigated to. Returns a
// function, which will remove the callback from being ran.
function onNavigation(path: OnNavigationCbFn): Stopper
function onNavigation(path: string, cb: OnNavigationCbFn): Stopper
function onNavigation(path: string | OnNavigationCbFn, cb?: OnNavigationCbFn): Stopper {
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
async function runOnNavigationCallbacks(route: SerializedRoute): Promise<boolean> {
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
const onPathRouteResolveCbs: Record<string, Set<OnResolveRouteCb>> = {}
const onRouteResolveCbs: Set<OnResolveRouteCb> = new Set()

function onRouteResolve(path: OnResolveRouteCb): Stopper
function onRouteResolve(path: string, cb: OnResolveRouteCb): Stopper
function onRouteResolve(path: string | OnResolveRouteCb, cb?: OnResolveRouteCb): Stopper {
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
function runOnRouteResolveCallbacks(route: ResolvedRoute): void {
  const callbacks = [
    ...onRouteResolveCbs,
    ...(onPathRouteResolveCbs[route.path] ?? []),
  ]

  for (const cb of callbacks)
    cb(route)
}

// On navigation error
type NavigationErrorCb = (route: SerializedRoute | null, error: any) => void

const onRoutePathErrorCbs: Record<string, Set<NavigationErrorCb>> = {}
const onRouteErrorcbs = new Set<NavigationErrorCb>()

function onRouteError(path: NavigationErrorCb): Stopper
function onRouteError(path: string, cb: NavigationErrorCb): Stopper
function onRouteError(path: string | NavigationErrorCb, cb?: NavigationErrorCb): Stopper {
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
function runOnRouteErrorCallbacks(route: SerializedRoute | null, error: any): void {
  const callbacks = [
    ...onRouteErrorcbs,
    ...(route ? onRoutePathErrorCbs[route.path] ?? [] : []),
  ]

  for (const cb of callbacks)
    cb(route, error)
}

// @internal
// Stops the router and clears every piece of state, including route
// definitions and callbacks. Intended for tests.
function resetRouter() {
  stop()
  __baseRouter = {}
  routes = []
  onNavigationCbs.clear()
  onRouteResolveCbs.clear()
  onRouteErrorcbs.clear()
  for (const store of [onPathNavigationCbs, onPathRouteResolveCbs, onRoutePathErrorCbs]) {
    for (const key of Object.keys(store))
      delete store[key]
  }
}

/////////////////////////////////////////////////////////////////////////

export {
  // Public API
  getRouterConfig,
  defineRouter,
  onRouteResolve,
  onNavigation,
  navigate,
  getRoute,
  getRouterRoot,
  onRouteError,
  findRoute,

  // Internals / methods not really intended for public use
  resolvePath,
  isMatching,
  matchRoute,
  resetRouter,

  // Types
  type SerializedRoute,
  type ResolvedRoute,
  type Route,
  type Router,
  type NavigateOptions,
}
