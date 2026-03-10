"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const fetchLatest_1 = __importDefault(require("../utils/fetchLatest"));
const versionCompare_1 = __importDefault(require("../utils/versionCompare"));
const notifySlack_1 = __importDefault(require("../utils/notifySlack"));
/**
 * Inspect a `go.mod` file and, if the module path for the Go SDK is present,
 * compare the required version against the latest version available from
 * the Go module proxy.
 */
async function detectGo(file) {
    try {
        // read the go.mod file
        const gomod = fs_1.default.readFileSync(file, "utf8");
        // find the line that contains the module path for the Go SDK
        const lineMatch = gomod
            .split("\n")
            .find((line) => line.includes("vwo-fme-go-sdk"));
        if (!lineMatch) {
            console.log(`Go SDK not found in ${file}`);
            return;
        }
        const parts = lineMatch.trim().split(/\s+/);
        const versionSpec = parts[parts.length - 1];
        // fetch the latest version of the SDK
        const latest = await (0, fetchLatest_1.default)("go");
        if (!latest) {
            console.log(`Go SDK detected (current ${versionSpec}) but latest version could not be fetched`);
            return;
        }
        // compare the version constraint with the latest version
        if ((0, versionCompare_1.default)(versionSpec, latest)) {
            const message = `:x: Wingify SDK outdated | Go | current: ${versionSpec} | latest: ${latest} | file: ${file}`;
            console.log(message);
            await (0, notifySlack_1.default)(message);
            return;
        }
        console.log(`Go SDK up to date (${versionSpec})`);
    }
    catch (err) {
        console.log(`Go detector failed for ${file}: ${err?.message || String(err)}`);
    }
}
exports.default = detectGo;
