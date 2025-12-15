import { writable } from 'svelte/store';

export const alertStore = writable({
  show: false,       
  message: '',       
  type: 'info'       // type: 'info', 'success', 'error'
});
