import { describe, expect, it } from 'vitest'
import type { SerializedRoute } from '../router'
import { isMatching, matchRoute, resolvePath } from '../router'

function makeRoutes(paths: string[]): SerializedRoute[] {
  return paths.map(path => ({
    html: '<span>test</span>',
    path,
    renderedHtml: null,
    hash: '',
    query: {},
    props: {},
  }))
}

describe('isMatching', () => {
  it('matches static and dynamic segments', () => {
    expect(isMatching('/home', '/home')).toBe(true)
    expect(isMatching('/users/:id', '/users/10')).toBe(true)
    expect(isMatching('/users/:id', '/posts/10')).toBe(false)
  })

  it('does not match on prefix only', () => {
    expect(isMatching('/home', '/home/a/b')).toBe(false)
    expect(isMatching('/users/:id', '/users/10/edit')).toBe(false)
  })

  it('requires dynamic segments to be filled', () => {
    expect(isMatching('/:id', '/')).toBe(false)
    expect(isMatching('/users/:id', '/users')).toBe(false)
  })

  it('treats trailing slashes and query/hash as irrelevant', () => {
    expect(isMatching('/home', '/home/')).toBe(true)
    expect(isMatching('/home', '/home?a=1#top')).toBe(true)
  })
})

describe('matchRoute', () => {
  it('prefers static routes over dynamic ones regardless of definition order', () => {
    const routes = makeRoutes(['/users/:id', '/users/new'])
    expect(matchRoute(routes, '/users/new')?.path).toBe('/users/new')
    expect(matchRoute(routes, '/users/10')?.path).toBe('/users/:id')
  })

  it('does not mutate the route table', () => {
    const routes = makeRoutes(['/long/static/path', '/a'])
    matchRoute(routes, '/nope')
    expect(routes.map(r => r.path)).toEqual(['/long/static/path', '/a'])
  })
})

describe('resolvePath', () => {
  it('extracts params, query and hash', () => {
    const routes = makeRoutes(['/roster/:category/:name'])
    const result = resolvePath('/roster/musician/Haywyre?sort=asc&page=2#top', routes)

    expect(result.resolvedPath).toBe('/roster/musician/Haywyre')
    expect(result.sourcePath).toBe('/roster/:category/:name')
    expect(result.params).toStrictEqual({ category: 'musician', name: 'Haywyre' })
    expect(result.query).toStrictEqual({ sort: 'asc', page: '2' })
    expect(result.hash).toBe('top')
  })

  it('decodes encoded parameters', () => {
    const routes = makeRoutes(['/user/:name'])
    expect(resolvePath('/user/John%20Doe', routes).params.name).toBe('John Doe')
  })

  it('throws for unknown paths', () => {
    expect(() => resolvePath('/missing', makeRoutes(['/home']))).toThrow(/No matching route/)
  })
})
