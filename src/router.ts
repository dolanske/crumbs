import { onNavigation, onNavigationCbs, onPathNavigationCbs, onPathRouteResolveCbs, onRouteError, onRouteErrorcbs, onRoutePathErrorCbs, onRouteResolve, onRouteResolveCbs, runOnNavigationCallbacks, runOnRouteErrorCallbacks, runOnRouteResolveCallbacks } from './events'
import { createModuleUrl } from './page-module-url'
import { extractScript, getPageRootElements, parseToHtml } from './parse'
import { currentLocation, decodeSegment, getBase, isDynamic, normalizePath, setBase, stripBase, withBase } from './path'
import { findRoute, isMatching, matchRoute } from './route'
import type { PageModule, PageMount, Provide } from './types/mount'
import type { ShallowReadonly } from './types/type-helpers'
import type { HistoryState, NavigateOptions, ResolvedPathOptions, ResolvedRoute, Route, Router, RouterOptions, SerializedRoute } from './types/types'

let __baseRouter: Router = {}
let __globalProvide: Provide = {}
let routes: SerializedRoute[] = []
let rootSelector: string = ''
let currentRoute: null | ResolvedRoute = null
let currentPageModule: PageModule | null = null
let running = false

// Incremented on every navigation. A navigation whose id is no longer the
// latest one has been superseded and must not touch the DOM or history.
let navigationId = 0

// Returns the current active route
function getRoute(): Readonly<ResolvedRoute> | null {
  return currentRoute
}

// Creates router by serializing all the provided routes

function defineRouter(definitions: Router, options: RouterOptions = {}) {
  if (running)
    stop()

  __globalProvide = Object.freeze(options.provide ?? {})
  setBase(options.base)
  __baseRouter = Object.freeze(definitions)

  routes = Object.entries(definitions).map(([path, route]) => {
    const base = typeof route === 'string' ? { html: route } : route

    return {
      ...base,
      path: normalizePath(path),
      renderedHtml: null,
      module: null,
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
  currentPageModule?.unmount?.()
  currentPageModule = null
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

// Any <a link> element anywhere in the document navigates through the router,
// provided the click is a plain left click, the link is same-origin and it
// matches a route.
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

  // Links may point inside the base (`/my-repo/users`) or be written relative
  // to the app (`/users`)
  const pathname = stripBase(url.pathname) ?? url.pathname

  // Only navigate if link is actually matching, otherwise let the browser
  // handle it
  if (!matchRoute(routes, pathname))
    return

  event.preventDefault()
  navigate(pathname + url.search + url.hash).catch(() => {})
}

// @internal
// Find the default route path
function getDefaultRoute(routes: SerializedRoute[]): string {
  // 1. The current URL matches a route
  const pathname = stripBase(location.pathname)
  if (pathname !== null && matchRoute(routes, pathname))
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

    route = findRoute(routes, { path: sourcePath })
    if (!route)
      throw new Error('Invalid path. Could not match route.')

    // Extract script + return script-less html back for parsing
    const { html, script } = extractScript(route.html)
    // route.html = html
    let renderedHtml = parseToHtml(html)

    // Check if we should proceed with navigation, by checking the page module's
    // `beforeLeave` and also global `onNavigation` callbacks
    let proceed = currentPageModule?.beforeLeave && await currentPageModule.beforeLeave()
    proceed = await runOnNavigationCallbacks({ ...route, renderedHtml, hash, query, props })
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
      const state: HistoryState = {
        path: finalPath,
        props,
      }

      if (replace || finalPath === currentLocation())
        history.replaceState(state, '', withBase(finalPath))
      else
        history.pushState(state, '', withBase(finalPath))
    }

    // Run current route's unmount hook if available and reset the module
    currentPageModule?.unmount?.()
    currentPageModule = null

    root.replaceChildren(renderedHtml)

    // Now that HTML is rendered, we run the mount logic with referene to the
    // root element and route context
    if (script) {
      const url = createModuleUrl(script)

      try {
        const mod = await import(/* @vite-ignore */ url)

        if (!isLatest())
          return null

        // Warn against using multiple root elements in a .page.html
        const roots = getPageRootElements(root)

        if (roots.length > 1)
          console.warn('Page using a <script> should have only 1 root element. Only the first element will be passed as the root when calling mount()')

        const result = await mod.mount(roots[0], {
          path: resolvedPath,
          data,
          props,
          params,
          query,
          navigate,
          provide: __globalProvide,
        })

        currentPageModule = typeof result === 'function'
          ? { unmount: result }
          : (result ?? null)
      }
      finally {
        URL.revokeObjectURL(url)
      }
    }

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

// @internal
// Stops the router and clears every piece of state, including route
// definitions and callbacks. Intended for tests.
function resetRouter() {
  stop()
  __baseRouter = {}
  __globalProvide = {}
  setBase()
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
  getBase,
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
  type RouterOptions,
  type PageMount,
}
