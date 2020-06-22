# Web App Password

This is a Nextcloud app to generate a temporary app password and set CORS headers to allow
WebDAV access from inside a webpage.

Place this app in **nextcloud/apps/**

## Configuration

Add this setting to your `config/config.php` to whitelist certain origins.

`'webapppassword.origins' => ['https://example.com'],` - array of allowed origins

The setting is both used for the origin of the CORS headers for the WebDAV requests and
for the referrer check whether we want to generate a temporary app password.

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
