import { LoginState, UserProfile } from './_types';
import { getApiBase } from './_utils';

export const fetchUserProfile = async (uname: string): Promise<UserProfile | null> => {
    if (!uname || !/^[a-zA-Z0-9]+$/.test(uname)) return null;
    try {
        const res = await fetch(`${getApiBase()}/api/users/profile?username=${encodeURIComponent(uname)}`, { credentials: 'include' });
        const data = await res.json().catch(() => ({} as any));
        if (data && data.status === 'ok' && data.data) return data.data as UserProfile;
        return null;
    } catch {
        return null;
    }
};

export const fetchLoginState = async (): Promise<LoginState | null> => {
    try {
        const res = await fetch(`${getApiBase()}/api/login/validateState`, { method: 'PUT', credentials: 'include' });
        const data = await res.json().catch(() => ({} as any));
        if (data && data.status === 'ok' && data.data) {
            return {
                user_id: data.data.user_id || '',
                user_name: data.data.user_name || '',
            };
        }
    } catch {
        // ignore
    }
    return null;
};

