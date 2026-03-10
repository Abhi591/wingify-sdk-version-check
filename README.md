## Wingify SDK Version Check GitHub Action

This GitHub Action scans a repository for Wingify Feature Management SDKs in multiple languages and reports whether they are up to date with the latest released versions.

### Supported SDKs

- **Node.js**: `vwo-fme-node-sdk`
- **Java**: `vwo-fme-java-sdk`
- **PHP**: `vwo/vwo-fme-php-sdk`
- **Go**: `github.com/wingify/vwo-fme-go-sdk`
- **Ruby**: `vwo-fme-ruby-sdk`
- **.NET**: `VWO.FME.Sdk`

### How it works

- **Scans** the repository for common manifest files:
  - `package.json`, `pom.xml`, `composer.json`, `go.mod`, `Gemfile`, `*.csproj`
- **Detects** if any of the supported Wingify SDKs are used.
- **Fetches** the latest version of each SDK from the appropriate package registry.
- **Compares** the current version in the repo with the latest version.
- **Logs** whether each detected SDK is up to date or outdated.

### Usage

Add a workflow in the consuming repository:

```yaml
name: Wingify SDK version check

on:
  workflow_dispatch:
  schedule:
    - cron: "0 3 * * *"

jobs:
  check-sdk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check Wingify SDK versions
        uses: wingify/wingify-sdk-version-check@main
        env:
          SLACK_NOTIFICATIONS_BOT_TOKEN: ${{ secrets.SLACK_NOTIFICATIONS_BOT_TOKEN }}
          CHANNEL_ID: ${{ secrets.CHANNEL_ID }}
```

### Environment variables

- **`SLACK_NOTIFICATIONS_BOT_TOKEN`**: Slack bot token used to send notifications.
- **`CHANNEL_ID`**: Slack channel ID where notifications should be posted.

### Output

The action prints log lines like:

- `Node SDK outdated: ^1.2.0 -> 1.3.0`
- `Java SDK up to date (1.3.0)`

These logs are also used to generate the Slack messages.

### Version range handling

- **npm / Packagist / Go / .NET**:
  - If you declare a **range** that already allows the latest version
    (e.g. `^1.18.0` with latest `1.20.0`), the SDK is treated as **up to date**.
  - If you pin a specific version (e.g. `1.18.0`) and a newer compatible
    version exists (e.g. `1.20.0`), it is treated as **outdated**.
- **Ruby (`Gemfile`)**:
  - The Ruby `~>` ("pessimistic") operator is mapped to a semver range:
    - `~> 1.4`   → `>=1.4.0 <2.0.0`
    - `~> 1.4.0` → `>=1.4.0 <1.5.0`
  - If the latest gem version falls inside that range, it is **up to date**.

### Local development

- **Build the action** (TypeScript → bundled JS):

  ```bash
  npm install
  npm run build
  ```

  This compiles `src/**/*.ts` and produces a single bundled `dist/index.js`
  that is used as the GitHub Action entrypoint (see `action.yml`).


