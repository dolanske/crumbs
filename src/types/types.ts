import type { Provide } from './mount'

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

export interface RouterOptions {
  // Functions made available to every page through `ctx.provide`
  provide?: Provide

  // Base path the application is served from, eg. `/my-repo/` when deployed
  // to GitHub pages. Route paths are defined without it.
  base?: string
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
