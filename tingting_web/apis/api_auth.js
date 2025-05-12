import axios from 'axios';
import { ApiManager } from './ApiManager';

const BASE_URL = 'http://localhost:3002';

export const Api_Auth = {
    login: async (data) => {
        return ApiManager.post('authService', 'api/v1/auth/sign-in', data);
    },
    generate_token: async (data) => {
        return ApiManager.post('authService','api/v1/auth/generate-token', data);
    },
    resent_otp: async (data) => {
        return ApiManager.post('authService','api/v1/auth/resent-otp', data);
    },
    signUp: async (data) => {
        return ApiManager.post('authService','api/v1/auth/sign-up', data);
    },
    create_account: async (data) => {
        return ApiManager.post('authService','api/v1/auth/create-account', data);
    },
    logout: async (data) => {
        return ApiManager.post('authService','api/v1/auth/sign-out', data);
    },
    forgotPassword: async (data) => {
        return ApiManager.post('authService','api/v1/auth/forgot-password', data);
    },
    verifyOTP: async (data) => {
        return ApiManager.post('authService','api/v1/auth/verify-otp', data);
    },
    updateNewPassword: async (data) => {
        return ApiManager.post('authService','api/v1/auth/update-password', data);
    },
    changePassword: async (data) => {
        return ApiManager.post('authService', `api/v1/auth/change-password`,data);
    }


};
