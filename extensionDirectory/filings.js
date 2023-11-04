const jQuery = require('jquery'); 
window.$ = jQuery; 
window.jQuery = jQuery;
import { createApp } from 'vue';
import { createPinia } from 'pinia';

import Filings from './components/filings.vue';

const app = createApp(Filings);
const pinia = createPinia();
app.use(pinia);
app.mount('#filing-app');