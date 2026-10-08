import fs from 'node:fs/promises'

const PAGE_QUERY = '?crumbs-page'

/**
 * Simple vite plugin which transforms any `.page.html` into vite consumable `.html?raw`.
 * This is purely just a syntax improvement
 */
export default function crumbs() {
  // TODO: figure out if we can provide types to the mount() methods and the return object
  return {
    name: 'page-html-as-raw',
    enforce: 'pre',
    async resolveId(this: any, source: string, importer: string | undefined, options: any) {
      // Leave explicit queries (`?raw`, `?url`, Vite's internal proxies...) alone
      if (source.includes('?') || !source.endsWith('.page.html'))
        return null

      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      if (!resolved || resolved.external)
        return null

      return resolved.id + PAGE_QUERY
    },
    async load(this: any, id: string) {
      if (!id.endsWith(PAGE_QUERY))
        return null

      const file = id.slice(0, -PAGE_QUERY.length)
      this.addWatchFile(file)
      const content = await fs.readFile(file, 'utf-8')
      return `export default ${JSON.stringify(content)}`
    },
  } as const
}
