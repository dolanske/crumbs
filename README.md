# crumbs

SPA router for framework-less web applications using HTML files. This library assumes you're using it in an environment, which can import HTML files as strings.

```bash
npm i @dolanske/crumbs
```

If you wish to define pages using the `*.page.html` syntax, you need to add a type reference to your global `.d.ts` file and use the crumbs vite plugin
```ts
// env.d.ts
/// <reference types="crumbs/client" />

// vite.config.ts
import crumbs from 'crumbs/vite'
export default defineConfig({
  plugins: [crumbs()]
})
```

## Usage

```ts
// Without the above, you can still import pages like this
import main from './routes/main.html?raw'
// With the setup, you can import them like this
import user from './routes/user.page.html'

import errorFallback from './routes/errorFallback.html?raw'
import { defineRouter } from '@dolanske/crumbs'

const routes = {
  '/': main,
  '/users': '<span>User list...</span>',
  '/user/:id': {
    html: user,
    // In case loader throws, you can provide a fallback route to render instead
    fallback: errorFallback,
    async loader({ id }: { id: string }) {
      return fetch(`https://swapi.dev/api/people/${id}`).then(r => r.json())
    },
  },
}

defineRouter(routes).run('#app')
```

While you can pass a template string or a raw HTML file, Crumbs actually supports a vue-like template syntax including `<script>` tags. The CSS will be scoped to the page and the script JS will run on every page load.

One big caveat is that the script cannot import package or local imports, because it runs in its own context.

```html
<div id="page">
  <h1>Hello world</h1>
</div>

<style>
  h1 {
    color: yellow;
  }
</style>

<script type="module">
  /** @ts-check */
  /** @type {import('@dolanske/crumbs').PageMount} */
  export function mount(root, ctx) {
    // You can only write code inside the `mount` function. Code outside will be discarded
    // root = the top level element of the page, in this case `<div id="page" />
    // ctx  = information about the route, path, query, props, hash, global provides, etc

    return {
      // Runs before page is destroyed
      unmount() {},
      // Runs before navigating out, returning false cancels navigation
      beforeLeave() {}
    }
  }
</script>

```

One way we can work around it is to provide methods to the router using `provide`

```ts
defineRouter(routes, {
  provide: {
    // Add any imported/package methods here
    test: () => console.log('Hello from page!'),
    // Globally available dataset
    users: ['a', 'b']
  }
})
```

Now any page will have access to it on the `provide` object.

```html
<div />
<script type="module">
  export function mount(root, ctx) {
    // Check console for "Hello from page!"
    ctx.provide.test()
  }
</script>
```

## Api

####  `defineRouter`

```ts
defineRouter(routes: Record<string, Route | string>, options?: RouterOptions)

interface RouterOptions {
  // Any data available to the pages. For instance methods we can't import inside `.page.html` or globally available datasets
  provide?: Record<string, any>
  // Base path the app is served from, eg. `/my-repo/`
  base?: string
}
```

To create a router, call the `defineRouter` method in the root script of your application. This function takes in an object which contains route definitions and an optional options object.

`options.base` sets the base path the app is served from, for example `/my-repo/` when deployed to GitHub pages in a sub folder. Routes, `navigate()` and `getRoute()` keep using paths without the base. The base is only added to the URL in the address bar, and URLs outside of it are never matched. With Vite, you can pass `import.meta.env.BASE_URL`. `getBase()` returns the current base.

`defineRouter` returns an app instance, which contains two methods

- `run(domSelector)` Takes in a selector for a valid DOM element, which the router will be mounted to. Throws if the selector does not match an element. Returns a promise, which resolves once the initial route has been rendered.
- `stop()` Stops the routing. Calling `navigate()` afterwards rejects.

```ts
interface Route {
  // Sets the title of the page
  title?: string

  // Content of the route, which gets rendered on navigation. Strings are
  // parsed on every navigation, elements are reused as they are.
  html: string | Element

  // Fallback should be used together with loader, to display error state
  fallback?: string | Element

  // If loader returns a promise, the route is not loaded until the loader
  // function resolves. The returned dataset is then available through
  // `onRouteResolve()` callback or when calling `getRoute()` after the route
  // has loaded. Parameters extracted from the path are always strings.
  loader?: (params: Record<string, string>) => Promise<any>

  // When page is first loaded, the router will look for a matching path, if one
  // is not found, it will then check if any route is set as `default` and if it
  // finds one, it loads that route
  default?: boolean

  // You can freely define any data which will be available on the route object
  meta?: Record<string, any>
}
```

Route paths are matched segment by segment. `/users/:id` matches `/users/10` but not `/users` or `/users/10/edit`. A trailing slash is ignored. When both a static and a dynamic route match, the static one wins, so `/users/new` can live next to `/users/:id` in any order.

How to navigate between pages? There are two ways.
You can add a `link` attribute to any `<a>` element like this `<a href="/users" link>` and it will just work, no matter where in the document the element is. Clicks with a modifier key, links pointing to another origin or a different `target` and links which do not match any route are left to the browser. Or you can use the `navigate` function.

####  `navigate`

You can navigate to a page programatically by using `navigate(path)`. Optionally, you can provide an options object. The returned promise resolves with the resolved route once it has been rendered, with `null` when the navigation was cancelled (see `onNavigation`) or superseded by a newer navigation, and rejects when the navigation failed.

```ts
interface NavigateOptions {
  // Append a hash parameter to the URL such as #henlo. Pass `false` to remove
  // the hash from the path.
  hash?: string | boolean | number
  // Query object which gets serialized into search parameters
  // Such as ?hello=world&second=hello
  query?: Record<string, string | number | boolean>
  // These props are not saved anywhere in the URL and only available through
  // `onRouteResolve()` callback or when calling `getRoute()` after the route
  // has loaded.
  props?: Record<string, any>
  // Whether to replace the current History entry. Navigating to the exact URL
  // which is already open always replaces the entry.
  replace?: boolean
}
```

####  `getRoute`

Whenever a route is resolved, the `getRoute` method will contain the resolved object, until the next route is navigated to. This is primarily useful within event listeners or async code, which isn't executed right when route is rendered.

The same object is also available in the `onRouteResolve()` listener.

```ts
interface ResolvedRoute extends Route {
  // The path of the route definition that was matched eg. `/users/:id`
  path: string
  // The actual pathname that was navigated to eg. `/users/10`
  resolvedPath: string
  // The rendered DOM, which was appended to the router root element. A
  // template with a single root element yields that element, anything else
  // yields a DocumentFragment.
  renderedHtml: Element | DocumentFragment
  // The params object, which is extracted from the path eg. `{ id: '10' }`
  params: Record<string, string>
  // Data returned by the loader function. `null` when there is no loader or
  // when the fallback was rendered.
  data: any
  // Hash without the leading `#`
  hash: string
  query: Record<string, string>
  props: Record<string, any>
}
```

####  `findRoute`

Find a route definition by one of its properties: `path`, `title`, `html`, `startsWith` or `renderedHtml`.

```ts
findRoute({ path: '/users/:id' })
findRoute({ startsWith: '/users' })
```

## Event listeners

Every listener function returns a stopper function, which removes the provided callback from being ran. Each listener can be registered either for every route, or for one route by passing its definition path (eg. `/users/:id`) as the first argument.

####  `onNavigation`

Runs the provided callback function whenever a route is navigated to. That means if a link is clicked or a `navigate()` function was called.

```ts
onNavigation((serializedRoute) => {})
onNavigation('/users/:id', (serializedRoute) => {})

interface SerializedRoute extends Route {
  path: string
  renderedHtml: Element | DocumentFragment | null
  hash: string
  query: Record<string, string>
  props: Record<string, any>
}
```

It is possible to cancel navigation to a route, by returning false from `onNavigation` callback. The callback can be async, so you can fetch what you need before deciding to cancel the navigation or not. Callbacks run one after another and the first one returning `false` cancels the navigation.

```ts
onNavigation(async (route) => {
  if (route.meta.requiresAuth) {
    const session = await getSession()

    if (!session.user)
      return false
  }
})
```

####  `onRouteResolve`

Runs the provided callback function whenever a route is resolved and rendered. That means once the loader function has been resolved.

```ts
onRouteResolve((resolvedRoute) => {})
onRouteResolve('/users/:id', (resolvedRoute) => {})
```

####  `onRouteError`

Runs the provided callback function whenever a navigation fails. That is when no route matches the path, or when the loader throws and the route has no `fallback`. The first argument is the route which was being navigated to, or `null` when no route matched.

```ts
onRouteError((route, error) => {})
onRouteError('/users/:id', (route, error) => {})
```

## Other

####  `getRouterConfig`

Returns the base router object.

####  `getRouterRoot`

Returns the router root element, which was provided during initialization
