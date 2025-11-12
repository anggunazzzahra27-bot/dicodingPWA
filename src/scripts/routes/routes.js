import HomePage from '../pages/home/home-page';
import LoginPage from '../pages/login/login-page';
import RegisterPage from '../pages/register/register-page';
import AddStoryPage from '../pages/add/add-page';
import StoryOffline from '../pages/detail/story';

const routes = {
  '/': new HomePage(),
  '/home': new HomePage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/add': new AddStoryPage(),
  '/my-story': new StoryOffline(),
};

export default routes;
