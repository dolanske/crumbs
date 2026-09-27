import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineRouter, getRoute, navigate, onNavigation, onRouteError, onRouteResolve, resetRouter } from '../router'

vi.mock('../page-module-url', () => ({
  createModuleUrl: (code: string) =>
    `data:text/javascript;base64,${btoa(code)}`,
}))

const SCRIPT_BASE = `
<script type="module">
export function mount(root, ctx) {
  root.dataset.mounted = 'true'
  return () => { root.dataset.mounted = 'false' }  
}
</script>`

const SCRIPT_CANCEL = `
<script type="module">
export function mount(root, ctx) {
  root.dataset.mounted = 'true'
  return { 
    beforeLeave() {
      return false
    }
  }  
}
</script>`

const routes = {
  '/home': `<div id="home"><h1>Home</h1><a href="/users/4" link>User</a><a href="https://example.com/home" link id="external">External</a></div>`,
  '/users/:id': {
    html: '<div id="user">User</div>',
    fallback: '<div id="fallback">Failed</div>',
    loader: async ({ id }: { id: string }) => {
      if (id === 'bad')
        throw new Error('loader failed')
      return { id }
    },
  },
  '/broken': {
    html: '<div id="broken">Broken</div>',
    loader: async () => {
      throw new Error('no fallback')
    },
  },
  '/multi': `<p>one</p><p>two</p>${SCRIPT_BASE}`,
  '/script': `<p>test</p>${SCRIPT_BASE}`,
  '/trap': `<p>test</p>${SCRIPT_CANCEL}`,
}

function root() {
  return document.querySelector('#app')!
}

function url() {
  return location.pathname + location.search + location.hash
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>'
  history.replaceState(null, '', '/')
})

afterEach(() => {
  resetRouter()
})

describe('run', () => {
  it('renders the default route and replaces the initial history entry', async () => {
    const length = history.length
    await defineRouter(routes).run('#app')

    expect(root().querySelector('#home')).not.toBeNull()
    expect(url()).toBe('/home')
    expect(history.length).toBe(length)
    expect(getRoute()?.path).toBe('/home')
  })

  it('renders the route matching the current URL', async () => {
    history.replaceState(null, '', '/users/7?tab=posts#bio')
    await defineRouter(routes).run('#app')

    expect(root().querySelector('#user')).not.toBeNull()
    expect(url()).toBe('/users/7?tab=posts#bio')
  })

  it('throws synchronously for an invalid root selector', () => {
    expect(() => defineRouter(routes).run('#nope')).toThrow(/Invalid root/)
  })
})

describe('navigate', () => {
  beforeEach(async () => {
    await defineRouter(routes).run('#app')
  })

  it('resolves params, query, hash and loader data and updates the URL', async () => {
    const route = await navigate('/users/42#bio', { query: { tab: 'posts' }, props: { from: 'test' } })

    expect(route?.path).toBe('/users/:id')
    expect(route?.resolvedPath).toBe('/users/42')
    expect(route?.params).toStrictEqual({ id: '42' })
    expect(route?.query).toStrictEqual({ tab: 'posts' })
    expect(route?.hash).toBe('bio')
    expect(route?.data).toStrictEqual({ id: '42' })
    expect(route?.props).toStrictEqual({ from: 'test' })
    expect(url()).toBe('/users/42?tab=posts#bio')
    expect(history.state).toStrictEqual({ path: '/users/42?tab=posts#bio', props: { from: 'test' } })
    expect(root().querySelector('#user')).not.toBeNull()
    expect(getRoute()).toBe(route)
  })

  it('renders every node of a multi-root template', async () => {
    await navigate('/multi')
    expect(root().querySelectorAll('p')).toHaveLength(2)
  })

  it('rejects and reports unknown paths', async () => {
    const onError = vi.fn()
    onRouteError(onError)

    await expect(navigate('/missing')).rejects.toThrow(/No matching route/)
    expect(onError).toHaveBeenCalledWith(null, expect.any(Error))
    expect(url()).toBe('/home')
    expect(root().querySelector('#home')).not.toBeNull()
  })

  it('renders the fallback when the loader throws', async () => {
    const route = await navigate('/users/bad')

    expect(route?.data).toBeNull()
    expect(root().querySelector('#fallback')).not.toBeNull()
    expect(url()).toBe('/users/bad')
  })

  it('rejects without rendering when the loader throws and there is no fallback', async () => {
    const onError = vi.fn()
    const onResolve = vi.fn()
    onRouteError('/broken', onError)
    onRouteResolve(onResolve)

    await expect(navigate('/broken')).rejects.toThrow('no fallback')

    expect(onError).toHaveBeenCalledOnce()
    expect(onResolve).not.toHaveBeenCalled()
    expect(root().querySelector('#home')).not.toBeNull()
    expect(url()).toBe('/home')
    expect(getRoute()?.path).toBe('/home')
  })

  it('can be cancelled by an async onNavigation callback', async () => {
    const stop = onNavigation('/users/:id', async () => false)
    const onResolve = vi.fn()
    onRouteResolve(onResolve)

    const result = await navigate('/users/1')

    expect(result).toBeNull()
    expect(onResolve).not.toHaveBeenCalled()
    expect(url()).toBe('/home')
    expect(root().querySelector('#home')).not.toBeNull()

    stop()
    expect(await navigate('/users/1')).not.toBeNull()
  })

  it('keeps only the latest of two concurrent navigations', async () => {
    let releaseSlow!: () => void
    const slow = new Promise<void>((resolve) => {
      releaseSlow = resolve
    })
    onNavigation('/users/:id', () => slow)

    const first = navigate('/users/1')
    const second = navigate('/multi')

    await second
    releaseSlow()

    expect(await first).toBeNull()
    expect(url()).toBe('/multi')
    expect(root().querySelectorAll('p')).toHaveLength(2)
  })

  it('replaces the history entry when navigating to the same URL', async () => {
    await navigate('/multi')
    const length = history.length
    await navigate('/multi')
    expect(history.length).toBe(length)
  })

  it('rejects after the router has been stopped', async () => {
    const app = defineRouter(routes)
    await app.run('#app')
    app.stop()

    await expect(navigate('/multi')).rejects.toThrow(/not running/)
    expect(getRoute()).toBeNull()
  })
})

describe('links', () => {
  beforeEach(async () => {
    await defineRouter(routes).run('#app')
  })

  it('navigates when a matching same-origin link is clicked', async () => {
    const link = root().querySelector<HTMLAnchorElement>('a[href="/users/4"]')!
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    await vi.waitFor(() => expect(url()).toBe('/users/4'))
    expect(root().querySelector('#user')).not.toBeNull()
  })

  it('ignores external links and modifier clicks', async () => {
    const onResolve = vi.fn()
    onRouteResolve(onResolve)

    const external = root().querySelector<HTMLAnchorElement>('#external')!
    const externalClick = new MouseEvent('click', { bubbles: true, cancelable: true })
    external.dispatchEvent(externalClick)
    expect(externalClick.defaultPrevented).toBe(false)

    const link = root().querySelector<HTMLAnchorElement>('a[href="/users/4"]')!
    const ctrlClick = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })
    link.dispatchEvent(ctrlClick)
    expect(ctrlClick.defaultPrevented).toBe(false)

    // Give any wrongly started navigation a chance to finish
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(onResolve).not.toHaveBeenCalled()
    expect(getRoute()?.path).toBe('/home')
  })
})

describe('popstate', () => {
  beforeEach(async () => {
    await defineRouter(routes).run('#app')
  })

  it('navigates to the path stored in the history state', async () => {
    window.dispatchEvent(new PopStateEvent('popstate', { state: { path: '/users/9', props: { a: 1 } } }))

    await vi.waitFor(() => expect(getRoute()?.resolvedPath).toBe('/users/9'))
    expect(getRoute()?.props).toStrictEqual({ a: 1 })
    expect(root().querySelector('#user')).not.toBeNull()
  })

  it('falls back to the current location when the state is null', async () => {
    history.pushState(null, '', '/multi')
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }))

    await vi.waitFor(() => expect(getRoute()?.path).toBe('/multi'))
    expect(root().querySelectorAll('p')).toHaveLength(2)
  })
})

describe('pages and modules', () => {
  beforeEach(async () => {
    await defineRouter(routes).run('#app')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should warn when a page using <script> has multiple root elements', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await navigate('/multi')
    expect(warnSpy).toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Page using a <script> should have only 1 root element'),
    )
  })

  it('should mount and unmount', async () => {
    await navigate('/script')
    const root = document.querySelector('p')
    expect(root?.textContent).toBe('test')
    expect(root?.dataset.mounted).toBe('true')
    await navigate('/multi')
    expect(root?.dataset.mounted).toBe('false')
  })

  it('it should cancel navigation out', async () => {
    await navigate('/trap')
    const root = document.querySelector('p')
    expect(root?.dataset.mounted).toBe('true')
    await navigate('/script')
    expect(root?.dataset.mounted).toBe('true')
  })
})
