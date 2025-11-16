import storyIndexDB from '../../utils/indexdb';

class MyStoryPage {
  async render() {
    return `
      <div class="container">
        <h1>My Stories</h1>
        
        <div class="story-controls">
          <button id="refresh-btn" class="btn btn-primary">Refresh dari Server</button>
          <button id="sync-btn" class="btn btn-success">Sync Pending Stories</button>
        </div>

        <div id="stories-container" class="stories-grid">
          <p class="loading">Loading stories...</p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await this.loadStories();
    this.attachEventListeners();
  }

  async loadStories(refresh = false) {
    const container = document.getElementById('stories-container');

    try {
      const stories = await storyIndexDB.getAllStories(refresh);

      if (stories.length === 0) {
        container.innerHTML =
          '<p class="empty">Belum ada story. Buat story pertama Anda!</p>';
        return;
      }

      container.innerHTML = stories
        .map((story) => this.createStoryCard(story))
        .join('');

      this.attachStoryCardListeners();
    } catch (error) {
      console.error('Error loading stories:', error);
      container.innerHTML =
        '<p class="error">Error loading stories. Please try again.</p>';
    }
  }

  createStoryCard(story) {
    const syncBadge =
      story.syncStatus === 'pending'
        ? '<span class="badge badge-warning">Belum Tersinkron</span>'
        : '<span class="badge badge-success">Tersinkron</span>';

    return `
      <div class="story-card" data-id="${story.id}">
        ${
          story.photoUrl
            ? `<img src="${story.photoUrl}" alt="Story photo" class="story-img">`
            : '<div class="story-img-placeholder">No Photo</div>'
        }
        <div class="story-content">
          <p class="story-description">${
            story.description || 'No description'
          }</p>
          <small class="story-date">${new Date(
            story.createdAt
          ).toLocaleDateString('id-ID')}</small>
          ${syncBadge}
        </div>
        <div class="story-actions">
          <button class="btn btn-sm btn-info view-btn" data-id="${
            story.id
          }">Lihat</button>
          <button class="btn btn-sm btn-warning edit-btn" data-id="${
            story.id
          }">Edit</button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${
            story.id
          }">Hapus</button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    document
      .getElementById('refresh-btn')
      ?.addEventListener('click', async () => {
        const btn = document.getElementById('refresh-btn');
        btn.disabled = true;
        btn.textContent = 'Refreshing...';

        await this.loadStories(true);

        btn.disabled = false;
        btn.textContent = 'Refresh dari Server';
      });

    document.getElementById('sync-btn')?.addEventListener('click', async () => {
      await this.syncPendingStories();
    });
  }

  attachStoryCardListeners() {
    document.querySelectorAll('.view-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await this.viewStory(id);
      });
    });

    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await this.editStory(id);
      });
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await this.deleteStory(id);
      });
    });
  }

  async viewStory(id) {
    try {
      const story = await storyIndexDB.displayStory(id);

      if (story) {
        alert(
          `Story Details:\n\nDescription: ${
            story.description
          }\nCreated: ${new Date(story.createdAt).toLocaleString(
            'id-ID'
          )}\nStatus: ${story.syncStatus}`
        );
      }
    } catch (error) {
      console.error('Error viewing story:', error);
      alert('Error loading story details');
    }
  }

  async editStory(id) {
    try {
      const story = await storyIndexDB.getStoryById(id);

      if (!story) {
        alert('Story not found');
        return;
      }

      const newDescription = prompt('Edit description:', story.description);

      if (newDescription && newDescription !== story.description) {
        await storyIndexDB.updateStory(id, {
          description: newDescription,
          syncStatus: 'pending',
        });

        alert('Story updated successfully!');
        await this.loadStories();
      }
    } catch (error) {
      console.error('Error editing story:', error);
      alert('Error updating story');
    }
  }

  async deleteStory(id) {
    if (!confirm('Yakin ingin menghapus story ini?')) {
      return;
    }

    try {
      const success = await storyIndexDB.deleteStory(id);

      if (success) {
        alert('Story deleted successfully!');
        await this.loadStories();
      } else {
        alert('Failed to delete story');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Error deleting story');
    }
  }

  async syncPendingStories() {
    const btn = document.getElementById('sync-btn');
    btn.disabled = true;
    btn.textContent = 'Syncing...';

    try {
      const result = await storyIndexDB.syncPending();

      alert(`${result.message}\nSynced: ${result.synced}/${result.total}`);

      if (result.synced > 0) {
        await this.loadStories(true);
      }
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Error syncing stories');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sync Pending Stories';
    }
  }
}

export default MyStoryPage;
