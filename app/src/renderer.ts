import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./pages/index.vue";

import "./css/index.css";

const pinia = createPinia();
createApp(App).use(pinia).mount("#app");
