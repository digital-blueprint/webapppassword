# Deploying to the Nextcloud app store

## Prerequisites

- Copy your app certificate files to `./docker/nextcloud/certificates`
  - Take a look at [WebAppPassword Internal Knowledgebase](https://gitlab.tugraz.at/vpu-private/vpu-docs-private/-/tree/main/docs/projects/webapppassword)
    on how to get the files

## Test the app

- See [README.md](../README.md#Example) for a file picker example to access the Nextcloud instance

### Test app for next release of Nextcloud

- See [Test app for next release of Nextcloud](development.md#test-app-for-next-release-of-nextcloud)

## Signing and releasing

- Make sure the version in `appinfo/info.xml` and the `CHANGELOG.md` are updated
- Build the app with `just build`
- Test the app with the example in `docs/example` by calling `just serve` and visiting <http://localhost:8001/>
- Sign the app with `cd docker && just sign-app`
  - You should now have a `webapppassword.tar.gz` in your git directory
  - Check the content of the archive for unwanted files (you can exclude more files in
    `docker/nextcloud/sign-app.sh`)
- Commit and push your changes to the git repository
  - You can use a commit message like `release: make changes for Nextcloud 28`
- Create a new release on [WebAppPassword releases](https://github.com/digital-blueprint/webapppassword/releases/)
  with the version like `v23.1.0` as _Tag name_ and _Release title_ and the changelog text of the current
  release as _Release notes_
  - Alternatively you can rebase and push to the `release` branch and the GitHub action will create
    a draft release for you
  - You also need to upload `webapppassword.tar.gz` to the release and get its url
- Take the text from _Signature for your app archive_, which was printed by the sign-app command and
  release the app at [Upload app release](https://apps.nextcloud.com/developer/apps/releases/new)
  - You need the download link to `webapppassword.tar.gz` from the GitHub release
- The new version should then appear on the [WebAppPassword store page](https://apps.nextcloud.com/apps/webapppassword)
