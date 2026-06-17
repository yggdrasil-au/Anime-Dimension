// this file allows the TS files to import data from the astro build config file

export interface Data {
    siteName1: string;
    siteName2: string;
    siteName3: string;
    siteName4: string;
    siteName5: string;
    siteShortName: string;
    footerText1: string;
    footerTextAP: string;
    copyRightStartYear: number;
    api: {
        footerdescription2: string;
    };
}

export interface PageMetadata {
    index: string;
    [key: string]: string; // Allows for additional page keys if added later
}

export const favicon: string;

export interface Page {
    description: PageMetadata;
    title: PageMetadata;
}

export interface PackageJson {
    name: string;
    version: string;
    description: string;
    author: {
        name: string;
        [key: string]: any;
    };
    [key: string]: any;
}

export const page: Page;
export const data_json: Data;
export const package_json: PackageJson;

export const packageVersion: string;
export const packageName: string;
export const packageDescription: string;
export const packageAuthorName: string;

export const currentYear: number;
export const startYear: number | string;

export const footerCopyRightText: {
    main: string;
    api: string;
};

export const PUBLIC_API_BASE: string;
export const apiBase: string;

export function resolvedepPath(pathname: string): {
    deploymentPath: string;
    thisCanon: string;
};