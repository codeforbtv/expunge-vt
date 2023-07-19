const jQuery = require('jquery'); 
window.$ = jQuery; 
window.jQuery = jQuery;
import { createApp } from 'vue';

import ManageCounts from './components/manage-counts.vue';

var app = createApp(ManageCounts).mount('#filing-app');