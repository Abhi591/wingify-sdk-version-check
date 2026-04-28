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
 * Inspect a `.csproj` file and, if the `VWO.FME.Sdk` package reference is present,
 * compare its version (or range) with the latest version published to NuGet.
 */
async function detectDotnet(file: string): Promise<void> {
  // Read the .csproj file
  const xml = fs.readFileSync(file, "utf8");

  // Find the package reference
  const pkgIndex = xml.indexOf('Include="VWO.FME.Sdk"');
  if (pkgIndex === -1) return;

  const after = xml.slice(pkgIndex);

  let versionSpec: string | null = null;

  // extract the version constraint for VWO.FME.Sdk regardless of which .csproj style the customer uses.
  const attrMatch = after.match(/Version="([^"]+)"/);
  if (attrMatch) {
    versionSpec = attrMatch[1].trim();
  } else {
    const nestedMatch = after.match(/<Version>\s*([^<]+)\s*<\/Version>/);
    if (nestedMatch) {
      versionSpec = nestedMatch[1].trim();
    }
  }

  if (!versionSpec) return;

  const latest = await fetchLatest("dotnet");
  if (!latest) {
    // if the latest version could not be fetched, log a warning and return
    console.log(
      `.NET SDK detected (current ${versionSpec}) but latest version could not be fetched`
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

The DotNet FME SDK version currently used in *${repoShort}* is not up to date.

• File: \`${file}\`
• Current version: \`${versionSpec}\`
• Latest available version: \`${latest}\`

Please update the SDK to the latest version to maintain compatibility and stability.${workflowRunLine}`;
    console.log(message);
    await notifySlack(message);
    return;
  }

  console.log(`.NET SDK up to date (${versionSpec})`);
}

export default detectDotnet;

