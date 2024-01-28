import { defineRouter, onRouteResolve } from './router'

import main from './routes/main.html?raw'
import other from './routes/other.html?raw'

const routes = {
  '/home': main,
  '/other/:id': {
    html: other,
    fallback: '<span>Error loading APi</span>',
    async loader({ id }: { id: number }) {
      return fetch(`https://swapi.dev/api/people/${id}`)
        .then(r => r.json())
        .then(d => d)
    },
  },
}

defineRouter(routes).run('#app')

onRouteResolve('/other/:id', (route) => {
  // eslint-disable-next-line no-console
  console.log(route.data)
})
