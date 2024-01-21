export interface Route {
  title?: string
  file: string | (() => Promise<string>)
  path: string
  default?: boolean
  loader?: <T>() => Promise<T>
}

export type GenericRouteCallback = (current: Route) => void
