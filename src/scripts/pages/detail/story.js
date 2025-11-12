import storyIndexDB from '../../utils/indexdb';

export default class StoryOffline {
  async render() {
    return `
      <div class="container">
        <section class="my-story-section">
            <h1>My Stories</h1>
            <p>Manage your stories and sync offline data</p>

          <div class="controls">
            <input 
              id="search" 
              type="text"
              placeholder="Search stories..." 
              class="search-input"
            />
            
            <select id="filter" class="filter-select">
              <option value="all">All Stories</option>
              <option value="synced">Synced</option>
              <option value="pending">Pending Sync</option>
            </select>

            <button id="sync-btn" class="btn btn-primary">
              Sync My Story
            </button>
          </div>

          <div id="sync-message" class="message" style="display: none;"></div>
          
          <div id="stories" class="stories-grid"></div>
        </section>
      </div>
    `;
  }

  async afterRender() {
    await this.loadStories();

    document.getElementById('search').addEventListener('input', async (e) => {
      await this.search(e.target.value);
    });

    document.getElementById('filter').addEventListener('change', async (e) => {
      await this.filter(e.target.value);
    });

    document.getElementById('sync-btn').addEventListener('click', async () => {
      await this.syncOfflineStories();
    });

    window.addEventListener('online', async () => {
      console.log('Back online, attempting sync...');
      await this.syncOfflineStories();
    });
  }

  async loadStories() {
    const stories = await storyIndexDB.getAllStories(true);
    this.displayStories(stories);
  }

  async search(keyword) {
    const stories = await storyIndexDB.searchStories(keyword);
    this.displayStories(stories);
  }

  async filter(type) {
    const stories = await storyIndexDB.filterStories(type);
    this.displayStories(stories);
  }

  displayStories(stories) {
    const container = document.getElementById('stories');

    if (!stories || stories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No stories found</p>
        </div>
      `;
      return;
    }

    const html = stories
      .map(
        (story) => `
        <div class="story-card" data-id="${story.id}">
          ${story.photo ? `<img src="${story.photo}" alt="Story photo" />` : ''}
          <div class="story-content">
            <h3>${story.description || 'No description'}</h3>
            <div class="story-meta">
              <span class="status status-${story.syncStatus}">
                ${story.syncStatus === 'synced' ? 'Synced' : 'Pending'}
              </span>
              <span class="date">
                ${new Date(story.createdAt).toLocaleDateString('id-ID')}
              </span>
            </div>
            <button 
              class="btn btn-danger btn-delete" 
              data-id="${story.id}"
            >
              Delete
            </button>
          </div>
        </div>
      `
      )
      .join('');

    container.innerHTML = html;

    const deleteButtons = container.querySelectorAll('.btn-delete');
    deleteButtons.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this story?')) {
          await this.deleteStory(id);
        }
      });
    });
  }

  async deleteStory(id) {
    try {
      await storyIndexDB.deleteStory(id);
      await this.loadStories();
      this.showMessage('Story deleted successfully', 'success');
    } catch (error) {
      this.showMessage('Failed to delete story', 'error');
    }
  }

  async syncOfflineStories() {
    const syncBtn = document.getElementById('sync-btn');
    const messageDiv = document.getElementById('sync-message');

    if (!navigator.onLine) {
      this.showMessage('Cannot sync: No internet connection', 'error');
      return;
    }

    syncBtn.disabled = true;
    syncBtn.textContent = 'Syncing...';

    try {
      const result = await storyIndexDB.syncPending();

      if (result.synced > 0) {
        this.showMessage(
          `Successfully synced ${result.synced} story(ies)!`,
          'success'
        );
        await this.loadStories();
      } else {
        this.showMessage('No pending stories to sync', 'info');
      }
    } catch (error) {
      this.showMessage('Sync failed: ' + error.message, 'error');
    } finally {
      syncBtn.disabled = false;
      syncBtn.textContent = 'Sync Offline Stories';
    }
  }

  showMessage(text, type) {
    const messageDiv = document.getElementById('sync-message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
  }
}
