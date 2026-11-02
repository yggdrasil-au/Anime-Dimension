// generate a build ID based on the current timestamp and package version
import * as packagejson from "../package.json" with { type: "json" };

export const buildId = `${Date.now()}-${packagejson.version}`;
