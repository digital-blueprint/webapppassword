# File handling web components

[GitLab Repository](https://gitlab.tugraz.at/dbp/web-components/FileHandling)

## FileSource

This web component allows the selection of local files via file dialog or drag and drop and to select and download
files from a [Nextcloud](https://nextcloud.com/) instance.

### Usage

```html
<dbp-file-source></dbp-file-source>
```

### Attributes

- `lang` (optional, default: `de`): set to `de` or `en` for German or English
    - example `<dbp-file-source lang="de"></dbp-file-source>`
- `allowed-mime-types` (optional): if set accepts only files matching mime types
    - example `<dbp-file-source allowed-mime-types='application/pdf'></dbp-file-source>` ... PDFs only
    - example `<dbp-file-source allowed-mime-types='image/*'></dbp-file-source>` ... images (of all sub types) only
    - example `<dbp-file-source allowed-mime-types='image/png,text/plain'></dbp-file-source>` ... PNGs or TXTs only
    - example `<dbp-file-source allowed-mime-types='*/*'></dbp-file-source>` ... all file types (default)
- `enabled-sources` (optional, default: `local`): sets which sources are enabled
    - you can use `local` and `nextcloud`
    - example `<dbp-file-source enabled-sources="local,nextcloud"></dbp-file-source>`
- `disabled` (optional): disable input control
    - example `<dbp-file-source disabled></dbp-file-source>`
- `decompress-zip` (optional): decompress zip file and send the contained files (including files in folders)
    - example `<dbp-file-source decompress-zip></dbp-file-source>`
    - mime types of `allowed-mime-types` will also be checked for the files in the zip file
- `nextcloud-auth-url` (optional): Nextcloud Auth Url to use with the Nextcloud file picker
    - example `<dbp-file-source nextcloud-auth-url="http://localhost:8081/index.php/apps/webapppassword"></dbp-file-source>`
    - `nextcloud-web-dav-url` also needs to be set for the Nextcloud file picker to be active
- `nextcloud-web-dav-url` (optional): Nextcloud WebDav Url to use with the Nextcloud file picker
    - example `<dbp-file-source nextcloud-web-dav-url="http://localhost:8081/remote.php/dav/files"></dbp-file-source>`
    - `nextcloud-auth-url` also needs to be set for the Nextcloud file picker to be active
- `dialog-open` (optional): if this attribute is set the dialog for selecting local or Nextcloud files will open
    - example `<dbp-file-source dialog-open></dbp-file-source>`
- `text` (optional): the text that is shown above the button to select files
    - example `<dbp-file-source text="Please select some files"></dbp-file-source>`
- `button-label` (optional): the text that is shown on the button to select files
    - example `<dbp-file-source button-label="Select files"></dbp-file-source>`

### Outgoing Events

#### `dbp-file-source-file-selected`

This event is sent if a file was selected.

**Payload**: `{'file': File}` where [File](https://developer.mozilla.org/en-US/docs/Web/API/File) is the binary file that was selected

## FileSink

This web component is able to receive files and present as them as ZIP file download. 

### Usage

```html
<dbp-file-sink></dbp-file-sink>
```

### Attributes

- `lang` (optional, default: `de`): set to `de` or `en` for German or English
    - example `<dbp-file-sink lang="de"></dbp-file-sink>`
- `enabled-destinations` (optional, default: `local`): sets which destination are enabled
    - you can use `local` and `nextcloud`
    - example `<dbp-file-sink enabled-destinations="local,nextcloud"></dbp-file-sink>`
- `filename` (optional, default: `files.zip`): sets a file name to use for downloading the zip file
    - example `<dbp-file-sink filename="signed-documents.zip"></dbp-file-sink>`
- `nextcloud-auth-url` (optional): Nextcloud Auth Url to use with the Nextcloud file picker
    - example `<dbp-file-sink nextcloud-auth-url="http://localhost:8081/index.php/apps/webapppassword"></dbp-file-sink>`
    - `nextcloud-web-dav-url` also needs to be set for the Nextcloud file picker to be active
- `nextcloud-web-dav-url` (optional): Nextcloud WebDav Url to use with the Nextcloud file picker
    - example `<dbp-file-sink nextcloud-web-dav-url="http://localhost:8081/remote.php/dav/files"></dbp-file-sink>`
    - `nextcloud-auth-url` also needs to be set for the Nextcloud file picker to be active
- `text` (optional): the text that is shown above the button to download the zip file
    - example `<dbp-file-sink text="Download files as ZIP-file"></dbp-file-sink>`
- `button-label` (optional): the text that is shown on the button to download the zip file
    - example `<dbp-file-sink button-label="Download files"></dbp-file-sink>`

### Properties

- `files`: an array of [File](https://developer.mozilla.org/en-US/docs/Web/API/File) objects which should be downloaded in the dialog
    - if the property is set the dialog opens

## Local development

```bash
# get the source code
git clone git@gitlab.tugraz.at:dbp/web-components/FileHandling.git
cd FileHandling
git submodule update --init

# install dependencies (make sure you have npm version 4+ installed, so symlinks to the git submodules are created automatically)
npm install

# constantly build dist/bundle.js and run a local web-server on port 8002 
npm run watch-local
```

Jump to <http://localhost:8002> and you should get a demo page.

To use the Nextcloud functionality you need a running Nextcloud server with the
[webapppassword](https://gitlab.tugraz.at/DBP/Middleware/Nextcloud/webapppassword) Nextcloud app like this
[Nextcloud Development Environment](https://gitlab.tugraz.at/DBP/Middleware/Nextcloud/webapppassword/-/tree/master/docker). 
