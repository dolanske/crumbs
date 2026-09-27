import type { Router } from './router'
import { defineRouter } from './router'

import main from './routes/main.page.html'
import other from './routes/other.page.html'

const routes: Router = {
  '/home': {
    html: main,
    title: 'Home page!!!!!!',
  },
  '/other/:id': {
    html: other,
    title: 'Other',
  },
}

// onRouteResolve((route) => {
//   console.log(route)
// })

defineRouter(routes).run('#app')
