import config from '../config';
import Login from '../pages/Login';
import HomePage from '../pages/HomePage';

import { privateRoutes, publicRoutes } from '../routes';

const publicRoutes = [
    {path: config.routes.login, component: Login},
    {path: config.routes.register, component: Login},
    {path: config.routes.homepage, component: HomePage},
    
    
];
const privateRoutes = [];
export { privateRoutes, publicRoutes };