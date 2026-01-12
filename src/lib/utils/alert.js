import { alertStore } from '$lib/stores/alert';

/**
 * Vervangt alert() met een custom alert
 * @param {string} message - de tekst die getoond wordt
 * @param {'info'|'success'|'error'} [type='info'] - type styling
 * @param {number} [duration=0] - duur in ms waarna de alert automatisch sluit
 */
export function showAlert(message, type = 'info', duration = 0) {
  alertStore.set({ show: true, message, type });

  if (duration > 0) {
    setTimeout(() => {
      alertStore.set({ show: false, message: '', type: 'info' });
    }, duration);
  }
}
