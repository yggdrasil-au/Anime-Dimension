// this file allows the TS files to import data from the astro build config file

export interface Data {

}

export interface PageMetadata {

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
export const startYear: number;

export const footerCopyRightText: {
    main: string;
};

export const PUBLIC_API_BASE: string;
export const apiBase: string;

export function resolvedepPath(pathname: string): {
    deploymentPath: string;
    thisCanon: string;
};


