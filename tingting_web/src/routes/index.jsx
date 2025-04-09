import config from '../config';
import Login from '../pages/Login';
import HomePage from '../pages/HomePage';
import RegisterPage from '../pages/RegisterPage';
import VerifyUser from '../pages/ForgotAccountPage/VerifyUser.jsx';
import EnterOTP from '../pages/ForgotAccountPage/enterOTP.jsx';
import UpdateNewPass from '../pages/ForgotAccountPage/UpdateNewPass.jsx';


const publicRoutes = [
    {path: config.routes.login, component: Login},
    {path: config.routes.register, component: RegisterPage},
    {path: config.routes.homepage, component: HomePage},

    
];
const forgotPasswordRoutes = [
    {path: config.routes.verifyUser, component: VerifyUser},
    {path: config.routes.enterOTP, component: EnterOTP},
    {path: config.routes.updatePassword, component: UpdateNewPass},
    
    
];
const privateRoutes = [];
export { privateRoutes, publicRoutes, forgotPasswordRoutes};