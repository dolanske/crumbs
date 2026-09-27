export interface Route {
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

export type RenderedHtml = Element | DocumentFragment

// Serialized route after router has been initialized
export interface SerializedRoute extends Route {
  path: string
  renderedHtml: RenderedHtml | null
  module: Promise<any> | null
  hash: string
  query: Record<string, string>
  props: Record<string, any>
}

// The currently active route
export interface ResolvedRoute extends Route {
  path: string
  renderedHtml: RenderedHtml
  resolvedPath: string
  params: Record<string, string>
  data: any
  hash: string
  query: Record<string, string>
  props: Record<string, any>
}

// Shape of the object stored in `history.state` for every navigation entry
export interface HistoryState {
  path: string
  props: Record<string, any>
}

export interface NavigateOptions {
  hash?: string | boolean | number
  query?: Record<string, string | number | boolean>
  props?: Record<string, any>
  replace?: boolean
  isPopState?: boolean
}

// Root references the top level HTML element of the page
export type PageMount = (root: HTMLElement, context: {
  path: string
  data: any
  props: Record<string, any>
  params: Record<string, string>
  query: Record<string, string>
  navigate: (path: string, options?: NavigateOptions) => Promise<ResolvedRoute | null>
}) => PageModule

// Optional callbacks returned by the page's `mount` method
export interface PageModule {
  /**
   * Runs when page is unmounted
   */
  unmount?: () => void
  /**
   * Runs before navigating out. Can cancel navigation if `false` is returned
   */
  beforeLeave?: () => boolean | Promise<boolean>
  /**
   * Runs whenever a dynamic route updates
   */
  update?: (route: ResolvedRoute) => void
}

export type Router = Record<string, Route | string>

export type FindRouteOptions = Record<'path', string> | Record<'title', string> | Record<'startsWith', string> | Record<'html', string> | Record<'renderedHtml', Element>

export interface ResolvedPathOptions {
  resolvedPath: string
  sourcePath: string
  params: Record<string, string>
  query: Record<string, string>
  hash: string
}
