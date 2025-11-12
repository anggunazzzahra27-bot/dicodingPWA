const BASE_URL = 'https://story-api.dicoding.dev/v1';

class StoryAPI {
  static async register(userData) {
    try {
      console.log('Attempting registration with:', { 
        name: userData.name, 
        email: userData.email 
      });
      
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password
        }),
      });

      const result = await response.json();
      console.log('Registration response:', { status: response.status, result });
      
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(result.message || 'Registration failed. Please check your input.');
        }
        throw new Error(result.message || 'Registration failed');
      }
      
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.message);
    }
  }

  static async login(userData) {
    try {
      console.log('Attempting login with:', { email: userData.email });
      
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password
        }),
      });

      const result = await response.json();
      console.log('Login response:', { status: response.status, result });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid email or password. Please check your credentials.');
        }
        throw new Error(result.message || 'Login failed');
      }
      
      // Store token in localStorage
      if (result.loginResult?.token) {
        localStorage.setItem('token', result.loginResult.token);
        localStorage.setItem('user', JSON.stringify(result.loginResult.user));
        console.log('Login successful, token stored');
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message);
    }
  }

  static async getAllStories() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/stories`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch stories');
      }
      
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async addStory(storyData) {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('description', storyData.description);
      formData.append('photo', storyData.photo);
      formData.append('lat', storyData.lat);
      formData.append('lon', storyData.lon);

      const response = await fetch(`${BASE_URL}/stories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to add story');
      }
      
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static getToken() {
    return localStorage.getItem('token');
  }

  static isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  static logout() {
    localStorage.removeItem('token');
  }
}

export default StoryAPI;