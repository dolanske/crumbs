import { createRouter } from './router'

import main from './routes/main.html?raw'
import other from './routes/other.html?raw'

const router = createRouter('#app', [
  {
    path: '/main',
    file: main,
  },
  {
    path: '/other',
    file: other,
    title: 'Hello other',
  },
])

router.replace('/main')
