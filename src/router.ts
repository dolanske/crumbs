import type { ExtractPaths, Narrow } from './type-helpers'
import type { GenericRouteCallback, Route } from './types'

export function importRoute(path: string): () => Promise<string> {
  return async () => {
    return import(`${path}?raw`)
      .then(value => value.default)
      .catch(() => null)
  }
}

/**
 * Router instance. It is recommended to export the created instance and import
 * it in components and part of the application, where routing should be
 * handled.
 *
 * @param rootSelector
 * @param routes
 * @returns Router instance
 */
export function createRouter<S extends string, R extends Route[]>(rootSelector: S, routes: Narrow<R>) {
  return new Router(rootSelector, routes)
}

export class Router<S extends string, R extends Route[]> {
  baseRoutes: Narrow<R>
  root: Element

  // store callbacks
  onRouteChangeCb: GenericRouteCallback[] = []
  // routeOnLoadCb

  constructor(rootSelector: S, routes: Narrow<R>) {
    const root = document.querySelector(rootSelector)

    if (!root)
      throw new Error('Invalid router root selector')

    if (!routes || routes.length === 0)
      throw new Error('No defined routes found')

    this.root = root
    this.baseRoutes = routes

    // Register popstate listener to handle re-rendering on browser navigation
    this.#registerListeners()

    // Find the default route
    this.#setDefaultRoute()
  }

  /**
   *
   * Renders the HTML template provided with a route
   *
   * @private
   * @param route Route object to render
   * @param replace Wether to replace current history entry or append a new one
   */
  async #renderRoute(route: Route, replace: boolean = false) {
    const parser = new DOMParser()

    let file = route.file
    if (typeof file !== 'string')
      file = await file()

    const html = parser.parseFromString(file, 'text/html')
    this.root.replaceChildren(html.body)

    if (replace)
      history.replaceState(route, '', route.path)
    else
      history.pushState(route, '', route.path)

    this.#registerLinks()
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
          this.push(href)
        })
      }
    }
  }

  /**
   * Handle browser navigation events
   */
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
   *
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

  //////////////////////////////////////
  // Public API

  /**
   * Navigate to the provided route
   *
   * @param path Route path
   */
  async push(path: ExtractPaths<R>) {
    // TODO: should match regex, as dynamic routes will NOT work (smh)
    const route = this.baseRoutes.find(r => r.path === path)
    if (!route)
      throw new Error('Invalid path. There is no route assoicated with the provided path.')
    this.#renderRoute(route)
  }

  async replace(path: ExtractPaths<R>) {
    // TODO: should match regex, as dynamic routes will NOT work (smh)
    const route = this.baseRoutes.find(r => r.path === path)
    if (!route)
      throw new Error('Invalid path. There is no route assoicated with the provided path.')
    this.#renderRoute(route, true)
  }

  async go(delta: number) {
    // REVIEW
    // Does this trigger popstate listeners?

    history.go(delta)
  }

  reload() {
    location.reload()
  }
}
