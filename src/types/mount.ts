import type { NavigateOptions, ResolvedRoute } from './types'

export type Provide = Record<string, any>

export interface PageContext {
  path: string
  data: any
  props: Record<string, any>
  params: Record<string, string>
  query: Record<string, string>
  navigate: (path: string, options?: NavigateOptions) => Promise<ResolvedRoute | null>
  provide: Provide
}

// Root references the top level HTML element of the page
export type PageMount = (root: HTMLElement, context: PageContext) => PageModule

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
}
