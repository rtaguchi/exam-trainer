import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Setting from '@/views/Setting.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Setting',
    component: Setting
  },
  {
    path: '/answering',
    name: 'Answering',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "Answering" */ '@/views/Answering.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
