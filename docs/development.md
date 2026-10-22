# Development

## Docker

You can use this container for development and testing of the application.

```bash
# Do this from the root of the repository
cd docker
docker compose build
docker compose up
```

- <http://localhost:8081> admin/admin
- (first time only) For the origin config see `WEBPASSWORD_ORIGINS` in [docker-compose.yml](../docker/docker-compose.yml>)
- See [README.md](../README.md#Example) for a file picker example to access the Nextcloud instance

## Automated compatibility tests

GitHub Actions tests Nextcloud `stable32`, `stable33`, `stable34`, `stable35` and
`master`. Nextcloud 35 and `master` run with PHP 8.3; older versions also run with
their supported older PHP versions. The matrix includes app bootstrap, authenticated
DAV plugin registration, sharing endpoint unit tests and functional tests.

Run the NixOS VM tests locally with:

```bash
just vm-test
```

The combined test boots Nextcloud 32, 33, 34 and 35 in separate VMs and checks app
enablement, login, and allowed/denied app-password origins. Versions 32/33 use the
NixOS 25.11 input, 34 uses 26.05, and 35 uses the unstable input. All inputs are
pinned in `flake.lock`; update the Nextcloud 35 pin deliberately with
`nix flake update nixpkgsUnstable`.

The VM workflow runs on development-branch pushes and pull requests, but skips
the `release` branch (including manual runs). It is not part of the release
workflow; run it on the reviewed development commit before preparing a release.

## Test app for the next release of Nextcloud

To test the app for the next release of Nextcloud, you need to create update at least the `apache` version in
the `pre-release` directory of the [Digital Blueprint Nextcloud Docker Fork](https://github.com/digital-blueprint/nextcloud-docker/tree/pre-release/pre-release)
to use the latest release candidate version of Nextcloud.

- Do a `Sync fork` on the [pre-release branch](https://github.com/digital-blueprint/nextcloud-docker/tree/pre-release)
- Turn on [GitHub Actions](https://github.com/digital-blueprint/nextcloud-docker/settings/actions)
  so that the images are built later
- Update the configurations in the [pre-release directory](https://github.com/digital-blueprint/nextcloud-docker/tree/pre-release/pre-release)
  - Lookup the latest release candidate version of Nextcloud on the [Nextcloud Server Branches GitHub page](https://github.com/nextcloud/server/branches/all)
  - You then need to use that version in the `Dockerfile` files
- Wait until the [GitHub Workflow](https://github.com/digital-blueprint/nextcloud-docker/actions/workflows/build-deploy-pre-images.yml)
  has finished and the new image for [nextcloud-docker-pre-apache](https://github.com/digital-blueprint/nextcloud-docker/pkgs/container/nextcloud-docker-pre-apache)
  is available
- Turn off [GitHub Actions](https://github.com/digital-blueprint/nextcloud-docker/settings/actions) again
  so that the scheduler doesn't attempt to build the images by Nextcloud (where we don't have access)
- In the `webapppassword` project jump to the directory `./docker` in a terminal and do a `docker compose build && docker compose up`
- Visit <http://localhost:8081> and login with `admin`/`admin`
- Do your testing, for example, with [README.md](../README.md#Example) for a file picker example to access the Nextcloud instance
