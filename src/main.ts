import { defineRouter, onRouteResolve } from './router'

import main from './routes/main.html?raw'
import other from './routes/other.html?raw'

const routes = {
  '/home': main,
  '/other/:id': other,
}

onRouteResolve((route) => {
  console.log(route)
})

defineRouter(routes).run('#app')
