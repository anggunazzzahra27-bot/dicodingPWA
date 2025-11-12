import StoryAPI from '../../data/api';

export default class RegisterPage {
  async render() {
    return `
      <div class="container">
        <section class="auth-section">
          <header>
            <h1>Register Account</h1>
            <p>Create your account and get started</p>
          </header>
          
          <form id="register-form" class="auth-form" novalidate>
            <div class="form-group">
              <label for="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                autocomplete="name"
                aria-describedby="name-error"
                placeholder="Enter your full name"
              />
              <span id="name-error" class="error-message" role="alert"></span>
            </div>
            
            <div class="form-group">
              <label for="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                autocomplete="email"
                aria-describedby="email-error"
                placeholder="Enter your email"
              />
              <span id="email-error" class="error-message" role="alert"></span>
            </div>
            
            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required 
                autocomplete="new-password"
                aria-describedby="password-error"
                placeholder="Create a strong password"
              />
              <span id="password-error" class="error-message" role="alert"></span>
            </div>
            
            <button type="submit" class="btn btn-primary" id="register-button">
              <span class="btn-text">Create Account</span>
              <span class="btn-loading" style="display: none;">Creating account...</span>
            </button>
            
            <div id="register-message" class="message" role="alert" aria-live="polite"></div>
          </form>
          
          <footer class="auth-footer">
            <p>Already have an account? <a href="#/login">Sign in here</a></p>
          </footer>
        </section>
      </div>
    `;
  }

  async afterRender() {
    this._initializeRegisterForm();
    this._clearAllErrors(); // Clear any error messages on load
  }

  _clearAllErrors() {
    // Clear all error messages when page loads
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      element.textContent = '';
      element.style.display = 'none';
      if (element.parentElement) {
        element.parentElement.classList.remove('error');
      }
    });
  }

  _initializeRegisterForm() {
    const form = document.getElementById('register-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const registerButton = document.getElementById('register-button');
    const messageDiv = document.getElementById('register-message');

    // Add real-time validation
    nameInput.addEventListener('blur', () => this._validateName(nameInput));
    emailInput.addEventListener('blur', () => this._validateEmail(emailInput));
    passwordInput.addEventListener('blur', () => this._validatePassword(passwordInput));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const isNameValid = this._validateName(nameInput);
      const isEmailValid = this._validateEmail(emailInput);
      const isPasswordValid = this._validatePassword(passwordInput);
      
      if (!isNameValid || !isEmailValid || !isPasswordValid) {
        return;
      }

      await this._handleRegister(form, registerButton, messageDiv);
    });
  }

  _validateName(nameInput) {
    const name = nameInput.value.trim();
    const errorSpan = document.getElementById('name-error');
    
    if (!name) {
      this._showError(errorSpan, 'Name is required');
      return false;
    }
    
    if (name.length < 2) {
      this._showError(errorSpan, 'Name must be at least 2 characters');
      return false;
    }
    
    this._clearError(errorSpan);
    return true;
  }

  _validateEmail(emailInput) {
    const email = emailInput.value.trim();
    const errorSpan = document.getElementById('email-error');
    
    if (!email) {
      this._showError(errorSpan, 'Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this._showError(errorSpan, 'Please enter a valid email address');
      return false;
    }
    
    this._clearError(errorSpan);
    return true;
  }

  _validatePassword(passwordInput) {
    const password = passwordInput.value;
    const errorSpan = document.getElementById('password-error');
    
    if (!password) {
      this._showError(errorSpan, 'Password is required');
      return false;
    }
    
    if (password.length < 8) {
      this._showError(errorSpan, 'Password must be at least 8 characters');
      return false;
    }
    
    this._clearError(errorSpan);
    return true;
  }

  _showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.parentElement.classList.add('error');
  }

  _clearError(errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
    errorElement.parentElement.classList.remove('error');
  }

  async _handleRegister(form, button, messageDiv) {
    const formData = new FormData(form);
    const registerData = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    };

    // Show loading state
    this._setLoadingState(button, true);
    messageDiv.textContent = '';

    try {
      const result = await StoryAPI.register(registerData);
      
      this._showMessage(messageDiv, 'Registration successful! Please login with your credentials.', 'success');
      
      // Use View Transition API if available
      if ('startViewTransition' in document) {
        document.startViewTransition(() => {
          setTimeout(() => {
            window.location.hash = '#/login';
          }, 2000);
        });
      } else {
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 2000);
      }
      
    } catch (error) {
      this._showMessage(messageDiv, error.message, 'error');
    } finally {
      this._setLoadingState(button, false);
    }
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
