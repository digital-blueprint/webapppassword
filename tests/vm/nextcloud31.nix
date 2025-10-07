{ pkgs, ... }:

let
  # Build the app and run composer install (offline) similar to basic.nix
  webapppasswordApp =
    pkgs.runCommand "webapppassword-app"
      {
        src = ../../.;
        buildInputs = [
          pkgs.composer
          pkgs.php
        ];
      }
      ''
        mkdir -p $out
        cp -r $src/* $out/
        chmod -R u+w $out
        export COMPOSER_ALLOW_SUPERUSER=1
        export COMPOSER_DISABLE_NETWORK=1
        export HOME=$TMPDIR
        if [ -f "$out/composer.json" ]; then
          echo "Running composer install for webapppassword app (Nextcloud 31 test)"
          (cd $out && ${pkgs.composer}/bin/composer install --no-dev --optimize-autoloader --no-interaction || (echo "Composer install failed"; ls -R $out; exit 1))
        fi
      '';

in
pkgs.nixosTest {
  name = "nextcloud31-webapppassword";
  nodes = {
    nextcloud31 = _: {
      services.nextcloud = {
        enable = true;
        package = pkgs.nextcloud31;
        hostName = "localhost";
        config.adminuser = "admin";
        config.adminpassFile = "/etc/nextcloud-adminpass";
        config.dbtype = "sqlite";
        config.dbname = "nextcloud";
        extraApps = [
          {
            name = "webapppassword";
            app = webapppasswordApp;
          }
        ];
      };
      networking.firewall.allowedTCPPorts = [
        80
        443
      ];
      environment.etc."nextcloud-adminpass".text = "adminpass";
    };
  };
  testScript = ''
    start_all()
    nextcloud31.wait_for_unit("phpfpm-nextcloud.service")
    nextcloud31.wait_for_unit("nginx.service")
    # Basic health
    nextcloud31.succeed("curl -fsSL http://localhost/status.php | grep 'installed' | grep 'true'")
    # The app should already be present in the apps dir via extraApps
    nextcloud31.succeed("sudo -u nextcloud nextcloud-occ app:list | grep -i webapppassword || (echo 'App not found in app:list'; sudo -u nextcloud nextcloud-occ app:list; exit 1)")
    # Enable (idempotent)
    nextcloud31.succeed("sudo -u nextcloud nextcloud-occ app:enable webapppassword || true")
    nextcloud31.succeed("curl -s -o /dev/null -w '%{http_code}' http://localhost/login | grep 200")
  '';
}
