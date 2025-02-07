# WebAppPassword Change Log

## 24.9.1
- Updated and tested app for Nextcloud 31 (for [#260](https://github.com/digital-blueprint/webapppassword/issues/260))
  - The custom `PsrLogger` was removed in favor of `\Psr\Log\LoggerInterface`,
    because it doesn't work with Nextcloud 31
- Updated dependencies

## 24.9.0
- Updated and tested app for Nextcloud 30 (for [#226](https://github.com/digital-blueprint/webapppassword/issues/226))
    - Nextcloud instance breaking changes in the sharing API were fixed
- Updated dependencies

## 24.8.0
- Prevent common password managers to fill out admin form
  (for [#215](https://github.com/digital-blueprint/webapppassword/issues/215))
- Restore file sharing API in Nextcloud 27+
  (for [#197](https://github.com/digital-blueprint/webapppassword/issues/197), thank you, @DanRiess)
- Updated dependencies

## 24.6.0
- Fixed breaking change introduced in Nextcloud 29.0.2
  (for [#200](https://github.com/digital-blueprint/webapppassword/issues/200))
- Updated dependencies

## 24.4.0
- Updated and tested app for Nextcloud 29 (for [#177](https://github.com/digital-blueprint/webapppassword/issues/177))
- Updated dependencies

## 24.1.1
- The missing controller for the Preview API was added
  (for [#149](https://github.com/digital-blueprint/webapppassword/issues/149), thank you, @aleixq)
- Updated dependencies

## 24.1.0
- Fixed `app.info` deprecation warning debug message
  (for [#145](https://github.com/digital-blueprint/webapppassword/issues/145))
- Updated dependencies

## 23.12.0
- Basic preview API support was added
  (for [#94](https://github.com/digital-blueprint/webapppassword/pull/94), thank you, @aleixq)
- Updated and tested app for Nextcloud 28
- Updated dependencies

## 23.6.0
- Updated and tested app for Nextcloud 27
- Updated dependencies

## 23.4.1
- Updated store description (for [#1](https://github.com/digital-blueprint/webapppassword/issues/1))

## 23.4.0
- A files sharing API with origin check was added
  (for [#1](https://github.com/digital-blueprint/webapppassword/issues/1), thank you, @aleixq)

## 23.3.0
- Updated and tested app for Nextcloud 26

## 23.1.0
- Migrate fully to [GitHub](https://github.com/digital-blueprint/webapppassword)

## 22.10.0
- Enabled and tested app for Nextcloud 25
- Added support for Access-Control-Allow-Credentials header
  (for [#6](https://github.com/digital-blueprint/webapppassword/issues/6), thank you, @powerflo)

## 22.5.0
- Enabled and tested app for Nextcloud 24

## 21.12.0
- Enabled and tested app for Nextcloud 23

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
