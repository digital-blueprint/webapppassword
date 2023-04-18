<?php declare(strict_types=1);
script('webapppassword', 'admin');
style('webapppassword', 'admin');
?>

<div class="section" id="webapppassword">
    <h2>WebAppPassword</h2>
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
    </div>
    <div class="form-line">
        <p>
            <button class="button" id="webapppassword-store-origins"><?php p($l->t('Set origins')); ?></button>
            <span id="webapppassword-saved-message" class="msg success"><?php p($l->t('Saved')); ?></span>
        </p>
    </div>    
</div>
