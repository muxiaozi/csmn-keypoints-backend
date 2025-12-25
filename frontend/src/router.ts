import { createRouter, createWebHistory } from 'vue-router'

import Home from './components/Home.vue'
import DeviceDetail from './components/DeviceDetail.vue'
import Record from './components/Record.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/devices/:device_id', component: DeviceDetail },
  { path: '/devices/:device_id/records/:record_id', component: Record },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router