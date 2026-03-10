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

import scanRepo from "./utils/scanner";
import detectNode from "./detectors/node";
import detectJava from "./detectors/java";
import detectPhp from "./detectors/php";
import detectGo from "./detectors/go";
import detectRuby from "./detectors/ruby";
import detectDotnet from "./detectors/dotnet";

/**
 * Entrypoint for the GitHub Action.
 *
 * - Scans the repository for language-specific manifest files.
 * - For each manifest, invokes the matching detector.
 * - Each detector logs whether the corresponding Wingify SDK is up to date.
 */
async function run(): Promise<void> {
  // scan the repository for language-specific manifest files
  const files = await scanRepo();
  if (process.env.DEBUG === "true") {
    console.log(`wingify-sdk-version-check: found ${files.length} manifest(s)`);
    for (const f of files) console.log(`- ${f}`);
  }

  for (const file of files) {
    // detect the language of the file and invoke the corresponding detector
    if (file.endsWith("package.json")) {
      await detectNode(file);
    }

    // detect Java
    if (file.endsWith("pom.xml")) {
      await detectJava(file);
    }

    // detect PHP
    if (file.endsWith("composer.json")) {
      await detectPhp(file);
    }

    // detect Go
    if (file.endsWith("go.mod")) {
      await detectGo(file);
    }

    // detect Ruby
    if (file.endsWith("Gemfile")) {
      await detectRuby(file);
    }

    // detect .NET
    if (file.endsWith(".csproj")) {
      await detectDotnet(file);
    }
  }
}

// if the action fails, log an error and exit with a non-zero code
run().catch((err) => {
  console.error("Wingify SDK Version Check failed:", err);
  process.exitCode = 1;
});

