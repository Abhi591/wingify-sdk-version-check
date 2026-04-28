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
 * Inspect a `pom.xml` and, if the `vwo-fme-java-sdk` dependency is present,
 * compare its version (or range) with the latest version reported by
 * Maven Central metadata.
 */
async function detectJava(file: string): Promise<void> {
  // read the pom.xml file
  const xml = fs.readFileSync(file, "utf8");

  // find the index of the <artifactId>vwo-fme-java-sdk</artifactId> tag
  const depIndex = xml.indexOf("<artifactId>vwo-fme-java-sdk</artifactId>");
  if (depIndex === -1) return;

  // get the text after the <artifactId>vwo-fme-java-sdk</artifactId> tag
  const after = xml.slice(depIndex);

  // find the version number
  const versionMatch = after.match(/<version>\s*([^<]+)\s*<\/version>/);
  if (!versionMatch) return;

  // extract the version constraint for vwo-fme-java-sdk
  const versionSpec = versionMatch[1].trim();

  // fetch the latest version of the SDK
  const latest = await fetchLatest("java");
  if (!latest) {
    console.log(
      `Java SDK detected (current ${versionSpec}) but latest version could not be fetched`
    );
    return;
  }

  // compare the version constraint with the latest version
  if (isOutdated(versionSpec, latest)) {
    const repoFull = process.env.GITHUB_REPOSITORY;
    const repoShort =
      repoFull?.includes("/") ? repoFull.split("/")[1]! : repoFull ?? "this repository";
    const githubServer = process.env.GITHUB_SERVER_URL ?? "https://github.com";
    const workflowRunLine = repoFull
      ? `\n\nFor more details, refer to the latest workflow run: ${githubServer}/${repoFull}/actions`
      : "";
    const message = `<!here> ⚠️ SDK Version Check Failed

The Java FME SDK version currently used in *${repoShort}* is not up to date.

• File: \`${file}\`
• Current version: \`${versionSpec}\`
• Latest available version: \`${latest}\`

Please update the SDK to the latest version to maintain compatibility and stability.${workflowRunLine}`;
    console.log(message);
    await notifySlack(message);
    return;
  }

  console.log(`Java SDK up to date (${versionSpec})`);
}

export default detectJava;

