import { describe, expect, it } from 'vitest'
import type { SerializedRoute } from '../router'
import { resolvePath } from '../router'

describe('router methods test suite', () => {
  it('should resolvePath', () => {
    const source = '/roster/:category/:name'
    const path = '/roster/musician/Haywyre'
    const routes = [
      {
        html: '<span>test</span>',
        path: source,
      },
    ] as SerializedRoute[]

    const {
      resolvedPath,
      sourcePath,
      params,
    } = resolvePath(path, routes)

    expect(resolvedPath).toBe(path)
    expect(sourcePath).toBe(source)
    expect(params).toStrictEqual({
      category: 'musician',
      name: 'Haywyre',
    })
  })
})
