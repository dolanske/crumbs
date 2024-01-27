# crumbs

SPA router for framework-less web applications using HTML files. This library assumes you're using it in an environment, which can import HTML files as strings.

## Usage

```ts
import { defineRouter } from './router'

import main from './routes/main.html?raw'
import other from './routes/other.html?raw'

const routes = {
  '/': main,
  '/users': '<span>User list...</span>',
  '/user/:id': {
    html: other,
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

---

## Other

####  `getRouterConfig`

####  `getRouterRoot`
