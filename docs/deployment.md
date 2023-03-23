# Deploying to the Nextcloud app store

## Prerequisites

- Copy your app certificate files to `./docker/nextcloud/certificates`
    - Take a look at [webapppassword.md](https://gitlab.tugraz.at/vpu-private/vpu-docs-private/-/blob/master/docs/projects/webapppassword.md)
      on how to get the files

## Test the app

- see example at [README.md](../README.md) for how to test the app

### Signing and releasing

- Make sure the version in `appinfo/info.xml` and the `CHANGELOG.md` are updated
- Build the app with `make build`
- Sign the app with `cd docker && make sign-app`
    - You should now have a `webapppassword.tar.gz` in your git directory
    - Check the content of the archive for unwanted files (you can exclude more files in
      `docker/nextcloud/sign-app.sh`)
- Commit and push your changes to the git repository
- Create a new release on [WebAppPassword releases](https://github.com/digital-blueprint/webapppassword/releases/)
  with the version like `v23.1.0` as *Tag name* and *Release title* and the changelog text of the current
  release as *Release notes*
    - Alternatively you can push to the `release` branch and the GitHub action will create
      a draft release for you
    - You also need to upload `webapppassword.tar.gz` to the release and get its url
- Take the text from *Signature for your app archive*, which was printed by the sign-app command and
  release the app at [Upload app release](https://apps.nextcloud.com/developer/apps/releases/new)
    - You need the download link to `webapppassword.tar.gz` from the GitHub release
- The new version should then appear on the [WebAppPassword store page](https://apps.nextcloud.com/apps/webapppassword)
