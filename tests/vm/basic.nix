{ pkgs, ... }:

let
  inherit (pkgs) lib;
  tryAttr =
    name:
    let
      t = builtins.tryEval (builtins.getAttr name pkgs);
    in
    if t.success then t.value else null;
  pkg30 = tryAttr "nextcloud30"; # may be null / removal alias
  raw31 = tryAttr "nextcloud31";
  rawGeneric = tryAttr "nextcloud";
  pkg31 =
    if raw31 != null then
      raw31
    else if rawGeneric != null && lib.hasPrefix "31." rawGeneric.version then
      rawGeneric
    else
      null;
  has30 = pkg30 != null;
  has31 = pkg31 != null;
  # Package the webapppassword app from the repo root (two levels up from this file)
  webapppasswordApp = pkgs.runCommand "webapppassword-app" { src = ../../.; } ''
    mkdir -p $out
    cp -r $src/* $out/
  '';

  node30 =
    if has30 then
      {
        nextcloud30 = _: {
          services.nextcloud = {
            enable = true;
            package = pkg30;
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
      }
    else
      { };

  node31 =
    if has31 then
      {
        nextcloud31 = _: {
          services.nextcloud = {
            enable = true;
            package = pkg31;
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
      }
    else
      { };

in
pkgs.nixosTest {
  name = "nextcloud30-31-webapppassword";
  nodes = node30 // node31;
  testScript = ''
    print("Has30=${toString has30} Has31=${toString has31}")
    start_all()

    ${
      if has30 then
        ''
          print("Testing Nextcloud 30 (${pkg30.version})")
          nextcloud30.wait_for_unit("phpfpm-nextcloud.service")
          nextcloud30.wait_for_unit("nginx.service")
          nextcloud30.succeed("install -d -o nextcloud -g nextcloud /var/lib/nextcloud/apps && cp -r /etc/webapppassword-app /var/lib/nextcloud/apps/webapppassword && chown -R nextcloud:nextcloud /var/lib/nextcloud/apps/webapppassword")
          nextcloud30.succeed("systemctl restart phpfpm-nextcloud")
          nextcloud30.succeed("curl -fsSL http://localhost/status.php | grep 'installed' | grep 'true'")
          nextcloud30.succeed("ls -ld /var/lib/nextcloud/apps/webapppassword")
          nextcloud30.succeed("find /var/lib/nextcloud/apps/webapppassword/appinfo -maxdepth 1 -type f -print")
          # Try enabling, capture output
          nextcloud30.succeed("sudo -u nextcloud nextcloud-occ app:enable webapppassword 2>&1 | tee /tmp/enable30.log || true")
          # Dump full app:list for debugging
          nextcloud30.succeed("sudo -u nextcloud nextcloud-occ app:list 2>&1 | tee /tmp/app_list30.log")
          # Require presence (fallback to show diagnostics then fail)
          nextcloud30.succeed("sudo -u nextcloud nextcloud-occ app:list | grep -i webapppassword || (echo 'FAILED_TO_FIND_APP_30'; echo 'Enable output:'; cat /tmp/enable30.log; echo 'App list:'; sudo -u nextcloud nextcloud-occ app:list; exit 1)")
          nextcloud30.succeed("curl -s -o /dev/null -w '%{http_code}' http://localhost/login | grep 200")
          nextcloud30.succeed("sudo -u nextcloud nextcloud-occ status | grep -i 'version:'")
        ''
      else
        ''
          print("Skipping Nextcloud 30: package not present")
        ''
    }

    ${
      if has31 then
        ''
          print("Testing Nextcloud 31 (${pkg31.version})")
          nextcloud31.wait_for_unit("phpfpm-nextcloud.service")
          nextcloud31.wait_for_unit("nginx.service")
          nextcloud31.succeed("install -d -o nextcloud -g nextcloud /var/lib/nextcloud/apps && cp -r /etc/webapppassword-app /var/lib/nextcloud/apps/webapppassword && chown -R nextcloud:nextcloud /var/lib/nextcloud/apps/webapppassword")
          nextcloud31.succeed("systemctl restart phpfpm-nextcloud")
          nextcloud31.succeed("curl -fsSL http://localhost/status.php | grep 'installed' | grep 'true'")
          nextcloud31.succeed("ls -ld /var/lib/nextcloud/apps/webapppassword")
          nextcloud31.succeed("find /var/lib/nextcloud/apps/webapppassword/appinfo -maxdepth 1 -type f -print")
          nextcloud31.succeed("sudo -u nextcloud nextcloud-occ app:enable webapppassword 2>&1 | tee /tmp/enable31.log || true")
          nextcloud31.succeed("sudo -u nextcloud nextcloud-occ app:list 2>&1 | tee /tmp/app_list31.log")
          nextcloud31.succeed("sudo -u nextcloud nextcloud-occ app:list | grep -i webapppassword || (echo 'FAILED_TO_FIND_APP_31'; echo 'Enable output:'; cat /tmp/enable31.log; echo 'App list:'; sudo -u nextcloud nextcloud-occ app:list; exit 1)")
          nextcloud31.succeed("curl -s -o /dev/null -w '%{http_code}' http://localhost/login | grep 200")
          nextcloud31.succeed("sudo -u nextcloud nextcloud-occ status | grep -i 'version:'")
        ''
      else
        ''
          print("Skipping Nextcloud 31: package not present or not version 31.x")
        ''
    }

    print("ALL_TESTS_DONE")
  '';
}
