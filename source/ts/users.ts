// User page entrypoint – composes user_logic modules

import { byId, qs } from './user_logic/_dom';
import { getParam, initialsFrom } from './user_logic/_utils';
import { fetchLoginState, fetchUserProfile } from './user_logic/_api';
import { applyInitialAvatar, attachAvatarUploader, toggleAvatarActions } from './user_logic/_avatar';
import { applyInitialBanner, attachBannerHandlers, toggleBannerActions } from './user_logic/_banner';
import { renderWatchStats, renderWatchTime } from './user_logic/_stats';
import { renderRatingsGraph } from './user_logic/_ratings';

const initUserPage = async (): Promise<void> => {
    // Resolve username from URL; redirect if missing
    const rawUsername = getParam(['u', 'user', 'username'], '').trim();
    if (!rawUsername) {
        window.location.replace('/');
        return;
    }
    const username = rawUsername;

    // Fetch profile
    const profile = await fetchUserProfile(username);
    if (!profile) { window.location.replace('/'); return; }

    // Fill basic identity info
    const unameEl = byId('profileUsername');
    const unameSugEl = byId('userSuggestionsName');
    if (unameEl) unameEl.textContent = profile.user_name || username;
    if (unameSugEl) unameSugEl.textContent = profile.user_name || username;
    document.title = `${profile.user_name || username} • Anime Dimension`;

    // Joined date from backend
    const joinedEl = byId('profileJoined');
    if (joinedEl) {
        const d = profile.joined_at ? new Date(profile.joined_at) : null;
        joinedEl.textContent = d ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : '—';
    }

    // Initials placeholder
    const initialsEl = byId('avatarInitials');
    if (initialsEl) initialsEl.textContent = initialsFrom(profile.user_name || username);

    // Login state and ownership
    const login = await fetchLoginState();
    const isSelf = !!login?.user_id && (login.user_id === profile.user_id);

    // Toggle edit controls based on ownership
    toggleAvatarActions(isSelf);
    toggleBannerActions(isSelf);

    // Avatar
    applyInitialAvatar(profile, username, isSelf);
    attachAvatarUploader(username);

    // Banner
    const bannerUserKey = profile.user_id || username;
    const bannerCandidates: string[] = [
        `/assets/images/users/backgrounds/${encodeURIComponent(bannerUserKey)}.webp`,
    ];
    const bannerPlaceholder = '/assets/inc/img/banners/homepage/space-min.svg';
    await applyInitialBanner(profile, username, isSelf, bannerCandidates, bannerPlaceholder);
    attachBannerHandlers(username, bannerCandidates, bannerPlaceholder);

    // Watch time + stats
    renderWatchTime(Math.max(0, Number(profile.watch_minutes || 0)));
    renderWatchStats(profile.stats);

    // Build external links for watch status buttons
    const linkMap: Record<string, string> = {
        watched: `https://anime-dimension.com/users/list/user_anime?status=watched&username=${encodeURIComponent(username)}`,
        watching: `https://anime-dimension.com/users/list/user_anime?status=watching&username=${encodeURIComponent(username)}`,
        want: `https://anime-dimension.com/users/list/user_anime?status=want&username=${encodeURIComponent(username)}`,
        stalled: `https://anime-dimension.com/users/list/user_anime?status=stalled&username=${encodeURIComponent(username)}`,
        dropped: `https://anime-dimension.com/users/list/user_anime?status=dropped&username=${encodeURIComponent(username)}`,
        wont: `https://anime-dimension.com/users/list/user_anime?status=wont&username=${encodeURIComponent(username)}`,
    };
    document.querySelectorAll<HTMLAnchorElement>('#watchStats a[data-k]').forEach((a) => {
        const k = a.getAttribute('data-k') || '';
        const href = linkMap[k];
        if (href) a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
    });

    // Ratings
    renderRatingsGraph(profile.ratings);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserPage);
} else {
    initUserPage();
}
