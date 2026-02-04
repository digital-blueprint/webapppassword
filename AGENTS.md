# Agent Documentation

## Version Management

The version number for this Nextcloud app is located in:

- `appinfo/info.xml` (line 16) - This is the primary version file for the Nextcloud app

Example:

```xml
<version>26.2.1</version>
```

## App Signing and Deployment

### Sign App Script

The signing script is located at `docker/nextcloud/sign-app.sh`. This script:

1. Runs inside a Nextcloud Docker container
2. Copies the app files to a deployment directory using `rsync`
3. Excludes development and build files from the archive
4. Signs the app with a certificate
5. Creates a tar.gz archive

### Excluding Files from Archive

To exclude additional files or directories from the signed app archive, add them to the `rsync` exclude list in `docker/nextcloud/sign-app.sh` (lines 14-23).

Current exclusions include:

- `.git*`, `.github`, `.gitlab-ci*`
- `docs`, `tests`, `vendor`
- Development config files (`.devenv*`, `phpunit.*`, `phpstan.*`, etc.)
- Build artifacts (`*.phar`, `*.gz`)
- IDE files (`.idea`)
- Docker files
- `.shared` folder

To add new exclusions, append `--exclude <pattern>` to the rsync command.

Example:

```bash
--exclude mynewfolder --exclude *.tmp \
```
