import { createRouter, createWebHistory } from "vue-router";

import Home from "../views/home/index.vue";
import Editor from "../views/editor/index.vue";
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
    {
      path: "/editor/:id", // id 可以是数字或 "new"
      name: "Editor",
      component: Editor,
    },
  ],
});

export default router;
