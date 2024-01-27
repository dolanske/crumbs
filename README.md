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

####  `navigate`

####  `getRoute`

####  `onNavigation`

####  `onRouteResolve`

## Other

####  `getRouterConfig`

####  `getRouterRoot`
