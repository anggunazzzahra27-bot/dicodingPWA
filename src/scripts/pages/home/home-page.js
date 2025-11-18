import L from 'leaflet';
import StoryAPI from '../../data/api';
import storyIndexDB from '../../utils/indexdb';
export default class HomePage {
  constructor() {
    this.map = null;
    this.stories = [];
  }

  async render() {
    return `
      <div class="container">
        <section class="hero-section">
          <div class="hero-content">
            <div class="hero-icon">📖</div>
            <h1 class="hero-title">Welcome to Story App</h1>
            <p class="hero-subtitle">Discover and share amazing stories from around the world.</p>
          </div>
        </section>

        <section class="stories-section">
          <header>
            <h2>Latest Stories</h2>
            <div class="view-controls">
              <button id="list-view" class="btn btn-secondary active" aria-label="List view">List</button>
              <button id="map-view" class="btn btn-secondary" aria-label="Map view">Map</button>
            </div>
          </header>

          <div class="stories-content">
            <div id="loading" class="loading" aria-live="polite">
              Loading stories...
            </div>

            <div id="error-message" class="error-message" role="alert" style="display: none;"></div>

            <div id="stories-container" style="display: none;">
              <div id="stories-list" class="stories-list"></div>
              <div id="map-container" class="map-container" style="display: none;">
                <div id="map" style="height: 500px; width: 100%;"></div>
              </div>
            </div>

            <div id="no-stories" class="no-stories" style="display: none;">
              <article>
                <h3>No Stories Yet</h3>
                <p>Be the first to share your story! <a href="#/add">Add your story here</a></p>
              </article>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  async afterRender() {
    await this._checkAuthAndLoadStories();
    this._initializeViewControls();
    this._initSaveAllButton();
  }

  async _checkAuthAndLoadStories() {
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error-message');
    const storiesContainer = document.getElementById('stories-container');
    const noStoriesDiv = document.getElementById('no-stories');

    if (!StoryAPI.isLoggedIn()) {
      loadingDiv.style.display = 'none';
      errorDiv.style.display = 'block';
      errorDiv.textContent = 'Please login to view stories.';

      const loginLink = document.createElement('a');
      loginLink.href = '#/login';
      loginLink.textContent = ' Login here';
      errorDiv.appendChild(loginLink);
      return;
    }

    try {
      const result = await StoryAPI.getAllStories();
      this.stories = result.listStory || [];

      loadingDiv.style.display = 'none';

      if (this.stories.length === 0) {
        noStoriesDiv.style.display = 'block';
      } else {
        storiesContainer.style.display = 'block';
        this._renderStoriesList();
        this._initializeMap();
      }
    } catch (error) {
      loadingDiv.style.display = 'none';
      errorDiv.style.display = 'block';
      errorDiv.textContent = `Error loading stories: ${error.message}`;
    }
  }

  _renderStoriesList() {
    const storiesListDiv = document.getElementById('stories-list');

    if (this.stories.length === 0) {
      storiesListDiv.innerHTML = '<p>No stories available.</p>';
      return;
    }

    const storiesHTML = this.stories
      .map(
        (story) => `
      <article class="story-card">
        <img 
          src="${story.photoUrl}" 
          alt="${story.name || 'Story image'}" 
          loading="lazy"
        />
        <div class="story-info">
          <h3 class="story-title">${story.name || 'Untitled Story'}</h3>
          <p class="story-description">${
            story.description || 'No description available'
          }</p>
          <div class="story-meta">
            <span class="story-location">${
              story.lat && story.lon
                ? `📍 Lat: ${story.lat.toFixed(2)}, Lon: ${story.lon.toFixed(
                    2
                  )}`
                : '📍 Location not available'
            }</span>
            <span class="story-date">${
              story.createdAt
                ? new Date(story.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Unknown date'
            }</span>
          </div>
          <button class="save-story-btn" data-id="${story.id}">Simpan</button>
        </div>
      </article>
    `
      )
      .join('');

    storiesListDiv.innerHTML = storiesHTML;
    const saveStoryBtns = document.querySelectorAll('.save-story-btn');
    saveStoryBtns.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const storyId = e.target.dataset.id;
        const story = this.stories.find((s) => s.id === storyId);
        if (story) {
          try {
            await storyIndexDB.saveToIDB({
              id: story.id,
              description: story.description,
              photoUrl: story.photoUrl,
              lat: story.lat,
              lon: story.lon,
              createdAt: story.createdAt,
              syncStatus: 'saved',
            });
            alert('Story berhasil disimpan!');
          } catch (err) {
            console.error(err);
            alert('Gagal menyimpan story');
          }
        }
      });
    });
  }

  _initializeMap() {
    const mapDiv = document.getElementById('map');

    if (!mapDiv || this.stories.length === 0) {
      return;
    }

    // Initialize map centered on Indonesia
    this.map = L.map('map').setView([-6.2088, 106.8456], 5);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Add markers for each story
    this.stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon]).addTo(this.map);

        const popupContent = `
          <div class="map-popup">
            <img src="${story.photoUrl}" alt="${
          story.name || 'Story image'
        }" style="width: 100%; max-width: 200px; height: auto; border-radius: 4px;"/>
            <h4>${story.name || 'Untitled Story'}</h4>
            <p>${story.description || 'No description available'}</p>
            <small>${
              story.createdAt
                ? new Date(story.createdAt).toLocaleDateString()
                : 'Unknown date'
            }</small>
          </div>
        `;

        marker.bindPopup(popupContent);
      }
    });

    // Fit map to show all markers
    if (this.stories.some((story) => story.lat && story.lon)) {
      const group = new L.featureGroup(
        this.stories
          .filter((story) => story.lat && story.lon)
          .map((story) => L.marker([story.lat, story.lon]))
      );
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  _initializeViewControls() {
    const listViewBtn = document.getElementById('list-view');
    const mapViewBtn = document.getElementById('map-view');
    const storiesListDiv = document.getElementById('stories-list');
    const mapContainerDiv = document.getElementById('map-container');

    if (!listViewBtn || !mapViewBtn) {
      return;
    }

    listViewBtn.addEventListener('click', () => {
      this._switchView(
        'list',
        listViewBtn,
        mapViewBtn,
        storiesListDiv,
        mapContainerDiv
      );
    });

    mapViewBtn.addEventListener('click', () => {
      this._switchView(
        'map',
        listViewBtn,
        mapViewBtn,
        storiesListDiv,
        mapContainerDiv
      );
    });
  }

  _switchView(view, listBtn, mapBtn, listDiv, mapDiv) {
    if (view === 'list') {
      listBtn.classList.add('active');
      mapBtn.classList.remove('active');
      listDiv.style.display = 'block';
      mapDiv.style.display = 'none';
    } else {
      mapBtn.classList.add('active');
      listBtn.classList.remove('active');
      listDiv.style.display = 'none';
      mapDiv.style.display = 'block';

      // Refresh map size when showing
      if (this.map) {
        setTimeout(() => {
          this.map.invalidateSize();
        }, 100);
      }
    }

    // Use View Transition API if available
    if ('startViewTransition' in document) {
      document.startViewTransition(() => {
        // View transition happens automatically
      });
    }
  }
  _initSaveAllButton() {
    const btn = document.getElementById('save-all-stories');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      try {
        for (const story of this.stories) {
          await storyIndexDB.saveToIDB({
            id: story.id,
            description: story.description,
            photoUrl: story.photoUrl,
            lat: story.lat,
            lon: story.lon,
            createdAt: story.createdAt,
            syncStatus: 'saved',
          });
        }

        alert('Semua story berhasil disimpan!');
      } catch (err) {
        console.error(err);
        alert('Gagal menyimpan semua story');
      }
    });
  }
}
