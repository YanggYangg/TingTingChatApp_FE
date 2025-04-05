import config from '../config';
import Login from '../pages/Login';
import HomePage from '../pages/HomePage';
import RegisterPage from '../pages/RegisterPage';
import ForgotAccountPage from '../pages/ForgotAccountPage';
import { privateRoutes, publicRoutes } from '../routes';


const publicRoutes = [
    {path: config.routes.login, component: Login},
    {path: config.routes.register, component: RegisterPage},
    {path: config.routes.homepage, component: HomePage},
    {path: config.routes.forgotAccount, component: ForgotAccountPage},
    
];
const privateRoutes = [];
export { privateRoutes, publicRoutes };