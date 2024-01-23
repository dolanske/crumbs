export interface Route {
  title?: string
  template: string | (() => Promise<string>)
  path: string
  default?: boolean
  loader?: <T = any>(params: object) => Promise<T>
  onRender?: () => void
}

export type RenderedRoute = Route & {
  html: Element | null
  data: any
}

export type GenericRouteCallback = (current: RenderedRoute) => void
