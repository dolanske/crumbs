import type { ExtractPaths, Narrow } from './type-helpers'
import type { GenericRouteCallback, RenderedRoute, Route } from './types'

export function importRoute(path: string): () => Promise<string> {
  return async () => {
    return import(`${path}?raw`)
      .then(value => value.default)
      .catch(() => null)
  }
}

// TODO
// Should append parameters
function resolvePath(route: Route) {
  return {
    resolvedPath: route.path,
    params: {},
  }
}

/**
 * Router instance. It is recommended to export the created instance and import
 * it in components and part of the application, where routing should be
 * handled.
 *
 * @param routes
 * @returns Router instance
 */
export function createRouter<R extends Route[]>(routes: Narrow<R>) {
  return new Router(routes)
}

export class Router<R extends Route[]> {
  currentRoute?: RenderedRoute
  baseRoutes: Narrow<R>
  isLoading: boolean = false

  // @ts-expect-error This does not have an initialized, as the router can be
  // initialized asynchronously by calling router.start whenever needed. Actual
  // router usage should always be called AFTER the router has been initialized.
  root: Element

  // store callbacks
  #onNavigationCb: Set<GenericRouteCallback> = new Set()
  #onRouteResolveCb: Record<string, Set<GenericRouteCallback>> = Object.create(null)

  constructor(routes: Narrow<R>) {
    if (!routes || routes.length === 0)
      throw new Error('You need to provide at least 1 route')

    this.baseRoutes = routes
  }

  // Renders the HTML template provided with a route
  async #renderRoute(route: Route, replace: boolean = false) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const unresolvedPath = route.path
      const { resolvedPath, params } = resolvePath(route)
      let data: any = null

      if (route.loader) {
        data = await route.loader(params)
          .then(res => res)
          // If loader fails, we throw an error and navigate to 404 if its defined
          .catch((e) => {
            reject(e)
            return null
          })
      }

      const parser = new DOMParser()
      let template = route.template
      if (typeof template !== 'string')
        template = await template()

      const html = parser.parseFromString(template, 'text/html')
      const el = html.body.firstElementChild!

      this.root.replaceChildren(el)
      this.currentRoute = Object.assign(route, {
        path: resolvedPath,
        template,
        html: el,
        data,
      })

      // Set title
      if (route.title)
        document.title = route.title

      // Append to history
      if (replace)
        history.replaceState(this.currentRoute, '', route.path)
      else
        history.pushState(this.currentRoute, '', route.path)

      // Rerun register to make newly rendered links work
      this.#registerLinks()

      if (route.onRender)
        route.onRender()

      this.#updateOnNavigationCb()
      this.#updateOnRouteResolveCb(unresolvedPath)

      resolve(this.currentRoute)
    })
  }

  /**
   * Registers any <a link> elements within the rendered route. Clicking these
   * links will ignore the default behaviour and instead call `push` on the
   * router instance.
   *
   * @private
   *
   */
  #registerLinks() {
    const links = this.root.querySelectorAll('a[link]')

    for (const link of links) {
      const href = link.getAttributeNode('href')?.value
      if (href && this.baseRoutes.some(r => r.path === href)) {
        link.addEventListener('click', (event: Event) => {
          event.preventDefault()
          this.navigate(href)
        })
      }
    }
  }

  // Handle browser navigation events
  #registerListeners() {
    window.addEventListener('popstate', (event) => {
      console.log('[Popstate event]', event)
      this.#renderRoute(event.state, true)
    })
  }

  /**
   * Check if the current location is within the defind routes. Also check if
   * any routes have the `default` prop on them, because those will be set in
   * case the current location is `/`.
   */
  #setDefaultRoute() {
    const currentPath = location.pathname

    if (currentPath !== '/') {
      const match = this.baseRoutes.find(r => r.path === currentPath)

      if (match) {
        this.#renderRoute(match)
        return
      }
    }
    const defaultRoute = this.baseRoutes.find(r => r.default) ?? this.baseRoutes[0]
    this.#renderRoute(defaultRoute, true)
  }

  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  // Callback updates

  /**
   * Executes given callback whenever a new page has been succesfully navigated
   * to. Runs after the loader has been resolved.
   *
   * @param cb Callback
   * @returns Callabck stopper
   */
  onNavigation(cb: GenericRouteCallback) {
    this.#onNavigationCb.add(cb)
    return () => this.#onNavigationCb.delete(cb)
  }

  #updateOnNavigationCb() {
    for (const cb of this.#onNavigationCb)
      cb(this.currentRoute!)
  }

  /**
   * Executes given callback, whenever the provided route path is navigated to and resolved.
   *
   * @param path Route path
   * @param cb Callback
   * @returns Callback stopper
   */
  onRouteResolve(path: ExtractPaths<R>, cb: GenericRouteCallback) {
    const _path = path as string
    if (!this.#onRouteResolveCb[_path])
      this.#onRouteResolveCb[_path] = new Set<GenericRouteCallback>()

    const paths = this.#onRouteResolveCb[_path]

    paths.add(cb)
    return () => paths.delete(cb)
  }

  #updateOnRouteResolveCb(path: string) {
    const routes = this.#onRouteResolveCb[path]
    for (const cb of routes)
      cb(this.currentRoute!)
  }

  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  // Public API

  /**
   * Navigate to the provided route
   *
   * @param path Route path
   */
  async navigate(path: ExtractPaths<R>) {
    // TODO: should match regex, as dynamic routes will NOT work (smh)
    const route = this.baseRoutes.find(r => r.path === path)
    if (!route)
      throw new Error('Invalid path. There is no route assoicated with the provided path.')
    return this.#renderRoute(route)
  }

  // async replace(path: ExtractPaths<R>) {
  //   // TODO: should match regex, as dynamic routes will NOT work (smh)
  //   const route = this.baseRoutes.find(r => r.path === path)
  //   if (!route)
  //     throw new Error('Invalid path. There is no route assoicated with the provided path.')
  //   this.#renderRoute(route, true)
  // }

  // async go(delta: number) {
  //   // REVIEW
  //   // Does this trigger popstate listeners?

  //   history.go(delta)
  // }

  // reload() {
  //   location.reload()
  // }

  /**
   * Start the router. It is important to star the router before any usage.
   */
  start(rootSelector: string) {
    const root = document.querySelector(rootSelector)
    if (!root)
      throw new Error('Invalid router root selector')
    this.root = root

    // Register popstate listener to handle re-rendering on browser navigation
    this.#registerListeners()

    // Find the default route
    this.#setDefaultRoute()
  }
}
