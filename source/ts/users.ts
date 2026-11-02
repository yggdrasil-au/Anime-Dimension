// User page entrypoint – composes user_logic modules

import { byId, qs } from './user_logic/_dom.ts';
import { getParam, initialsFrom } from './user_logic/_utils.ts';
import { fetchLoginState, fetchUserProfile } from './user_logic/_api.ts';
import { applyInitialAvatar, attachAvatarUploader, toggleAvatarActions } from './user_logic/_avatar.ts';
import { applyInitialBanner, attachBannerHandlers, toggleBannerActions } from './user_logic/_banner.ts';
import { renderWatchStats, renderWatchTime } from './user_logic/_stats.ts';
import { renderRatingsGraph } from './user_logic/_ratings.ts';
import { initUserRelated, initUserSuggestions } from './user_logic/_suggestions.ts';

const initUserPage = async (): Promise<void> => {
    // Resolve username from URL or active login session
    const rawUsername = getParam(['u', 'user', 'username'], '').trim();
    const login = await fetchLoginState();
    let username = rawUsername;
    if (!username) {
        if (login?.user_name) {
            username = login.user_name;
        } else {
            globalThis.window.location.replace('/auth/index.html');
            return;
        }
    }

    // Fetch profile
    const profile = await fetchUserProfile(username);
    if (!profile) { globalThis.window.location.replace('/'); return; }

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

    // Build internal links for watch status buttons
    const linkMap: Record<string, string> = {
        watched: `/users/list/user_anime.html?username=${encodeURIComponent(username)}&status=watched`,
        watching: `/users/list/user_anime.html?username=${encodeURIComponent(username)}&status=watching`,
        want: `/users/list/user_anime.html?username=${encodeURIComponent(username)}&status=want`,
        stalled: `/users/list/user_anime.html?username=${encodeURIComponent(username)}&status=stalled`,
        dropped: `/users/list/user_anime.html?username=${encodeURIComponent(username)}&status=dropped`,
        wont: `/users/list/user_anime.html?username=${encodeURIComponent(username)}&status=wont`,
    };
    document.querySelectorAll<HTMLAnchorElement>('#watchStats a[data-k]').forEach((a) => {
        const k = a.getAttribute('data-k') || '';
        const href = linkMap[k];
        if (href) a.href = href;
    });

    // Ratings
    renderRatingsGraph(profile.ratings);

    // Suggestions & Related
    void initUserSuggestions();
    void initUserRelated();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserPage);
} else {
    initUserPage();
}
