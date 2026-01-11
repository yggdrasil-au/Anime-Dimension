///
/// central built time data getter for Astro build
///
// purpose is to allow all astro files to obtain any data from package.json or data.json with auto error handling in this script, to prevent repetition of error handling code in each astro file or any other logic for data handling, just a simple import from this file gets all data
//

// global site data, used across multiple pages, footer, header, meta tags, and generic data
var data = {
    // site name variants
    "siteName1": "Anime-Dimension",
    "siteName2": "Anime Dimension",
    "siteName3": "AnimeDimension",
    "siteName4": "anime dimension",
    "siteName5": "animedimension",
    // short name
    "siteShortName": "AD",

    // footer text variants
    "footerText1": "",
    "footerTextAP": " is run by fans, for fans", // space at start is intentional

    "copyRightStartYear": 2025,

    // www api website data
    api: {

        // site description variants
        "footerdescription2": "Api for Anime-Dimension",

    }

}

// individual page specific data
const page_data = {
    description: {
        index: "Anime Dimension is a multi platform anime discovery and tracking web app, built with modern web technologies and designed to work on all devices, including mobile, tablet and desktop. It features a responsive design, dark mode, and a variety of other features to enhance your anime experience."
    },
    title: {
        index: data.siteName2
    }
}
export const page = page_data;

//import * as data from "@BuildConfigs/data.json";
import * as packagejson from "@PackageRoot/package.json";

////
// expporting the entire json objects above ensures the data is accessable, as a fallback, even if it lacks a specific var in this file below
////

export const data_json = data; // export entire file as object for easy access when extra logic is not needed or not yet implemented
export const package_json = packagejson; // export entire file as object for easy access when extra logic is not needed or not yet implemented



////
// Export Package.json values with error handling
////

export const packageVersion = package_json.version || "[JS-ERROR]";
export const packageName = package_json.name || "[JS-ERROR]";
export const packageDescription = package_json.description || "[JS-ERROR]";
export const packageAuthorName = package_json.author.name || "[JS-ERROR]";


////
// Export extra data
////

export const currentYear = new Date().getFullYear(); // year at build time
export const startYear = data.copyRightStartYear || "2025"; // start year for copyright, defaults to 2025 if missing


/// Footer CopyRight text
export const footerCopyRightText = {
    "Version": `${packageVersion}`,
    "App Name": `${packageName}`,
    "Description": `${package_json.description}`,
    "&copy;": `${startYear}-${currentYear}`,
    "Author": `${packageAuthorName}. All Rights Reserved.`,
    // api www footer copyright text
    api: {
        "Version": `${packageVersion}`,
        "App Name": `${packageName}`,
        "Description": `${data_json.api.footerdescription2}`,
        "&copy;": `${startYear}-${currentYear}`,
        "Author": `${packageAuthorName}. All Rights Reserved.`
    }
};

/// url used for queries to the api from frontend client side
import {PUBLIC_API_BASE} from '../BuildConfigs/api.js';

//const PUBLIC_API_BASE: string = (PUBLIC_API_BASE);
// this is used in the TS files
export const apiBase = PUBLIC_API_BASE.replace(/\/$/, '');


// shared function to resolve deployment path and canonical url
export const resolvedepPath = function(pathname) {
    // Smart path resolution: calculate relative path based on directory depth
    // Only count directories, not the filename itself
    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    const depth = pathSegments.length > 0 ? pathSegments.length - 1 : 0;
    const deploymentPath = depth === 0 ? '../' : '../'.repeat(depth);

    if (pathname == ('/')) {
        pathname = 'index.html';
    }

    const thisCanon = "https://anime-dimension.com/" + pathname;

    return { deploymentPath, thisCanon };

}

