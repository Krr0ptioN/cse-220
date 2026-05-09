import { getApiBaseUrl } from 'ui-common';

export const AUTH_ENDPOINTS = {
    csrf: () => `${getApiBaseUrl()}/api/v1/auth/csrf/`,
    register: () => `${getApiBaseUrl()}/api/v1/auth/register/`,
    login: () => `${getApiBaseUrl()}/api/v1/auth/login/`,
    logout: () => `${getApiBaseUrl()}/api/v1/auth/logout/`,
    me: () => `${getApiBaseUrl()}/api/v1/auth/me/`,
};
