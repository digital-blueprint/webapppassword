{ pkgs, ... }:

let
  webapppasswordApp = pkgs.runCommand "webapppassword-app" { src = ../../.; } ''
    mkdir -p $out
    cp -r $src/* $out/
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
      };
      networking.firewall.allowedTCPPorts = [
        80
        443
      ];
      environment.etc."webapppassword-app".source = webapppasswordApp;
      environment.etc."nextcloud-adminpass".text = "adminpass";
    };
  };
  testScript = ''
    start_all()
    nextcloud31.wait_for_unit("phpfpm-nextcloud.service")
    nextcloud31.wait_for_unit("nginx.service")
    # Deploy and enable app
    nextcloud31.succeed("install -d -o nextcloud -g nextcloud /var/lib/nextcloud/apps && cp -r /etc/webapppassword-app /var/lib/nextcloud/apps/webapppassword && chown -R nextcloud:nextcloud /var/lib/nextcloud/apps/webapppassword")
    nextcloud31.succeed("systemctl restart phpfpm-nextcloud")
    # Basic health
    nextcloud31.succeed("curl -fsSL http://localhost/status.php | grep 'installed' | grep 'true'")
    # Enable app via occ
    nextcloud31.succeed("sudo -u nextcloud nextcloud-occ app:enable webapppassword || true")
    nextcloud31.succeed("sudo -u nextcloud nextcloud-occ app:list | grep -i webapppassword")
    # Check login page accessible (HTTP 200)
    nextcloud31.succeed("curl -s -o /dev/null -w '%{http_code}' http://localhost/login | grep 200")
  '';
}
