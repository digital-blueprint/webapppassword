# Signing and releasing

Releases are signed and published from GitHub Actions.
The workflow is [`.github/workflows/create_release.yml`](../.github/workflows/create_release.yml).
It replaces the old empty-draft workflow and publishes both the GitHub release
and the Nextcloud App Store release automatically, after configured approvals.

## One-time setup

### Nextcloud signing certificate and App Store access

WebAppPassword is already registered as `webapppassword` in the
[Nextcloud App Store](https://apps.nextcloud.com/apps/webapppassword).
Use the **existing app-specific private key and signed certificate**. A certificate
for `qownnotes` or another app cannot be reused. Maintainers can find the existing
credentials through the
[WebAppPassword Internal Knowledgebase](https://gitlab.tugraz.at/vpu-private/vpu-docs-private/-/tree/main/docs/projects/webapppassword).
Do not replace the existing identity or register a duplicate app to enable CI.

If a new certificate is needed, follow Nextcloud's
[obtaining a certificate](https://nextcloudappstore.readthedocs.io/en/latest/developer.html#obtaining-a-certificate)
procedure. Generate an RSA private key and certificate signing request (CSR):

```bash
mkdir -p ~/.nextcloud/certificates
cd ~/.nextcloud/certificates
umask 077
openssl req -nodes -newkey rsa:4096 \
  -keyout webapppassword.key -out webapppassword.csr \
  -subj "/CN=webapppassword"
```

Submit only the CSR to Nextcloud, never the private key. Save the certificate
issued by Nextcloud as `webapppassword.crt`; a self-signed certificate will not work.
Coordinate certificate replacement for this existing app with its owner/Nextcloud.
Keep an offline backup of the key.

Obtain an API token from the App Store account's
[token settings](https://apps.nextcloud.com/account/token).
The account must have permission to publish `webapppassword`. This token can affect
other apps owned by that account and must be treated as a sensitive credential.

### GitHub repository settings

1. Enable GitHub Actions in `digital-blueprint/webapppassword`. The repository and
   release assets must be publicly downloadable without authentication so the
   App Store can fetch the archive. Organization policy must allow the actions
   used by the release and reusable test workflows.
2. Under **Settings → Environments**, create these environments:

   | Environment          | Secret            | Value                                     |
   | -------------------- | ----------------- | ----------------------------------------- |
   | `release-signing`    | `APP_PRIVATE_KEY` | Full PEM contents of `webapppassword.key` |
   | `release-signing`    | `APP_PUBLIC_CRT`  | Full PEM contents of `webapppassword.crt` |
   | `release-publishing` | `APPSTORE_TOKEN`  | App Store account API token               |

   Preserve PEM header/footer lines and line breaks. The certificate is public;
   using a secret for it is convenient, not a confidentiality requirement.
   **Never commit the private key/token, upload them as artifacts, or print them.**

3. Restrict **both environments** to the `release` branch. Configure required
   reviewers where the GitHub plan supports them, ideally preventing self-approval.
   Without reviewers, the jobs publish automatically with no approval pause.
4. Protect `main` and `release` using branch protection/rulesets: require review,
   restrict who can push to `release`, and prohibit force pushes. In particular,
   review changes to workflows, signing scripts, publication scripts and the
   packaging manifest. Environment approval is not a substitute for reviewing
   code that will receive secrets.
5. Ensure policy permits the publishing job's `GITHUB_TOKEN` to write repository
   contents. No personal access token is needed: only the GitHub publishing job
   requests `contents: write`; all other release jobs have `contents: read`.

The workflow uses GitHub-hosted Ubuntu runners with Docker, Python 3, OpenSSL and
GitHub CLI. Tests and formatting run in separate jobs without signing or App Store
secrets; no dependency installation/build runs in a secret-bearing job.
Release actions and the Nextcloud signing image are pinned; update these pins
deliberately, and review dependencies of the reusable test workflows as well.

## Preparing a release

The app uses CalVer: `YY.M.patch`, for example `26.10.0`.

1. Set the new version in [`appinfo/info.xml`](../appinfo/info.xml). This is the
   only app-version file; Composer dependencies and `package-lock.json` do not
   need an app-version bump. There is no frontend build: `js/` and `css/` are
   checked-in runtime files, and Composer contains development dependencies only.
2. Move the changes from `## Unreleased` to a new `## <version>` section in
   [`CHANGELOG.md`](../CHANGELOG.md). The version section must be the newest
   section, occur exactly once, and contain nonempty notes. Remove the leading
   `## Unreleased` heading for the release commit (it can be reintroduced on
   `main` afterwards). The matching section becomes the GitHub release description.
3. Review the supported Nextcloud versions in `appinfo/info.xml`, run the
   [example](../README.md#example), and perform the
   [Nextcloud compatibility checks](development.md#test-app-for-next-release-of-nextcloud).
4. Run the credential-free preflight:

   ```bash
   just release-check
   ```

   Or run `python3 -m unittest discover -s tests/release` and
   `python3 scripts/check-release.py`. To check a development tree that still has
   a leading Unreleased section, use `python3 scripts/check-release.py --allow-unreleased`.
   The automated release always uses strict validation.

5. Commit, review and merge the release preparation into `main`; ensure ordinary
   CI passes. Then advance `release` to that reviewed commit using a fast-forward
   push, for example:

   ```bash
   git fetch origin
   git push origin origin/main:refs/heads/release
   ```

   This publishes the fetched `origin/main` commit, not uncommitted/local work.
   If branch policy requires a pull request to update `release`, use that instead
   and ensure its resulting commit is the intended release commit. If the push is
   not a fast-forward, reconcile the branches through review; do not force-push.
   **Pushing to `release` starts publication.** Do not manually create a tag or
   empty draft first, and do not queue another release while one awaits approval.

## What the workflow does

The **Sign and publish release** workflow runs only on pushes to `release`, not
on tags, pull requests, pushes to `main`, or manual dispatch. Release concurrency
is serialized and an active run is not cancelled by another push.

1. **Validate:** run offline release regression tests and check app ID, CalVer,
   changelog and packaging inputs. Missing files and symlinks are rejected before
   credentials are available.
2. **Test:** run the existing Nextcloud test matrix, NixOS VM tests and formatting
   workflow as reusable workflows. All must succeed before signing starts.
3. **Sign:** after `release-signing` approval (if configured),
   [`scripts/ci-sign-app.sh`](../scripts/ci-sign-app.sh) starts an isolated,
   digest-pinned Nextcloud 35.0.1 container with SQLite. It copies only the runtime
   paths listed in [`release-files.txt`](../release-files.txt), discards the old
   checked-in `appinfo/signature.json`, and runs `occ integrity:sign-app` with
   the app-specific certificate. Development files, tests, databases, Docker
   configuration and credentials are not packaged.
4. **Verify:** create a top-level `webapppassword/` archive, sign its exact bytes
   with SHA-512/RSA, and verify that archive signature with OpenSSL. Extract the
   actual archive, require its `appinfo/signature.json`, run Nextcloud's integrity
   check and enable the extracted app. Archives over 20 MiB fail. Temporary
   credentials/container volumes are cleaned up on exit; development Docker
   containers and repository files are not modified by CI signing.
5. **Publish GitHub:** after `release-publishing` approval,
   [`scripts/publish-github-release.py`](../scripts/publish-github-release.py)
   checks the checksum, creates/resumes a draft targeting the exact workflow
   commit, uploads all assets, and publishes the stable release as latest:

   ```text
   Tag: v<version>
   Title: Release v<version>
   Assets:
     webapppassword-<version>.tar.gz
     webapppassword-<version>.tar.gz.sig
     webapppassword-<version>.tar.gz.sha256
   ```

   Notes come from the matching changelog section, not generated commit notes.
   Existing tags are never moved; different existing assets are never overwritten.

6. **Publish App Store:** the next job uses the `release-publishing` environment
   too; GitHub may request a separate approval. It anonymously downloads the
   published archive and verifies that its bytes match the signed artifact.
   [`scripts/publish-appstore.py`](../scripts/publish-appstore.py) then sends the
   public download URL and existing Base64 archive signature to the
   [App Store API](https://nextcloudappstore.readthedocs.io/en/latest/api/restapi.html#api-create-release)
   with `nightly: false`. This job has no private key. The store reads app metadata
   and changelog from the archive.

There are **two signatures**: `appinfo/signature.json` protects installed app
files; the `.tar.gz.sig` is the Base64 SHA-512/RSA signature over the compressed
archive used by the App Store. The `.sha256` is a download checksum, not a signature.
Do not repackage or change the archive after signing.

After the run succeeds, check the
[GitHub release](https://github.com/digital-blueprint/webapppassword/releases)
and [App Store page](https://apps.nextcloud.com/apps/webapppassword), then install
the store release in a test Nextcloud and check functionality/integrity. CI app
enablement is a smoke test, not a substitute for browser acceptance testing.
Signed Actions artifacts are retained for 14 days; published GitHub assets remain.

## Failures and retries

- **Validation/tests fail:** fix and review the problem, then push the corrected
  release commit. No signing or publication occurs.
- **Signing fails:** check the full PEM secrets, certificate app ID/validity,
  Nextcloud compatibility and Docker initialization. After fixing configuration,
  use **Re-run failed jobs**.
- **GitHub publication fails:** use **Re-run failed jobs** while the signed Actions
  artifact exists. A partial draft can be resumed if existing assets are identical
  and the tag/draft targets the correct commit. Conflicting tags/assets fail safely.
- **App Store submission fails:** the GitHub release remains public. Check token,
  app ownership, certificate/registration and anonymous archive access, then use
  **Re-run failed jobs**, not **Re-run all jobs**. The original signature and archive
  are reused. The API may return HTTP 200 for an update rather than 201 for creation.

Do not rerun all jobs once assets have been uploaded: timestamps and signing can
produce different archive bytes even for the same commit. Never overwrite a
published archive to fix a release; ship a new version instead.

If Actions artifacts have expired but the GitHub release is already public,
download its original archive and `.sig` and retry App Store publication locally:

```bash
mkdir -p build
gh release download v26.10.0 --repo digital-blueprint/webapppassword \
  --pattern 'webapppassword-26.10.0.tar.gz*' --dir build
# Export APPSTORE_TOKEN securely; do not put its value in shell history.
python3 scripts/publish-appstore.py \
  --download-url https://github.com/digital-blueprint/webapppassword/releases/download/v26.10.0/webapppassword-26.10.0.tar.gz \
  --archive build/webapppassword-26.10.0.tar.gz \
  --signature build/webapppassword-26.10.0.tar.gz.sig
```

Replace the example version. If only an incomplete draft exists when artifacts
expire, stop and investigate recovery; do not silently rebuild/replace its assets.

## Local signing fallback

The existing interactive Docker signing path remains available:

1. Copy `webapppassword.key` and `webapppassword.crt` to
   `docker/nextcloud/certificates` (keep them out of Git).
2. Prepare version/changelog, run `just release-check`, build with `just build`,
   and test the app/example as above.
3. Run `cd docker && just sign-app`. Review the listed archive files and press
   Enter. This creates `webapppassword.tar.gz` at the repository root and prints
   the archive signature. Unlike CI, it also updates the local
   `appinfo/signature.json`. Local packaging exclusions are maintained in
   `docker/nextcloud/sign-app.sh`; CI uses `release-files.txt`.
4. Verify the archive in a test Nextcloud, manually create a release tagged
   `v<version>` with the matching changelog notes, and attach the signed archive.
5. Submit that archive's public URL and the printed signature through
   [Upload app release](https://apps.nextcloud.com/developer/apps/releases/new).

Do not race manual publication against CI or upload a locally signed archive into
a CI-created release. If choosing a wholly manual release, disable the automated
workflow intentionally before any push to `release`.
