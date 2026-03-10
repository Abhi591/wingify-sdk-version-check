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
 * Inspect a `Gemfile` and, if `vwo-fme-ruby-sdk` is declared,
 * compare the Ruby-style version constraint against the latest
 * RubyGems release.
 */
async function detectRuby(file: string): Promise<void> {
  // read the Gemfile file
  const gemfile = fs.readFileSync(file, "utf8");

  // find the line that contains the version constraint for vwo-fme-ruby-sdk
  const match = gemfile.match(
    /gem\s+['"]vwo-fme-ruby-sdk['"][^'\n"]*['"]([^'"]+)['"]/
  );

  if (!match) return;

  // extract the version constraint for vwo-fme-ruby-sdk
  const versionSpec = match[1].trim();

  // fetch the latest version of the SDK
  const latest = await fetchLatest("ruby");

  // if the latest version could not be fetched, log a warning and return
  if (!latest) {
    console.log(
      `Ruby SDK detected (current ${versionSpec}) but latest version could not be fetched`
    );
    return;
  }

  // compare the version constraint with the latest version
  if (isOutdated(versionSpec, latest)) {
    const message = `:x: Wingify SDK outdated | Ruby | current: ${versionSpec} | latest: ${latest} | file: ${file}`;
    console.log(message);
    await notifySlack(message);
    return;
  }

  console.log(`Ruby SDK up to date (${versionSpec})`);
}

export default detectRuby;

