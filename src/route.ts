import { countDynamicSegments, normalizePath, splitPath } from './path'
import type { FindRouteOptions, SerializedRoute } from './types/types'

// Finds the best matching route for a pathname. Static routes take precedence
// over dynamic ones (`/users/new` wins over `/users/:id`). Between equally
// specific routes, definition order wins.
export function matchRoute(routes: SerializedRoute[], pathname: string): SerializedRoute | undefined {
  return routes
    .filter(r => isMatching(r.path, pathname))
    .sort((a, b) => countDynamicSegments(a.path) - countDynamicSegments(b.path))[0]
}

/**
 * Checks whether two paths are matching. A path is matching, if its dynamic
 * parameter definitions are that of a path, which has them replaced with actual
 * values.
 *
 * For example `/main/users/:id` should match with `/main/users/10` and so on.
 * Both paths must have the same amount of segments and dynamic segments must
 * be filled with a non-empty value.
 *
 */
export function isMatching(sourcePath: string, pathWithValues: string): boolean {
  const sourceSplit = splitPath(sourcePath)
  const valuesSplit = splitPath(pathWithValues)

  if (sourceSplit.length !== valuesSplit.length)
    return false

  return sourceSplit.every((segment, index) => {
    if (segment.startsWith(':'))
      return valuesSplit[index].length > 0
    return segment === valuesSplit[index]
  })
}

/**
 * Find a route based on some of its properties.
 */
export function findRoute(routes: SerializedRoute[], option: FindRouteOptions): SerializedRoute | undefined {
  const [key, value] = Object.entries(option)[0]

  return routes.find((r) => {
    switch (key) {
      case 'path':
        return r.path === normalizePath(value as string)

      case 'html':
      case 'title':
        return r[key] === value

      case 'startsWith':
        return r.path.startsWith(value as string)

      case 'renderedHtml':
        return r.renderedHtml?.isEqualNode(value as Element) ?? false

      default:
        return false
    }
  })
}
