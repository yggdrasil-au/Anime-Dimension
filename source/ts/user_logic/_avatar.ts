import { byId, qs } from './_dom';
import { storageKey, toDataUrl, getApiBase } from './_utils';
import type { UserProfile } from './_types';

export const toggleAvatarActions = (show: boolean): void => {
    const avatarActions = qs('.profile-avatar .avatar-actions');
    if (show) avatarActions?.classList.remove('d-none');
    else avatarActions?.classList.add('d-none');
};

export const applyInitialAvatar = (profile: UserProfile, username: string, isSelf: boolean): void => {
    const avatarImg = byId('userAvatar') as HTMLImageElement | null;
    const initialsEl = byId('avatarInitials');
    if (!avatarImg) return;
    const savedAvatar = localStorage.getItem(storageKey(username, 'avatar'));
    const remoteUrl = (profile.avatar_url || `/assets/images/users/avatars/${encodeURIComponent(profile.user_id)}.webp`);
    avatarImg.src = (isSelf && savedAvatar) ? savedAvatar : remoteUrl;
    avatarImg.classList.remove('d-none');
    initialsEl?.classList.add('d-none');
};

export const attachAvatarUploader = (username: string): void => {
    const avatarInput = byId('avatarUploadInput') as HTMLInputElement | null;
    const avatarImg = byId('userAvatar') as HTMLImageElement | null;
    avatarInput?.addEventListener('change', async () => {
        if (!avatarInput.files || avatarInput.files.length === 0) return;
        const file = avatarInput.files[0]!;
        try {
            const dataUrl = await toDataUrl(file);
            localStorage.setItem(storageKey(username, 'avatar'), dataUrl);
            if (avatarImg) {
                avatarImg.src = dataUrl;
                avatarImg.classList.remove('d-none');
            }
            byId('avatarInitials')?.classList.add('d-none');

            // Attempt to upload to backend (even if not implemented)
            try {
                const fd = new FormData();
                fd.append('avatar', file, file.name);
                const uploadUrl = `${getApiBase()}/api/users/me/avatar`;
                await fetch(uploadUrl, { method: 'POST', body: fd, credentials: 'include' });
            } catch (error) {
                console.warn('[AD] Failed to upload avatar to backend', error);
            }
        } catch (error) {
            console.warn('[AD] Failed to load avatar', error);
        } finally {
            avatarInput.value = '';
        }
    });
};

