# WebAppPassword

This is a Nextcloud app to generate a temporary app password and set CORS headers to allow
WebDAV access from inside a webpage.

Place this app in **nextcloud/apps/**

## Configuration

You can configure the allowed origins on the settings page of the application.

![screenshot](screenshot.png)

Alternatively you can also add this setting to your `config/config.php`
(it will be used if the origins setting on the settings page are empty).

`'webapppassword.origins' => ['https://example.com'],` - array of allowed origins

The setting is both used for the origin of the CORS headers for the WebDAV requests and
for the referrer check whether we want to generate a temporary app password.

## Docker

* `cd docker`
* `docker-compose up`
* <http://localhost:8081> admin/admin
* (first time only) For the origin config see `WEBPASSWORD_ORIGINS` in docker-compose.yml

## Running tests

You can use the provided Makefile to run all tests by using:

```bash
make test
```

This will run the PHP unit and integration tests and if a package.json is present in the **js/** folder will execute **npm run test**

Of course you can also install [PHPUnit](http://phpunit.de/getting-started.html) and use the configurations directly:

```bash
phpunit -c phpunit.xml
```

or:

```bash
phpunit -c phpunit.integration.xml
```

for integration tests

## Generate translation

You will need the [translationtool](https://github.com/nextcloud/docker-ci/tree/master/translations/translationtool)
to generate the translation files for all languages.

```bash
php /path/to/translationtool.phar convert-po-files
```

See: [Manual translation](https://docs.nextcloud.com/server/19/developer_manual/app/view/l10n.html#manual-translation)

## Deploying to the Nextcloud app store

### Prerequisites

- Copy your app certificate files to `./docker/nextcloud/certificates`
    - Take a look at [webapppassword.md](https://gitlab.tugraz.at/vpu-private/vpu-docs-private/-/blob/master/docs/projects/webapppassword.md)
      on how to get the files

### Signing and releasing

- Make sure the version in `appinfo/info.xml` and the `CHANGELOG.md` are updated
- Sign the app with `cd docker && make sign-app`
    - You should now have a `webapppassword.tar.gz` in your git directory
    - Check the content of the archive for unwanted files (you can exclude more files in
      `docker/nextcloud/sign-app.sh`)
- Create a new release on [WebAppPassword releases](https://gitlab.tugraz.at/dbp/nextcloud/webapppassword/-/releases/)
  with the version like `v20.8.0` as *Tag name* and the changelog text of the current release as *Release notes*
    - You also need to upload `webapppassword.tar.gz` to the *Release notes* of the release and get its url
- Take the text from *Signature for your app archive*, which was printed by the sign-app command and
  release the app at [Upload app release](https://apps.nextcloud.com/developer/apps/releases/new)
    - You need the download link to `webapppassword.tar.gz` from the GitLab release
- The new version should then appear on the [WebAppPassword store page](https://apps.nextcloud.com/apps/webapppassword)

## Example

You can start a php server with `php -S localhost:8082` to see an example page on <http://localhost:8082/>.

If you have started the docker container you can login to your Nextcloud container with `admin`/`admin` and
receive a temporary app password for your user.

Take a look at <index.html> for the source code of the page.

## References

This Nextcloud application is used in the
[NextcloudFilePicker](https://gitlab.tugraz.at/dbp/web-components/toolkit/-/blob/master/packages/file-handling/src/dbp-nextcloud-file-picker.js)
web component to generate temporary app passwords and to allow WebDAV-access from
inside the web browser.
