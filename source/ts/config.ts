// Central config for client-side code
// Single source of truth comes from source/config/publicApiBase.ts
import {PUBLIC_API_BASE as STATIC_PUBLIC_API_BASE} from '@components/api.js';

export const PUBLIC_API_BASE: string = (STATIC_PUBLIC_API_BASE || 'https://api.anime-dimension.com');
export const apiBaseNoSlash = PUBLIC_API_BASE.replace(/\/$/, '');
