{ pkgs, ... }:

let
  inherit (pkgs) lib;
  # Optional dev-only knob: set FORCE_REBUILD_NONCE (with --impure) to force a new store path
  # Example (fish): env FORCE_REBUILD_NONCE=(date +%s) nix build --impure -L .#nixosTests.nextcloud-webapppassword
  forceRebuildNonce = builtins.getEnv "FORCE_REBUILD_NONCE";
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
  # Build the app: copy source, run composer install only if vendor directory is present (network is disallowed in Nix builds)
  webapppasswordApp =
    pkgs.runCommand "webapppassword-app"
      (
        {
          src = ../../.;
          buildInputs = [
            pkgs.php84Packages.composer
            pkgs.php
          ];
          preferLocalBuild = true;
          allowSubstitutes = false; # ensure we always build locally (still won't rebuild if output already exists)
        }
        // lib.optionalAttrs (forceRebuildNonce != "") { FORCE_REBUILD_NONCE = forceRebuildNonce; }
      )
      ''
        mkdir -p $out
        cp -r $src/* $out/
        chmod -R u+w $out
        if [ -n "$FORCE_REBUILD_NONCE" ]; then
          echo "$FORCE_REBUILD_NONCE" > $out/.force-rebuild-nonce
          echo "Force rebuild nonce embedded: $FORCE_REBUILD_NONCE"
        fi
        export COMPOSER_ALLOW_SUPERUSER=1
        export HOME=$TMPDIR
        if [ -f "$out/composer.json" ]; then
          if [ -d "$out/vendor" ]; then
            echo "Running composer install (offline, expects vendor already vendored)"
            (cd $out && composer install --no-dev --optimize-autoloader --no-interaction || composer dump-autoload --optimize || true)
          else
            echo "No vendor directory found; skipping composer install to avoid network (would fail)"
          fi
        fi
      '';

  mkNode = pkg: name: {
    ${name} = _: {
      services.nextcloud = {
        enable = true;
        package = pkg;
        hostName = "localhost";
        config.adminuser = "admin";
        config.adminpassFile = "/etc/nextcloud-adminpass";
        config.dbtype = "sqlite";
        config.dbname = "nextcloud";
        extraApps = {
          webapppassword = webapppasswordApp;
        }; # attrset form
        extraAppsEnable = true; # auto-enable on first run
      };
      networking.firewall.allowedTCPPorts = [
        80
        443
      ];
      environment.etc."nextcloud-adminpass".text = "adminpass";
    };
  };

  node30 = if has30 then mkNode pkg30 "nextcloud30" else { };
  node31 = if has31 then mkNode pkg31 "nextcloud31" else { };

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
          nextcloud30.succeed("curl -fsSL http://localhost/status.php | grep 'installed' | grep 'true'")
          nextcloud30.succeed("sudo -u nextcloud nextcloud-occ app:list | grep -i webapppassword || (echo 'App missing (30)'; sudo -u nextcloud nextcloud-occ app:list; exit 1)")
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
          nextcloud31.succeed("curl -fsSL http://localhost/status.php | grep 'installed' | grep 'true'")
          nextcloud31.succeed("sudo -u nextcloud nextcloud-occ app:list | grep -i webapppassword || (echo 'App missing (31)'; sudo -u nextcloud nextcloud-occ app:list; exit 1)")
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
