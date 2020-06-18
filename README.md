# Web App Password

This is a Nextcloud app to generate an app password.

Place this app in **nextcloud/apps/**


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
