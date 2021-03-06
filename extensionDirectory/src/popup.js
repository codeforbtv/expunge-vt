import Vue from 'vue/dist/vue';
import './button-counter';

var app = new Vue({
  el: '#app-container',
  data: {
    message: `Hello from popup.js at ${Date.now()}!`
  }
});
