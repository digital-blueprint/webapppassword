# WebAppPassword Change Log

## 21.7.0
- Updated and tested app for Nextcloud 22

## 21.3.0

- Updated and tested app for Nextcloud 21

## 21.2.1

- Mention CalDAV on Nextcloud app page

## 21.2.0

- Now also CalDAV requests are allowed

## 20.12.1

- Now the `webdavUrl` will be returned by `postMessage` to prevent issues if the UID doesn't match the loginName
  (for [#13](https://gitlab.tugraz.at/dbp/nextcloud/webapppassword/-/issues/13))

## 20.12.0

- Leading and trailing whitespaces will now be automatically trimmed from the origins

## 20.10.0

- Updated and tested app for Nextcloud 20

## 20.8.6

- Fixed the expiring temporary app passwords after 5 min with [NextCloud OIDC Login](https://github.com/pulsejet/nextcloud-oidc-login)
  (for [#11](https://gitlab.tugraz.at/dbp/nextcloud/webapppassword/-/issues/11))

## 20.8.5

- The `target-origin` will now be shown as `Device` in the temporary app passwords

## 20.8.4

- Updated summary and description

## 20.8.3

- Updated example and issue links

## 20.8.2

- Added more documentation and links

## 20.8.1

- Renamed app from `Web App Password` to `WebAppPassword`
- Fixed `app:check-code` compliance

## 20.8.0

- Did cleanup of files
- Added more app description

## 20.7.0

- Allowed generating of temporary app password
- Set CORS headers to allow WebDAV access from inside a webpage
- Implement settings page
