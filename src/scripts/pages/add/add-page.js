import L from 'leaflet';
import StoryAPI from '../../data/api';

export default class AddStoryPage {
  constructor() {
    this.map = null;
    this.selectedLocation = null;
    this.locationMarker = null;
  }

  async render() {
    if (!StoryAPI.isLoggedIn()) {
      return `
        <div class="container">
          <section class="auth-required">
            <h1>Authentication Required</h1>
            <p>Please login to add a new story.</p>
            <a href="#/login" class="btn btn-primary">Login</a>
          </section>
        </div>
      `;
    }

    return `
      <div class="container">
        <section class="add-story-section">
          <header>
            <h1>Add Your Story</h1>
            <p>Upload a photo and post it</p>
          </header>

          <form id="add-story-form" class="add-story-form" novalidate enctype="multipart/form-data">
            <div class="form-group">
              <label for="story-name">Story Title</label>
              <input 
                type="text" 
                id="story-name" 
                name="name" 
                required 
                aria-describedby="story-name-error"
                placeholder="Give your story a catchy title"
              />
              <span id="story-name-error" class="error-message" role="alert"></span>
            </div>

            <div class="form-group">
              <label for="story-description">Story Description</label>
              <textarea 
                id="story-description" 
                name="description" 
                required 
                rows="4"
                aria-describedby="story-description-error"
                placeholder="Describe your experience, what happened, what you felt..."
              ></textarea>
              <span id="story-description-error" class="error-message" role="alert"></span>
            </div>

            <div class="form-group">
              <label for="story-photo">Photo</label>
              <input 
                type="file" 
                id="story-photo" 
                name="photo" 
                accept="image/*" 
                required 
                aria-describedby="story-photo-error"
              />
              <span id="story-photo-error" class="error-message" role="alert"></span>
              <div id="photo-preview" class="photo-preview" style="display: none;">
                <img id="preview-image" alt="Photo preview" />
              </div>
            </div>

            <div class="form-group">
              <label for="location-section">Location</label>
              <div id="location-section">
                <p class="location-instruction">Click on the map to select the location where your story happened</p>
                <div id="selected-location" class="selected-location" style="display: none;">
                  <span class="location-icon">📍</span>
                  <span id="location-text"></span>
                  <button type="button" id="clear-location" class="btn-clear" aria-label="Clear selected location">✕</button>
                </div>
                <div id="map-add" class="map-container" style="height: 400px; width: 100%;"></div>
                <span id="location-error" class="error-message" role="alert"></span>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" id="cancel-button" class="btn btn-secondary">Cancel</button>
              <button type="submit" id="submit-button" class="btn btn-primary">
                <span class="btn-text">Share Story</span>
                <span class="btn-loading" style="display: none;">Sharing...</span>
              </button>
            </div>

            <div id="add-story-message" class="message" role="alert" aria-live="polite"></div>
          </form>
        </section>
      </div>
    `;
  }

  async afterRender() {
    if (!StoryAPI.isLoggedIn()) {
      return;
    }

    this._initializeForm();
    this._initializeMap();
  }

  _initializeForm() {
    const form = document.getElementById('add-story-form');
    const nameInput = document.getElementById('story-name');
    const descriptionInput = document.getElementById('story-description');
    const photoInput = document.getElementById('story-photo');
    const submitButton = document.getElementById('submit-button');
    const cancelButton = document.getElementById('cancel-button');
    const messageDiv = document.getElementById('add-story-message');

    // Form validation
    nameInput.addEventListener('blur', () => this._validateName(nameInput));
    descriptionInput.addEventListener('blur', () =>
      this._validateDescription(descriptionInput)
    );
    photoInput.addEventListener('change', (e) => this._handlePhotoChange(e));

    // Form submission
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this._handleSubmit(form, submitButton, messageDiv);
    });

    // Cancel button
    cancelButton.addEventListener('click', () => {
      if ('startViewTransition' in document) {
        document.startViewTransition(() => {
          window.location.hash = '#/home';
        });
      } else {
        window.location.hash = '#/home';
      }
    });

    // Clear location button
    const clearLocationBtn = document.getElementById('clear-location');
    if (clearLocationBtn) {
      clearLocationBtn.addEventListener('click', () => {
        this._clearSelectedLocation();
      });
    }
  }

  _initializeMap() {
    const mapDiv = document.getElementById('map-add');
    if (!mapDiv) return;

    // Initialize map centered on Indonesia
    this.map = L.map('map-add').setView([-6.2088, 106.8456], 5);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Handle map click to select location
    this.map.on('click', (e) => {
      this._selectLocation(e.latlng);
    });
  }

  _selectLocation(latlng) {
    const { lat, lng } = latlng;

    // Remove existing marker
    if (this.locationMarker) {
      this.map.removeLayer(this.locationMarker);
    }

    // Add new marker
    this.locationMarker = L.marker([lat, lng]).addTo(this.map);

    // Store selected location
    this.selectedLocation = { lat, lon: lng };

    // Update UI
    const selectedLocationDiv = document.getElementById('selected-location');
    const locationText = document.getElementById('location-text');

    locationText.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}`;
    selectedLocationDiv.style.display = 'flex';

    // Clear any location error
    const errorSpan = document.getElementById('location-error');
    this._clearError(errorSpan);
  }

  _clearSelectedLocation() {
    if (this.locationMarker) {
      this.map.removeLayer(this.locationMarker);
      this.locationMarker = null;
    }

    this.selectedLocation = null;

    const selectedLocationDiv = document.getElementById('selected-location');
    selectedLocationDiv.style.display = 'none';
  }

  _handlePhotoChange(event) {
    const file = event.target.files[0];
    const errorSpan = document.getElementById('story-photo-error');
    const previewDiv = document.getElementById('photo-preview');
    const previewImage = document.getElementById('preview-image');

    if (!file) {
      previewDiv.style.display = 'none';
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this._showError(errorSpan, 'Please select a valid image file');
      previewDiv.style.display = 'none';
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      this._showError(errorSpan, 'Image size must be less than 2MB');
      previewDiv.style.display = 'none';
      return;
    }

    this._clearError(errorSpan);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewDiv.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  _validateName(nameInput) {
    const name = nameInput.value.trim();
    const errorSpan = document.getElementById('story-name-error');

    if (!name) {
      this._showError(errorSpan, 'Story title is required');
      return false;
    }

    if (name.length < 3) {
      this._showError(errorSpan, 'Title must be at least 3 characters');
      return false;
    }

    this._clearError(errorSpan);
    return true;
  }

  _validateDescription(descriptionInput) {
    const description = descriptionInput.value.trim();
    const errorSpan = document.getElementById('story-description-error');

    if (!description) {
      this._showError(errorSpan, 'Story description is required');
      return false;
    }

    if (description.length < 10) {
      this._showError(errorSpan, 'Description must be at least 10 characters');
      return false;
    }

    this._clearError(errorSpan);
    return true;
  }

  _validatePhoto() {
    const photoInput = document.getElementById('story-photo');
    const errorSpan = document.getElementById('story-photo-error');

    if (!photoInput.files || !photoInput.files[0]) {
      this._showError(errorSpan, 'Please select a photo');
      return false;
    }

    return true;
  }

  _validateLocation() {
    const errorSpan = document.getElementById('location-error');

    if (!this.selectedLocation) {
      this._showError(errorSpan, 'Please select a location on the map');
      return false;
    }

    return true;
  }

  async _handleSubmit(form, button, messageDiv) {
    const nameInput = document.getElementById('story-name');
    const descriptionInput = document.getElementById('story-description');

    // Validate all fields
    const isNameValid = this._validateName(nameInput);
    const isDescriptionValid = this._validateDescription(descriptionInput);
    const isPhotoValid = this._validatePhoto();
    const isLocationValid = this._validateLocation();

    if (
      !isNameValid ||
      !isDescriptionValid ||
      !isPhotoValid ||
      !isLocationValid
    ) {
      return;
    }

    // Show loading state
    this._setLoadingState(button, true);
    messageDiv.textContent = '';

    try {
      const formData = new FormData(form);
      const storyData = {
        description: formData.get('description'),
        photo: formData.get('photo'),
        lat: this.selectedLocation.lat,
        lon: this.selectedLocation.lon,
      };

      const result = await StoryAPI.addStory(storyData);

      this._showMessage(
        messageDiv,
        'Story shared successfully! Redirecting to home...',
        'success'
      );

      // Redirect to home page
      if ('startViewTransition' in document) {
        document.startViewTransition(() => {
          setTimeout(() => {
            window.location.hash = '#/home';
          }, 1500);
        });
      } else {
        setTimeout(() => {
          window.location.hash = '#/home';
        }, 1500);
      }
    } catch (error) {
      this._showMessage(messageDiv, `Error: ${error.message}`, 'error');
    } finally {
      this._setLoadingState(button, false);
    }
  }

  _showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.parentElement.classList.add('error');
  }

  _clearError(errorElement) {
    errorElement.textContent = '';
    errorElement.parentElement.classList.remove('error');
  }

  _setLoadingState(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');

    if (isLoading) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
      button.disabled = true;
    } else {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      button.disabled = false;
    }
  }

  _showMessage(messageElement, text, type) {
    messageElement.textContent = text;
    messageElement.className = `message ${type}`;
  }
}
