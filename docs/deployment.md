# Deploying to the Nextcloud app store

## Prerequisites

- Copy your app certificate files to `./docker/nextcloud/certificates`
    - Take a look at [webapppassword.md](https://gitlab.tugraz.at/vpu-private/vpu-docs-private/-/blob/master/docs/projects/webapppassword.md)
      on how to get the files

## Test the app

- See example at [README.md](../README.md) for how to test the app

### Test app for next release of Nextcloud

To test the app for the next release of Nextcloud you need to create update at least the `apache` version in
the `pre-release` directory of the [Digital Blueprint Nextcloud Docker Fork](https://github.com/digital-blueprint/nextcloud-docker/tree/pre-release/pre-release)
to use the latest release candidate version of Nextcloud.

- Do a `Sync fork` on the [pre-release branch](https://github.com/digital-blueprint/nextcloud-docker/tree/pre-release)
- Update the configurations in the [pre-release directory](https://github.com/digital-blueprint/nextcloud-docker/tree/pre-release/pre-release)
    - Lookup the latest release candidate version of Nextcloud on the [Nextcloud Server Branches GitHub page](https://github.com/nextcloud/server/branches/all)
    - You then need to use that version in the `Dockerfile` files
- Wait until the [GitHub Workflow](https://github.com/digital-blueprint/nextcloud-docker/actions/workflows/build-deploy-pre-images.yml)
  has finished and the new image for [nextcloud-docker-pre-apache](https://github.com/digital-blueprint/nextcloud-docker/pkgs/container/nextcloud-docker-pre-apache)
  is available
- Jump to the directory `./docker` in a terminal and do a `docker compose build && docker compose up`
- Visit <http://localhost:8081> and login with `admin`/`admin`
- Do your testing (TODO)

## Signing and releasing

- Make sure the version in `appinfo/info.xml` and the `CHANGELOG.md` are updated
- Build the app with `make build`
- Test the app with the example in `docs/example` by calling `make serve` and visiting <http://localhost:8001/>
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
