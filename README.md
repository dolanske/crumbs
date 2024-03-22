# crumbs

SPA router for framework-less web applications using HTML files. This library assumes you're using it in an environment, which can import HTML files as strings.

## Usage

```ts
import { defineRouter } from '@dolanske/router'

import main from './routes/main.html?raw'
import user from './routes/user.html?raw'
import errorFallback from './routes/errorFallback.html?raw'

const routes = {
  '/': main,
  '/users': '<span>User list...</span>',
  '/user/:id': {
    html: user,
    // In case loader throws, you can provide a fallback route to render instead
    fallback: errorFallback,
    async loader({ id }: { id: number }) {
      return fetch(`https://swapi.dev/api/people/${id}`)
        .then(r => r.json())
        .then(d => d)
    },
  },
}

defineRouter(routes).run('#app')
```

## Api

####  `defineRouter`

To create a router, call the `defineRoute` method in the root script of your application. This function takes in an object which contains route definitions. It returns an app instance, which contains two methods

- `run(domSelector)` Takes in a selector for a valid DOM element, which the router will be mounted to.
- `stop()` Stops the routing

```ts
interface Route {
  // Sets the title of the page
  title?: string
  // Content of the route, which gets rendered on navigation
  html: string | Element
  // Fallback should be used together with loader, to display error state
  fallback?: string | Element
  // If loader returns a promise, the route is not loaded until the loader
  // function resolves. The returned dataset is then available through
  // `onRouteResolve()` callback or when calling `getRoute()` after the route
  // has loaded.
  loader?: (params: any) => Promise<any>
  // When page is first loaded, the router will look for a matching path, if one
  // is not found, it will then check if any route is set as `default` and if it
  // finds one, it loads that route
  default?: boolean
  // You can freely define any data which will be available on the route object
  meta?: Record<string, any>
}
```

How to navigate between pages? There are two ways.
You can add a `link` attribute to any `<a>` element like this `<a href="/users" link>` and it will jus work. Or you can use the `navigate` function.

####  `navigate`

You can navigate to a page programatically by using `navigate(path)`. Optionally, you can provide an options object.

```ts
interface NavigateOptions {
  // Append a hash parameter to the URL such as #henlo
  hash?: string | boolean | number
  // Query object which gets serialized into search parameters
  // Such as ?hello=world&second=hello
  query?: Record<string, string | number | boolean>
  // These props are not saved anywhere in the URL and only available through
  // `onRouteResolve()` callback or when calling `getRoute()` after the route
  // has loaded.
  props?: Record<string, any>
  // Wether to replace the current History entry
  replace?: boolean
}
```

####  `getRoute`

Whenever a route is resolved, the `getRoute` method will contain the resolved object, until the next route is navigated to. This is primarily useful within event listeners or async code, which isn't executed right when route is rendered.

The same object is also available in the `onRouteResolve()` listener.

```ts
interface ResolvedRoute extends Route {
  // The actual pathname that was navigated to eg. `/users/10`
  path: string
  // The base path of the valid route that was navigated to eg. `/users/:id`
  resolvedPath: string
  // The whole html string, which is then appended to the router root element
  renderedHtml: Element
  // The params object, which is extracted from the path eg. `{ id: 10 }`
  params?: object
  // Data returned by the loader function
  data: any
  hash: string
  query: Record<string, string>
  props: object
}
```

## Event listeners

Every listener function returns a stopper function, which removes the provided callback from being ran.

####  `onNavigation`

Runs the provided callback function whenever a route is navigated to. That means if a link is clicked or a `navigate()` function was called.

```ts
onNavigation((serializedRoute) => {})

interface SerializedRoute extends Route {
  path: string
  renderedHtml: Element | null
  hash: string
  query: Record<string, string>
  props: object
}
```

It is possible to cancel navigation to a route, by returning false from `onNavigation` callback. The navigation can be async, so you can fetch what you need before deciding to cancel the navigation or not.

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
```

## Other

####  `getRouterConfig`

Returns the base router object.

####  `getRouterRoot`

Returns the router root element, which was provided during initialization
