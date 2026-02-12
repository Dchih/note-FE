import { createRouter, createWebHistory } from "vue-router";

import Home from "../views/home/index.vue";
import Login from "../views/login/index.vue";
import Register from "../views/register/index.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/login",
      name: "Login",
      component: Login,
    },
    {
      path: "/register",
      name: "Register",
      component: Register,
    },
    {
      path: "/home",
      name: "Home",
      component: Home,
    },
  ],
});

export default router;
