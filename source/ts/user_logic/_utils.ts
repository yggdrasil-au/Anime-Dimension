// Generic utilities for the user page

export const getParam = (keys: string[], fallback = ""): string => {
    const usp = new URLSearchParams(location.search);
    for (const k of keys) {
        const v = usp.get(k);
        if (v && v.trim()) return v.trim();
    }
    return fallback;
};

export const initialsFrom = (name: string): string => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase()).join("") || "U";
};

export const storageKey = (username: string, what: string): string => `ad:user:${username || 'guest'}:${what}`;

import {apiBaseNoSlash} from '../config';
export const getApiBase = (): string => apiBaseNoSlash;

export const toDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

export const formatHours = (mins: number): { text: string; percent: number } => {
    const hours = Math.max(0, Math.round(mins / 60));
    const days = Math.floor(hours / 24);
    const remH = hours % 24;
    // 1 year of watch time as 100% (arbitrary cap for visualization)
    const cap = 24 * 365;
    const pct = Math.max(1, Math.min(100, Math.round((hours / cap) * 100)));
    const text = days > 0 ? `${days}d ${remH}h` : `${hours}h`;
    return { text, percent: pct };
};

export const parseNumber = (s: string | null, fallback = 0): number => {
    if (!s) return fallback;
    const n = Number(String(s).replace(/,/g, ''));
    return Number.isFinite(n) ? n : fallback;
};

