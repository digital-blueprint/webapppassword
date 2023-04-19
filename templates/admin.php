<?php declare(strict_types=1);
script('webapppassword', 'admin');
style('webapppassword', 'admin');
?>

<div class="section" id="webapppassword-dav">
    <h2>WebDAV/CalDAV</h2>
    <div class="form-line">
        <p>
            <label for="webapppassword-origins">
                <?php p($l->t('Allowed origins for webdav')); ?>
            </label>
        <p>
            <em><?php p($l->t('Origins that are allowed to access the files using webdav(separated by comma)')); ?></em>
        </p>
        <p>
            <input type="text"
                  id="webapppassword-origins"
                  name="webapppassword-origins"
                  placeholder="https://example.com,https://example2.com"
                  value="<?php p($_['origins']); ?>">
        </p>
    </div>
</div>
<div class="section" id="webapppassword-share">
    <h2>Files sharing API</h2>

    <div class="form-line">
        <p>
            <label for="files-sharing-webapppassword-origins">
                <?php p($l->t('Allowed origins for files sharing api')); ?>
            </label>
        <p>
            <em><?php p($l->t('Origins that are allowed to access files sharing api(separated by comma)')); ?></em>
        </p>
        <p>
            <input type="text"
                  id="files-sharing-webapppassword-origins"
                  name="files-sharing-webapppassword-origins"
                  placeholder="https://example.com,https://example2.com"
                  value="<?php p($_['files_sharing_origins']); ?>">
        </p>
        <p>
            <em>
                <?php print_unescaped($l->t('It exposes parts of the %sOCS Share API%s (CRUD and the preflight OPTIONS endpoint) in this url:', ['<a href="https://docs.nextcloud.com/server/latest/developer_manual/client_apis/OCS/ocs-share-api.html">','</a>'])); ?>
                <code>/index.php/apps/webapppassword/api/v1/shares</code>.
            </em>
        </p>
    </div>
</div>
<div class="section" id="webapppassword-save">
    <div class="form-line">
        <p>
            <button class="button" id="webapppassword-store-origins"><?php p($l->t('Set origins')); ?></button>
            <span id="webapppassword-saved-message" class="msg success"><?php p($l->t('Saved')); ?></span>
        </p>
    </div>    
</div>