import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import StoryAPI from '../data/api';
import PushNotification from '../utils/push';

class App {
  #content = null;
  #deferredPrompt = null;

  constructor({ content }) {
    this.#content = content;
    this._setupNavigation();
    this._updateNavigation();
    this._InstallSW();
  }

  async _InstallSW() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        await navigator.serviceWorker.ready;

        await PushNotification.init();

        await this._setupNotificationToggle();

        this._setupServiceWorkerMessages();

        console.log('Push notification initialized');
        window.addEventListener('beforeinstallprompt', (e) => {
          console.log('beforeinstallprompt active');
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async _setupNotificationToggle() {
    const toggle = document.getElementById('notification-toggle');
    const status = document.getElementById('notification-status');

    if (!toggle || !status) {
      console.warn('Notification toggle elements not found');
      return;
    }

    try {
      const isSubscribed = await PushNotification.isSubscribed();
      toggle.checked = isSubscribed;
      status.textContent = `Notifikasi: ${isSubscribed ? 'On' : 'Off'}`;

      toggle.addEventListener('change', async (e) => {
        const isChecked = e.target.checked;

        try {
          if (isChecked) {
            if (!StoryAPI.isLoggedIn()) {
              alert('Please login first to enable notifications');
              e.target.checked = false;
              return;
            }

            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
              alert(
                'Notification permission denied. Please enable it in your browser settings.'
              );
              e.target.checked = false;
              return;
            }
            await PushNotification.subscribe();
            status.textContent = 'Notifikasi: On';

            this._showLocalNotification(
              'Notifikasi Diaktifkan',
              'Anda akan menerima notifikasi saat ada story baru!'
            );
          } else {
            await PushNotification.unsubscribe();
            status.textContent = 'Notifikasi: Off';

            alert('Notifikasi telah dinonaktifkan');
          }
        } catch (error) {
          console.error('Error toggling notification:', error);

          e.target.checked = !isChecked;

          alert('Gagal mengubah pengaturan notifikasi: ' + error.message);
        }
      });
    } catch (error) {
      console.error('Error setting up notification toggle:', error);
    }
  }
  _setupServiceWorkerMessages() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.action === 'navigate') {
          const url = event.data.url.replace(/^\/#/, '#');
          window.location.hash = url;
        }
      });
    }
  }
  _showLocalNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
      });
    }
  }
  _setupNavigation() {
    // Setup mobile menu toggle
    const drawerButton = document.getElementById('drawer-button');
    const navLinks = document.querySelector('.nav-links');

    if (drawerButton && navLinks) {
      drawerButton.addEventListener('click', () => {
        navLinks.classList.toggle('open');
      });

      // Close mobile menu when clicking outside
      document.addEventListener('click', (event) => {
        if (
          !navLinks.contains(event.target) &&
          !drawerButton.contains(event.target)
        ) {
          navLinks.classList.remove('open');
        }
      });

      // Close mobile menu when clicking nav links
      navLinks.addEventListener('click', (event) => {
        if (event.target.classList.contains('nav-link')) {
          navLinks.classList.remove('open');
        }
      });
    }

    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        StoryAPI.logout();

        if ('startViewTransition' in document) {
          document.startViewTransition(() => {
            window.location.hash = '#/login';
            this._updateNavigation();
          });
        } else {
          window.location.hash = '#/login';
          this._updateNavigation();
        }
      });
    }

    // Update active nav link on hash change
    window.addEventListener('hashchange', () => {
      this._updateActiveNavLink();
    });

    this._updateActiveNavLink();
  }

  _updateActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentHash = window.location.hash || '#/home';

    navLinks.forEach((link) => {
      if (link.getAttribute('href') === currentHash) {
        link.style.background = 'rgba(255,255,255,0.2)';
      } else {
        link.style.background = '';
      }
    });
  }

  async _updateNavigation() {
    const logoutBtn = document.getElementById('logout-btn');
    const loginLink = document.querySelector('a[href="#/login"]');
    const registerLink = document.querySelector('a[href="#/register"]');
    const isLoggedIn = StoryAPI.isLoggedIn();

    if (isLoggedIn) {
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (loginLink) loginLink.style.display = 'none';
      if (registerLink) registerLink.style.display = 'none';
    } else {
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (loginLink) loginLink.style.display = 'block';
      if (registerLink) registerLink.style.display = 'block';
    }
    if (isLoggedIn) {
      try {
        const isSubscribed = await PushNotification.isSubscribed();
        const toggle = document.getElementById('notification-toggle');
        const status = document.getElementById('notification-status');

        if (toggle && status) {
          toggle.checked = isSubscribed;
          status.textContent = `Notifikasi: ${isSubscribed ? 'On' : 'Off'}`;
        }
      } catch (error) {
        console.error('Error updating notification status:', error);
      }
    }
    this._updateActiveNavLink();
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    if (!page) {
      // Redirect to home if route not found
      window.location.hash = '#/home';
      return;
    }

    // Use View Transition API if available
    if ('startViewTransition' in document) {
      document.startViewTransition(async () => {
        await this._renderPageContent(page);
      });
    } else {
      await this._renderPageContent(page);
    }

    // Update navigation after rendering
    this._updateNavigation();
  }

  async _renderPageContent(page) {
    try {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
    } catch (error) {
      console.error('Error rendering page:', error);
      this.#content.innerHTML = `
        <div class="container">
          <div class="error-page">
            <h1>Oops! Something went wrong</h1>
            <p>We encountered an error while loading the page. Please try again.</p>
            <a href="#/home" class="btn btn-primary">Go to Home</a>
          </div>
        </div>
      `;
    }
  }
}

export default App;
