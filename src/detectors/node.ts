/**
 * Copyright 2026 Wingify Software Pvt. Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from "fs";
import fetchLatest from "../utils/fetchLatest";
import isOutdated from "../utils/versionCompare";
import notifySlack from "../utils/notifySlack";

/**
 * Inspect a `package.json` file and, if `vwo-fme-node-sdk` is present,
 * compare the declared version/range against the latest npm release.
 */
async function detectNode(file: string): Promise<void> {
  // read the package.json file
  const pkgRaw = fs.readFileSync(file, "utf8");

  // parse the package.json file
  const pkg = JSON.parse(pkgRaw) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  // extract the version constraint for vwo-fme-node-sdk
  const versionSpec =
    pkg.dependencies?.["vwo-fme-node-sdk"] ||
    pkg.devDependencies?.["vwo-fme-node-sdk"];

  // if the version constraint is not found, return
  if (!versionSpec) return;

  // fetch the latest version of the SDK
  const latest = await fetchLatest("node");

  // compare the version constraint with the latest version
  if (isOutdated(versionSpec, latest)) {
    const message = `:x: Wingify SDK outdated | Node.js | current: ${versionSpec} | latest: ${latest} | file: ${file}`;
    console.log(message);
    await notifySlack(message);
    return;
  }

  console.log(`Node SDK up to date -- (${versionSpec})`);
}

export default detectNode;

