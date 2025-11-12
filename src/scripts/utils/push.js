const VAPID_KEY =
  'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
const BASE_URL = 'https://story-api.dicoding.dev/v1';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const PushNotification = {
  registration: null,

  async init() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (!('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      console.log('Push notification initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize push notification:', error);
      return false;
    }
  },

  async isSubscribed() {
    try {
      if (!this.registration) {
        await this.init();
      }

      const subscription =
        await this.registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  },

  async subscribe() {
    try {
      if (!this.registration) {
        await this.init();
      }

      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      let subscription = await this.registration.pushManager.getSubscription();

      if (subscription) {
        console.log('Already subscribed to push notifications');
        return subscription;
      }

      subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      });

      console.log('Push subscription created:', subscription);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('User not logged in');
      }

      const subscriptionJSON = subscription.toJSON();

      const response = await fetch(`${BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscriptionJSON.endpoint,
          keys: subscriptionJSON.keys,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to subscribe on server');
      }

      const result = await response.json();
      console.log('Subscription registered on server:', result);

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  },

  async unsubscribe() {
    try {
      if (!this.registration) {
        await this.init();
      }

      const subscription =
        await this.registration.pushManager.getSubscription();

      if (!subscription) {
        console.log('No active subscription found');
        return true;
      }

      const subscriptionJSON = subscription.toJSON();
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`${BASE_URL}/notifications/subscribe`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              endpoint: subscriptionJSON.endpoint,
            }),
          });

          if (!response.ok) {
            console.warn(
              'Failed to unsubscribe from server, but continuing...'
            );
          } else {
            console.log('Unsubscribed from server');
          }
        } catch (error) {
          console.warn('Error unsubscribing from server:', error);
        }
      }

      const success = await subscription.unsubscribe();

      if (success) {
        console.log('Successfully unsubscribed from push notifications');
      }

      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  },

  async getSubscription() {
    try {
      if (!this.registration) {
        await this.init();
      }

      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  },
};

export default PushNotification;
