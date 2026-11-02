/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import fs from 'fs';
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (fs.existsSync(chromePath)) {
  Config.setBrowserExecutable(chromePath);
}
