import type { ShallowReadonly } from './type-helpers'

// Initial user input
interface Route {
  title?: string
  html: string | Element
  // Fallback should be used together with loader, to display error state
  fallback?: string | Element
  loader?: (params: any) => Promise<any>
  default?: boolean
  meta?: Record<string, any>
}

// Serialized route after router has been initialized
interface SerializedRoute extends Route {
  path: string
  renderedHtml: Element | null
  hash: string
  query: Record<string, string>
  props: object
}

// The currently active route
interface ResolvedRoute extends Route {
  path: string
  renderedHtml: Element
  resolvedPath: string
  params?: object
  data: any
  hash: string
  query: Record<string, string>
  props: object
}

// Extend the native PopStateEvent with the properties which will be added when
// users navigate to other pages using built-in browser navigation.
declare interface PopStateEvent {
  state: {
    path: string
    props: object
  }
}

type Router = Record<string, Route | string>

let __baseRouter: Router = {}
let routes: SerializedRoute[] = []
let rootSelector: string = ''
let currentRoute: null | ResolvedRoute

// Stores registered links so they can be unregistered when router stops
const registeredLinks: Array<() => void> = []

// Returns the current active route
function getRoute(): Readonly<ResolvedRoute> | null {
  return currentRoute
}

// Creates router by serializing all the provided routes and
function defineRouter(definitions: Router) {
  __baseRouter = Object.freeze(definitions)

  const serializedRoutes: SerializedRoute[] = Object.entries(definitions).map(([path, route]) => {
    if (typeof route === 'string') {
      return {
        html: route,
        renderedHtml: parseToHtml(route),
        path,
        query: {},
        hash: '',
        props: {},
        meta: {},
      }
    }

    return {
      ...route,
      path,
      renderedHtml: parseToHtml(route.html),
      query: {},
      hash: '',
      props: {},
      meta: route.meta ?? {},
    }
  })

  routes = serializedRoutes

  // Register route listeners. This will execute whenever user uses the browser
  // native navigation
  function popstateHandler(event: PopStateEvent) {
    // Props are the only object not being saved in the path itself, so pass
    // them manually here
    const { path, props } = event.state
    navigate(path, { props, isPopState: true })
  }

  return {
    /**
     * Start the router.
     *
     * @param selector DOM selector
     */
    run: (selector: string) => {
      rootSelector = selector
      window.addEventListener('popstate', popstateHandler)
      registerLinks()
      navigate(getDefaultRoute(serializedRoutes))
    },
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop() {
      window.removeEventListener('popstate', popstateHandler)
      registeredLinks.map(unregister => unregister())
    },
  }
}

// @internal
// Find the  default route path
function getDefaultRoute(routes: SerializedRoute[]): string {
  // Look for `default` or `/` route
  let defaultRoute: SerializedRoute | undefined

  if (routes.find(route => isMatching(route.path, location.pathname)))
    return location.pathname + location.search + location.hash

  defaultRoute = routes.find(r => r.default || r.path === '/')
  if (defaultRoute)
    return defaultRoute.path

  // Pick the shortest route and return its path
  defaultRoute = routes.sort((a, b) => a.path.length - b.path.length)[0]
  if (defaultRoute)
    return defaultRoute.path

  // return ''
  throw new Error('No default route found. Please define one by settings its path to `/` or adding the `default` property to the route definitions. Note, it is not possible to set dynamic routes as default routes.')
}

// @internal
// Converts string template into a piece of DOM
function parseToHtml(template: string | Element): Element {
  if (template instanceof Element)
    return template
  const parser = new DOMParser()
  const raw = parser.parseFromString(template, 'text/html')
  return raw.body.firstElementChild!
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
 * @returns Route | undefined
 */
function findRoute(option: FindRouteOptions): Route | undefined {
  const [key, value] = Object.entries(option)[0]

  return routes.find((r) => {
    switch (key) {
      case 'path':
      case 'html':
      case 'title': {
        return r[key] === value
      }

      case 'startsWith': {
        return r.path.startsWith(value)
      }

      case 'renderedHtml': {
        return r.renderedHtml?.isEqualNode(value)
      }

      default: {
        return null
      }
    }
  })
}

/**
 * Checks wether two paths are matching. A path is matching, if it's dynamic
 * parameter definitions are that of a path, which has them replaced with actual
 * values.
 *
 * For example `/main/users/:id` should match with `/main/users/10` and so on...
 *
 * @param sourcePath The originally defined path. Containing dynamic parameters as `/:param`
 * @param pathWithValues The actual path used when navigating
 * @returns boolean
 *
 */
function isMatching(sourcePath: string, pathWithValues: string): boolean {
  // In case they are the exact same strings
  if (sourcePath === pathWithValues)
    return true

  // Ignore query & search
  sourcePath = new URL(sourcePath, location.origin).pathname
  pathWithValues = new URL(pathWithValues, location.origin).pathname

  const sourceSplit = sourcePath.split('/')
  const valuesSplit = pathWithValues.split('/')

  // Iterate over every source path segment
  return sourceSplit.every((item, index) => {
    // If it's dynamic, we ignore it
    if (item.startsWith(':'))
      return true

    // If it is not dynamic, we compare segment names. We don't need to check
    // lengths, because if they are not matching, this will return false
    return item === valuesSplit[index]
  })
}

interface ResolvedPathOptions {
  resolvedPath: string
  sourcePath: string
  params: object
  query: Record<string, string>
  hash: string
}

// @internal
// Takes a path, check if it is matching with any of the default paths
// Extracts values based on the
function resolvePath(_path: string, routes: SerializedRoute[]): ResolvedPathOptions {
  // 0.
  const url = new URL(_path, location.origin)
  const hash = url.hash
  const query = Object.fromEntries(url.searchParams)
  const path = url.pathname

  // 1. Match current path against an existing route
  const source = routes.find(r => isMatching(r.path, path))
  if (!source)
    throw new Error(`No matching route found for the path "${path}"`)

  // Split them by a path segment
  const sourceSplit = source.path.split('/')
  const pathSplit = path.split('/')
  const params: Record<string, string> = {}

  // 2. Extract parameters into an object
  // /main/users/:id means we want an objet with { id: <value> } which is extracted from /main/users/10
  for (let index = 0; index < sourceSplit.length; index++) {
    const sourceSegment = sourceSplit[index]
    if (!sourceSegment || !sourceSegment.startsWith(':'))
      continue

    const key = sourceSegment.substring(1)
    const value = pathSplit[index]
    params[key] = value
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
 *
 * Registers any <a link> elements within the rendered route. Clicking these
 * links will ignore the default behaviour and instead call `push` on the router
 * instance.
 *
 * @internal
 */
function registerLinks() {
  const root = getRouterRoot()
  const links = root.querySelectorAll('a[link]')

  for (const link of links) {
    const href = link.getAttributeNode('href')?.value
    if (!href)
      continue

    const handler = (href: string) => (event: Event) => {
      event.preventDefault()

      // Only navigate if link is actually matching
      const isMatch = routes.some(r => isMatching(r.path, href))
      if (isMatch)
        navigate(href)
    }

    // When links are garbage collected, event listeners are automatically
    // removed, so this does not need a stopper function.
    link.addEventListener('click', handler(href))
    registeredLinks.push(() => link.removeEventListener('click', handler(href)))
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
 * @returns Promise, which resolves when route has been successfully loaded
 */
async function navigate(path: string, options: NavigateOptions = {}): Promise<ResolvedRoute | null> {
  // Options provided parameters will overwrite URL's
  const {
    replace = false,
    hash: optionsHash,
    query: optionsQuery,
    props = {},
    isPopState = false,
  } = options

  // eslint-disable-next-line no-async-promise-executor
  const navigationHandler = new Promise<ResolvedRoute | null>(async (resolve, reject) => {
    // Resolve path
    let {
      resolvedPath,
      sourcePath,
      params,
      hash,
      query,
    } = resolvePath(path, routes)

    if (optionsHash)
      hash = String(optionsHash)
    if (optionsQuery) {
      for (const key of Object.keys(optionsQuery))
        query[key] = String(optionsQuery[key])
    }

    const route = findRoute({ path: sourcePath })
    if (!route)
      return reject(new Error('Invalid path. Could not match route.'))

    let renderedHtml = parseToHtml(route.html)

    // onNavigation () callback run
    // If callback returns false, the navigation is cancelled
    const result = await runOnNavigationCallbacks({ ...route, path, renderedHtml, hash, query, props })
    if (result === false)
      resolve(null)

    // Check if loader has data
    let data
    if (route.loader) {
      data = await route.loader(params)
        .then(res => res)
        .catch((e) => {
          if (!route.fallback)
            return reject(new Error(e))

          renderedHtml = parseToHtml(route.fallback)
          return null
        })
    }

    // set currentRoute variable
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

    const searchParams = new URLSearchParams(query)
    const queryAppend = searchParams.size > 0 ? `?${searchParams.toString()}` : ''
    // #2 When route is loaded with a hash, a new hash is prepended on every reload
    const finalPath = resolvedPath + queryAppend + (hash ? `${hash.startsWith('#') ? '' : '#'}${hash}` : '')

    if (!isPopState) {
      // Update the URL. Since props are not path of hte url state, pass them into the state here
      if (replace)
        history.replaceState({ path: finalPath, props }, '', finalPath)
      else
        history.pushState({ path: finalPath, props }, '', finalPath)
    }

    // Append route to the root
    const root = getRouterRoot()
    root.replaceChildren(currentRoute.renderedHtml)
    registerLinks()

    // Set document title if it has it
    if (route.title)
      document.title = route.title

    runOnRouteResolveCallbacks(currentRoute)
    resolve(currentRoute)
  })

  // If navigation throws for some reason, run onRouteError callback
  // NOTE: this will not be triggered when navigation into a route was cancelled
  navigationHandler.catch((error) => {
    const route = findRoute({ path })
    if (route) {
      const { sourcePath, hash, query } = resolvePath(path, routes)
      runOnRouteErrorCallbacks({
        ...route,
        path: sourcePath,
        renderedHtml: null,
        hash,
        query,
        props,
      }, error)
    }
    else {
      runOnRouteErrorCallbacks(null, error)
    }
  })

  return navigationHandler
}

// On navigation (before resolve) callback
type Stopper = () => void
type OnNavigationCb<T = SerializedRoute> = (route: T) => void | boolean
type OnNavigationCbFn = (route: SerializedRoute) => void | boolean

const onPathNavigationCbs: Record<string, Set<OnNavigationCb>> = {}
const onNavigationCbs = new Set<OnNavigationCb>()

// Runs whenever a route or a aspecific path has been navigated to. Returns a
// function, which will remove the callback from being ran.
function onNavigation(path: OnNavigationCbFn): Stopper
function onNavigation(path: string, cb: OnNavigationCbFn): Stopper
function onNavigation(path: string | OnNavigationCbFn, cb?: OnNavigationCbFn) {
  if (typeof path === 'string') {
    if (!cb)
      return

    if (!onPathNavigationCbs[path])
      onPathNavigationCbs[path] = new Set()
    onPathNavigationCbs[path].add(cb)
  }
  else if (path) {
    onNavigationCbs.add(path)
  }

  return () => {
    if (typeof path === 'string') {
      if (cb)
        onPathNavigationCbs[path].delete(cb)
    }
    else {
      onNavigationCbs.delete(path)
    }
  }
}

// @internal
// Executes all the callbacks for given route
function runOnNavigationCallbacks(route: SerializedRoute): boolean | void | Promise<boolean | void> {
  for (const cb of onNavigationCbs)
    cb(route)

  const routeUpdates = onPathNavigationCbs[route.path]
  if (routeUpdates) {
    for (const cb of routeUpdates)
      cb(route)
  }
}

/**
 * Runs whenever a route has been resolved. That means the route exists and its loader has successfully fetched data.
 *
 * @param path Route path
 * @param cb Callback
 */

type OnResolveRouteCb = (route: ResolvedRoute) => void

// On route resolve, ran after route has been successfully navigated to
const onPathRouteResolveCbs: Record<string, Set<OnNavigationCb<ResolvedRoute>>> = {}
const onRouteResolveCbs: Set<OnResolveRouteCb> = new Set()

function onRouteResolve(path: OnResolveRouteCb): Stopper
function onRouteResolve(path: string, cb: OnResolveRouteCb): Stopper
function onRouteResolve(path: string | OnResolveRouteCb, cb?: OnResolveRouteCb): Stopper {
  // With path
  if (typeof path === 'string') {
    if (cb) {
      if (!onPathRouteResolveCbs[path])
        onPathRouteResolveCbs[path] = new Set()
      onPathRouteResolveCbs[path].add(cb)
    }
  }
  // Without path
  else {
    onRouteResolveCbs.add(path)
  }

  return () => {
    if (typeof path === 'string') {
      if (cb)
        onPathRouteResolveCbs[path as string].delete(cb)
    }
    else {
      onRouteResolveCbs.delete(path)
    }
  }
}

// @internal
// Executes all the callbacks for given route
function runOnRouteResolveCallbacks(route: ResolvedRoute): void {
  for (const cb of onRouteResolveCbs)
    cb(route)

  const routeUpdates = onPathRouteResolveCbs[route.path]
  if (routeUpdates) {
    for (const cb of routeUpdates)
      cb(route)
  }
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
    if (cb) {
      if (!onRoutePathErrorCbs[path])
        onRoutePathErrorCbs[path] = new Set()
      onRoutePathErrorCbs[path].add(cb)
    }
  }
  // Without path
  else {
    onRouteErrorcbs.add(path)
  }

  return () => {
    if (typeof path === 'string') {
      if (cb)
        onRoutePathErrorCbs[path as string].delete(cb)
    }
    else {
      onRouteErrorcbs.delete(path)
    }
  }
}

// @internal
// Executes all the callbacks for given route
function runOnRouteErrorCallbacks(route: SerializedRoute | null, error: any): void {
  for (const cb of onRouteErrorcbs)
    cb(route, error)

  if (route) {
    const routeUpdates = onRoutePathErrorCbs[route.path]
    if (routeUpdates) {
      for (const cb of routeUpdates)
        cb(route, error)
    }
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

  // Internals / methods not really intended for public use
  resolvePath,
  isMatching,

  // Types
  type SerializedRoute,
  type ResolvedRoute,
  type Route,
  type Router,
  type NavigateOptions,
}
