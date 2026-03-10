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
 * Inspect a `go.mod` file and, if the module path for the Go SDK is present,
 * compare the required version against the latest version available from
 * the Go module proxy.
 */
async function detectGo(file: string): Promise<void> {
  try {
    // read the go.mod file
    const gomod = fs.readFileSync(file, "utf8");

  // find the line that contains the module path for the Go SDK
    const lineMatch = gomod
      .split("\n")
      .find((line: string) => line.includes("vwo-fme-go-sdk"));

    if (!lineMatch) {
      console.log(`Go SDK not found in ${file}`);
      return;
    }

    const parts = lineMatch.trim().split(/\s+/);
    const versionSpec = parts[parts.length - 1];

    // fetch the latest version of the SDK
    const latest = await fetchLatest("go");
    if (!latest) {
      console.log(
        `Go SDK detected (current ${versionSpec}) but latest version could not be fetched`
      );
      return;
    }

    // compare the version constraint with the latest version
    if (isOutdated(versionSpec, latest)) {
      const message = `:x: Wingify SDK outdated | Go | current: ${versionSpec} | latest: ${latest} | file: ${file}`;
      console.log(message);
      await notifySlack(message);
      return;
    }

    console.log(`Go SDK up to date (${versionSpec})`);
  } catch (err: any) {
    console.log(
      `Go detector failed for ${file}: ${err?.message || String(err)}`
    );
  }
}

export default detectGo;

