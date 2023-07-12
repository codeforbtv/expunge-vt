const jQuery = require('jquery'); 
window.$ = jQuery; 
window.jQuery = jQuery;
import { createApp } from 'vue';

import Filings from './components/filings.vue';

var app = createApp(Filings).mount('#filing-app');