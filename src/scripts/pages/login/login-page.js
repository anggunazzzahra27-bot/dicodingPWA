import StoryAPI from '../../data/api';

export default class LoginPage {
  async render() {
    return `
      <div class="container">
        <section class="auth-section">
          <header>
            <h1>Login Account</h1>
            <p>Login to share and post your stories</p>
            <div class="demo-info">
              <small><strong>New User?</strong> Please register first, then login with your account</small>
            </div>
          </header>
          
          <form id="login-form" class="auth-form" novalidate>
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
                autocomplete="current-password"
                aria-describedby="password-error"
                placeholder="Enter your password"
              />
              <span id="password-error" class="error-message" role="alert"></span>
            </div>
            
            <button type="submit" class="btn btn-primary" id="login-button">
              <span class="btn-text">Sign In</span>
              <span class="btn-loading" style="display: none;">Signing in...</span>
            </button>
            
            <div id="login-message" class="message" role="alert" aria-live="polite"></div>
          </form>
          
          <footer class="auth-footer">
            <p>Don't have an account? <a href="#/register">Sign up here</a></p>
          </footer>
        </section>
      </div>
    `;
  }

  async afterRender() {
    this._initializeLoginForm();
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

  _initializeLoginForm() {
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const messageDiv = document.getElementById('login-message');

    // Add real-time validation
    emailInput.addEventListener('blur', () => this._validateEmail(emailInput));
    passwordInput.addEventListener('blur', () => this._validatePassword(passwordInput));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const isEmailValid = this._validateEmail(emailInput);
      const isPasswordValid = this._validatePassword(passwordInput);
      
      if (!isEmailValid || !isPasswordValid) {
        return;
      }

      await this._handleLogin(form, loginButton, messageDiv);
    });
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
    
    if (password.length < 6) {
      this._showError(errorSpan, 'Password must be at least 6 characters');
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

  async _handleLogin(form, button, messageDiv) {
    const formData = new FormData(form);
    const loginData = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    // Show loading state
    this._setLoadingState(button, true);
    messageDiv.textContent = '';

    try {
      const result = await StoryAPI.login(loginData);
      
      this._showMessage(messageDiv, 'Login successful! Redirecting...', 'success');
      
      // Use View Transition API if available
      if ('startViewTransition' in document) {
        document.startViewTransition(() => {
          window.location.hash = '#/home';
        });
      } else {
        setTimeout(() => {
          window.location.hash = '#/home';
        }, 1000);
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
