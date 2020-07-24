# Web App Password

This is a Nextcloud app to generate a temporary app password and set CORS headers to allow
WebDAV access from inside a webpage.

Place this app in **nextcloud/apps/**

## Configuration

Add this setting to your `config/config.php` to whitelist certain origins.

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

## References

This Nextcloud application is used in the
[NextcloudFilePicker](https://gitlab.tugraz.at/dbp/web-components/toolkit/-/blob/master/packages/file-handling/src/dbp-nextcloud-file-picker.js)
web component to generate temporary app passwords and to allow WebDAV-access from
inside the web browser.
