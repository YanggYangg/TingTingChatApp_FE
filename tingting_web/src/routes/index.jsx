import config from '../config';
import Login from '../pages/Login';
import HomePage from '../pages/HomePage';
import RegisterPage from '../pages/RegisterPage';
import VerifyUser from '../pages/ForgotAccountPage/VerifyUser.jsx';
import EnterOTP from '../pages/ForgotAccountPage/EnterOTP.jsx';
import UpdateNewPass from '../pages/ForgotAccountPage/UpdateNewPass.jsx';
import VerifyOTP from '../pages/VerifyOTP/index.jsx';
import ProfileScreen from '../layouts/components/profile/ProfileScreen.jsx';

const publicRoutes = [
    {path: config.routes.login, component: Login},
    {path: config.routes.register, component: RegisterPage},
    {path: config.routes.homepage, component: HomePage},
    {path: config.routes.verifyOTP, component: VerifyOTP},
    {path: config.routes.profile, component: ProfileScreen},
];
const forgotPasswordRoutes = [
    {path: config.routes.verifyUser, component: VerifyUser},
    {path: config.routes.enterOTP, component: EnterOTP},
    {path: config.routes.updatePassword, component: UpdateNewPass},
    
    
];
const privateRoutes = [];
export { privateRoutes, publicRoutes, forgotPasswordRoutes};