<?php declare(strict_types=1);
script('webapppassword', 'admin');
style('webapppassword', 'admin');

$renderOriginPicker = function (string $id, string $value) use ($l): void {
	?>
        <div class="webapppassword-origin-picker" data-field="<?php p($id); ?>">
            <input type="hidden" id="<?php p($id); ?>" name="<?php p($id); ?>" value="<?php p($value); ?>">
            <div class="webapppassword-origin-picker__field">
                <ul class="webapppassword-origin-picker__chips"></ul>
                <input type="text"
                      id="<?php p($id); ?>-entry"
                      class="webapppassword-origin-picker__entry"
                      placeholder="https://example.com"
                      aria-describedby="<?php p($id); ?>-error"
                      autocomplete="off" data-1p-ignore data-bwignore data-lpignore="true" data-form-type="other">
            </div>
            <div id="<?php p($id); ?>-error" class="webapppassword-origin-picker__error" role="alert" hidden></div>
            <div class="webapppassword-origin-picker__suggestions" hidden>
                <span><?php p($l->t('Suggestions:')); ?></span>
            </div>
        </div>
	<?php
};
?>

<div class="section" id="webapppassword-dav">
    <h2>WebDAV/CalDAV</h2>
    <div class="form-line">
        <p>
            <label for="webapppassword-origins-entry">
                <?php p($l->t('Allowed origins for webdav')); ?>
            </label>
        <p>
            <em><?php p($l->t('Origins that are allowed to access the files using webdav. Type an origin and press Enter, or paste a comma separated list. Use full origins like https://example.com. One-level subdomain wildcards are supported as https://*.example.com, matching https://app.example.com but not https://a.b.example.com or https://example.com.')); ?></em>
        </p>
        <?php $renderOriginPicker('webapppassword-origins', $_['origins']); ?>
    </div>
</div>
<div class="section" id="webapppassword-share">
    <h2>Files sharing API</h2>

    <div class="form-line">
        <p>
            <label for="files-sharing-webapppassword-origins-entry">
                <?php p($l->t('Allowed origins for files sharing api')); ?>
            </label>
        <p>
            <em><?php p($l->t('Origins that are allowed to access files sharing api. Type an origin and press Enter, or paste a comma separated list. Use full origins like https://example.com. One-level subdomain wildcards are supported as https://*.example.com, matching https://app.example.com but not https://a.b.example.com or https://example.com.')); ?></em>
        </p>
        <?php $renderOriginPicker('files-sharing-webapppassword-origins', $_['files_sharing_origins']); ?>
        <p>
            <em>
                <?php print_unescaped($l->t('It exposes parts of the %sOCS Share API%s (CRUD and the preflight OPTIONS endpoint) in this url:', ['<a href="https://docs.nextcloud.com/server/latest/developer_manual/client_apis/OCS/ocs-share-api.html">', '</a>'])); ?>
                <code>/index.php/apps/webapppassword/api/v1/shares</code>.
            </em>
        </p>
    </div>
</div>
<div class="section" id="webapppassword-preview">
    <h2>Preview API</h2>

    <div class="form-line">
        <p>
            <label for="preview-webapppassword-origins-entry">
                <?php p($l->t('Allowed origins for preview api')); ?>
            </label>
        <p>
            <em><?php p($l->t('Origins that are allowed to access preview api. Type an origin and press Enter, or paste a comma separated list. Use full origins like https://example.com. One-level subdomain wildcards are supported as https://*.example.com, matching https://app.example.com but not https://a.b.example.com or https://example.com.')); ?></em>
        </p>
        <?php $renderOriginPicker('preview-webapppassword-origins', $_['preview_origins']); ?>
        <p>
            <em>
                <?php print_unescaped($l->t('It exposes parts of the %sOC Preview API%s (Get and the preflight OPTIONS endpoint) in this url:', ['<a href="https://github.com/nextcloud/server/blob/master/core/Controller/PreviewController.php">', '</a>'])); ?>
                <code>/index.php/apps/webapppassword/core/preview</code>.
            </em>
        </p>
    </div>
</div>

<div class="section" id="webapppassword-save">
    <div class="form-line">
        <p>
            <button class="button" id="webapppassword-store-origins"><?php p($l->t('Set origins')); ?></button>
            <span id="webapppassword-saved-message" class="msg success"><?php p($l->t('Saved')); ?></span>
            <span id="webapppassword-error-message" role="alert" hidden></span>
        </p>
    </div>
</div>
