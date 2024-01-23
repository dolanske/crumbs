import { createRouter } from './router'

import main from './routes/main.html?raw'
import other from './routes/other.html?raw'

export const router = createRouter([
  {
    path: '/main',
    template: main,
    default: true,
  },
  {
    path: '/other',
    template: other,
    title: 'Hello other',
    async loader() {
      return fetch('https://swapi.dev/api/people')
        .then(r => r.json())
        .then(d => d)
    },
  },
])

router.start('#app')
// router.replace('/main')
