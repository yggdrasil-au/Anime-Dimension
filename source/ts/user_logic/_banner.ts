import { byId, qs } from './_dom';
import { storageKey, toDataUrl, getApiBase } from './_utils';
import type { UserProfile } from './_types';

const setBannerBg = (url: string): void => {
    const bannerEl = byId('userBannerImage');
    if (bannerEl) (bannerEl as HTMLElement).style.backgroundImage = `url('${url}')`;
};

export const toggleBannerActions = (show: boolean): void => {
    const bannerActions = qs('.user-banner__actions');
    if (show) bannerActions?.classList.remove('d-none');
    else bannerActions?.classList.add('d-none');
};

export const loadBannerFromUrls = async (urls: string[], placeholder: string): Promise<void> => {
    for (const u of urls) {
        try {
            await new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('banner load error'));
                img.src = u;
            });
            setBannerBg(u);
            return;
        } catch {
            // try next
        }
    }
    setBannerBg(placeholder);
};

export const applyInitialBanner = async (
    profile: UserProfile,
    username: string,
    isSelf: boolean,
    bannerCandidates: string[],
    placeholder: string,
): Promise<void> => {
    const savedBanner = localStorage.getItem(storageKey(username, 'banner'));
    if (savedBanner && isSelf) {
        setBannerBg(savedBanner);
    } else {
        const remoteFirst = profile.banner_url ? [profile.banner_url, ...bannerCandidates] : bannerCandidates;
        await loadBannerFromUrls(remoteFirst, placeholder);
    }
};

export const attachBannerHandlers = (
    username: string,
    bannerCandidates: string[],
    placeholder: string,
): void => {
    const bannerInput = byId('bannerUploadInput') as HTMLInputElement | null;
    const bannerClearBtn = byId('bannerClearBtn');

    bannerInput?.addEventListener('change', async () => {
        if (!bannerInput.files || bannerInput.files.length === 0) return;
        const file = bannerInput.files[0]!;
        try {
            const dataUrl = await toDataUrl(file);
            localStorage.setItem(storageKey(username, 'banner'), dataUrl);
            setBannerBg(dataUrl);

            // Attempt to upload to backend (even if not implemented)
            try {
                const fd = new FormData();
                fd.append('banner', file, file.name);
                const uploadUrl = `${getApiBase()}/api/users/me/banner`;
                await fetch(uploadUrl, { method: 'POST', body: fd, credentials: 'include' });
            } catch (error) {
                console.warn('[AD::_banner.ts::attachBannerHandlers()] Failed to upload banner to backend', error);
            }
        } catch (error) {
            console.warn('[AD::_banner.ts::attachBannerHandlers()] Failed to load banner', error);
        } finally {
            bannerInput.value = '';
        }
    });

    bannerClearBtn?.addEventListener('click', async () => {
        localStorage.removeItem(storageKey(username, 'banner'));
        await loadBannerFromUrls(bannerCandidates, placeholder);
    });
};

