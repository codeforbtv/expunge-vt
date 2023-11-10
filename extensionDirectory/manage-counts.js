const jQuery = require('jquery'); 
window.$ = jQuery; 
window.jQuery = jQuery;
import { createApp } from 'vue';
import { createPinia } from 'pinia';

import ManageCounts from './components/manage-counts.vue';

const app = createApp(ManageCounts);
const pinia = createPinia();
app.use(pinia);
app.mount('#filing-app');