import { createRouter, createWebHistory } from 'vue-router'
import InvitationView from '../views/InvitationView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'invitation', component: InvitationView },
    {
      path: '/guest-snap',
      name: 'guest-snap-upload',
      component: () => import('../views/GuestSnapUpload.vue'),
    },
    {
      path: '/guest-snap/album',
      name: 'guest-snap-album',
      component: () => import('../views/GuestSnapAlbum.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
