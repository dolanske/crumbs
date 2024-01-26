// Initial user input
interface Route {
  title?: string
  html: string
  loader?: (params: any) => Promise<any>
  default?: boolean
  lazy?: boolean
}

// Serialized route after router has been initialized
interface SerializedRoute extends Route {
  path: string
  renderedHtml: Element | null
}

// The currently active route
interface ResolvedRoute extends Route {
  path: string
  renderedHtml: Element
  resolvedPath: string
  params?: object
  data: any | null
}

// Extend the native PopStateEvent with the properties which will be added when
// users navigate to other pages using built-in browser navigation.
declare interface PopStateEvent {
  state: {
    path: string
  }
}

type Router = Record<string, Route | string>

let __baseRouter: Router = {}
let routes: SerializedRoute[] = []
let rootSelector: string = ''
let currentRoute: null | ResolvedRoute

// Returns the current active route
function getRoute() {
  return currentRoute
}

// Creates router by serializing all the provided routes and
function defineRouter(definitions: Router) {
  __baseRouter = definitions

  const serializedRoutes: SerializedRoute[] = Object.entries(definitions).map(([path, route]) => {
    if (typeof route === 'string') {
      return {
        html: route,
        renderedHtml: parseToHtml(route),
        path,
      }
    }

    return {
      ...route,
      path,
      renderedHtml: parseToHtml(route.html),
    }
  })

  routes = serializedRoutes

  // Register route listeners. This will execute whenever user uses the browser
  // native navigation
  const popstateHandler = ({ state }: PopStateEvent) => navigate(state.path)

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

      // TODO Decide which route will be rendered first/
    },
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop() {
      window.removeEventListener('popstate', popstateHandler)
    },
  }
}

// Converts string template into a piece of DOM
function parseToHtml(template: string) {
  const parser = new DOMParser()
  const raw = parser.parseFromString(template, 'text/html')
  return raw.body.firstElementChild!
}

// Returns the router root dom node, or crashes (as it should)
function getRouterRoot() {
  if (!rootSelector)
    throw new Error('No root selector found. Did you start the router?')
  const root = document.querySelector(rootSelector)
  if (!root)
    throw new Error('Invalid root node selector. Please select a valid HTML element.')
  return root
}

// /**
//  *
//  */

type FindRouteOptions = Record<'path', string> | Record<'title', string> | Record<'startsWith', string> | Record<'html', string> | Record<'enderedHtml', Element>

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
 * parameter definitions are matching that of a path, which has them replaced
 * with actual values.
 *
 * For example `/main/users/:id` should match with `/main/users/10` and so on...
 *
 */
// TODO
function isMatching(source: string, path: string) {
  return true
}

// TODO
function resolvePath(path: string): {
  resolvedPath: string
  path: string
  params: {}
} {
  // 1. Match against a base path and return route
  // 2. Extract parameters into an object

  const realPath = routes.find(r => isMatching(r.path, path))

  return {
    resolvedPath: '',
    path: '',
    params: {},
  }
}

/**
 * Registers any <a link> elements within the rendered route. Clicking these
 * links will ignore the default behaviour and instead call `push` on the router
 * instance.
 *
 */
function registerLinks() {
  const root = getRouterRoot()
  const links = root.querySelectorAll('a[link]')

  for (const link of links) {
    const href = link.getAttributeNode('href')?.value
    if (!href)
      continue

    const isMatch = routes.some(r => isMatching(r.path, href))

    if (isMatch) {
      // When links are garbage collected, event listeners are automatically
      // removed, so this does not need a stopper function.
      link.addEventListener('click', (event: Event) => {
        event.preventDefault()
        navigate(href)
      })
    }
  }
}

// TODO
async function navigate(path: string, replace?: boolean): Promise<ResolvedRoute | null> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    // 1. Resolve path
    const {
      resolvedPath,
      params,
    } = resolvePath(path)

    const route = findRoute({ path })
    if (!route)
      return reject(new Error('Invalid path. Could not match route.'))

    const renderedHtml = parseToHtml(route.html)

    // 2. onNavigation () callback run
    // If callback returns false, the navigation is cancelled
    const result = runOnNavigationCallbacks({ ...route, path, renderedHtml })
    if (result === false)
      resolve(null)

    // 3. Check if loader has data
    let data
    if (route.loader) {
      data = await route.loader(params)
        .then(res => res)
        .catch(e => reject(new Error(e)))
    }

    // 4. set currentRoute variable
    currentRoute = {
      ...route,
      path,
      resolvedPath,
      renderedHtml,
      params,
      data,
    }

    // 5. history.push / replace
    if (replace)
      history.replaceState({ path }, '', resolvedPath)
    else
      history.pushState({ path }, '', resolvedPath)

    // 6. Set document title if it has it
    if (route.title)
      document.title = route.title

    // 7. onRouteResolve() callback run
    runOnRouteResolveCallbacks(currentRoute)

    // 8. Resolve
    resolve(currentRoute)
  })
}

// TODO
// onRouteResolve(path, cb) -> is ran whenever a route is resolved (loaded, loaders have returend data)

// On navigation (before resolve) callback
type OnNavigationCb<T = SerializedRoute> = (route: T) => void | boolean
type OnNavigationCbFn = (route: SerializedRoute) => void | boolean

const onPathNavigationCbs: Record<string, Set<OnNavigationCb>> = {}
const onNavigationCbs = new Set<OnNavigationCb>()

function onNavigation(path: OnNavigationCbFn): void
function onNavigation(path: string, cb: OnNavigationCbFn): void
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
}

function runOnNavigationCallbacks(route: SerializedRoute): boolean | void {
  for (const cb of onNavigationCbs)
    cb(route)

  const routeUpdates = onPathNavigationCbs[route.path]
  if (routeUpdates.size > 0) {
    for (const cb of routeUpdates)
      cb(route)
  }
}

// On route resolve, ran after route has been successfully navigated to
const onRouteResolveCbs: Record<string, Set<OnNavigationCb<ResolvedRoute>>> = {}

function onRouteResolve(path: string, cb: (route: ResolvedRoute) => void) {
  if (!onRouteResolveCbs[path])
    onRouteResolveCbs[path] = new Set()
  onRouteResolveCbs[path].add(cb)
}

function runOnRouteResolveCallbacks(route: ResolvedRoute): void {
  const routeUpdates = onRouteResolveCbs[route.path]
  if (routeUpdates.size > 0) {
    for (const cb of routeUpdates)
      cb(route)
  }
}

// Public API
export {
  defineRouter,
  onRouteResolve,
  onNavigation,
  navigate,
  getRoute,
  getRouterRoot,
}
