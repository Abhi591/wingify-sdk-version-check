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
import path from "path";
import fetchLatest from "../utils/fetchLatest";
import isOutdated from "../utils/versionCompare";
import notifySlack from "../utils/notifySlack";

/**
 * Inspect a `requirements.txt` file and, if `vwo-fme-python-sdk` is listed,
 * compare the declared constraint against the latest PyPI release.
 */
async function detectPython(file: string): Promise<void> {
  const raw = fs.readFileSync(file, "utf8");

  // Find the vwo-fme-python-sdk entry, stripping inline comments
  const match = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*$/, "").trim())
    .find((l) => /^vwo[-_]fme[-_]python[-_]sdk(?!-)(?:\[[^\]]*\])?/i.test(l));

  if (!match) return;

  // Extract the raw version spec (e.g. "==1.2.3", ">=1.0,<2.0")
  const versionSpecRaw = match
    .replace(/^vwo[-_]fme[-_]python[-_]sdk(?!-)(?:\[[^\]]*\])?/i, "")
    .trim();

  // Normalize pip `==x.y.z` → `=x.y.z` for semver comparison
  const versionSpec = versionSpecRaw
    .replace(/^===/, "=")
    .replace(/^==/, "=")
    .replace(/,(?=\s*\S)/g, " ")
    .trim();

  const latest = await fetchLatest("python");
  if (!latest) {
    console.log(
      `Python SDK detected (current ${versionSpecRaw || "(unpinned)"}) but latest version could not be fetched`
    );
    return;
  }

  if (isOutdated(versionSpec, latest)) {
    const repoFull = process.env.GITHUB_REPOSITORY;
    const repoShort =
      repoFull?.includes("/") ? repoFull.split("/")[1]! : repoFull ?? "this repository";
    const githubServer = process.env.GITHUB_SERVER_URL ?? "https://github.com";
    const workflowRunLine = repoFull
      ? `\n\nFor more details, refer to the latest workflow run: ${githubServer}/${repoFull}/actions`
      : "";
    const message = `<!here> ⚠️ SDK Version Check Failed

The Python FME SDK version currently used in *${repoShort}* is not up to date.

• File: \`${path.basename(file)}\`
• Current version: \`${versionSpecRaw || "(unpinned)"}\`
• Latest available version: \`${latest}\`

Please update the SDK to the latest version to maintain compatibility and stability.${workflowRunLine}`;
    console.log(message);
    await notifySlack(message);
    return;
  }

  console.log(`Python SDK up to date (${versionSpecRaw || "unpinned"})`);
}

export default detectPython;
