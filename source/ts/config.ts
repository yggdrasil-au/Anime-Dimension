// Central config for client-side code
// Single source of truth comes from source/config/publicApiBase.ts
import {PUBLIC_API_BASE} from '../BuildConfigs/api.js';

//const PUBLIC_API_BASE: string = (PUBLIC_API_BASE);
// this is used in the TS files
export const apiBaseNoSlash = PUBLIC_API_BASE.replace(/\/$/, '');


