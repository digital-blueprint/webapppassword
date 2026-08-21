# https://wiki.nixos.org/wiki/NixOS_VM_tests
{
  pkgs25_11,
  pkgs26_05,
  ...
}:

let
  inherit (pkgs26_05) lib;
  # Safe lookup on pkgs25_11 catching eval errors
  tryAttr2511 =
    name:
    if pkgs25_11 != null && builtins.hasAttr name pkgs25_11 then
      (
        let
          t = builtins.tryEval (builtins.getAttr name pkgs25_11);
        in
        if t.success then t.value else null
      )
    else
      null;

  # Make older Nextcloud derivations ignore override args introduced by newer modules.
  packageCompat =
    pkg:
    pkg
    // {
      override = _args: packageCompat pkg;
      overrideDerivation = f: packageCompat (pkg.overrideDerivation f);
    };

  compatPkg25_11 =
    name:
    let
      p = tryAttr2511 name;
    in
    if p != null then packageCompat p else null;

  # Flexible PHP package set selection for composer
  phpPkgSet =
    pkgs26_05.php85Packages
      or (pkgs26_05.php84Packages or (pkgs26_05.php83Packages or (pkgs26_05.php82Packages or null)));
  composerPkg =
    if phpPkgSet != null && phpPkgSet ? composer then phpPkgSet.composer else pkgs26_05.composer;
  phpInterp = pkgs26_05.php or (if phpPkgSet != null && phpPkgSet ? php then phpPkgSet.php else null);

  # Nextcloud 32/33 come from 25.11, 34 from 26.05.
  pkg32 = compatPkg25_11 "nextcloud32";
  pkg33 = compatPkg25_11 "nextcloud33";
  pkg34 = pkgs26_05.nextcloud34 or null;

  has32 = pkg32 != null;
  has33 = pkg33 != null;
  has34 = pkg34 != null;

  # Build the app once (using primary pkgs set)
  webapppasswordApp =
    pkgs26_05.runCommand "webapppassword-app"
      {
        src = ../../.;
        buildInputs = lib.filter (x: x != null) [
          composerPkg
          phpInterp
        ];
        preferLocalBuild = true;
        allowSubstitutes = false; # ensure we always build locally (still won't rebuild if output already exists)
      }
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
        config = {
          adminuser = "admin";
          adminpassFile = "/etc/nextcloud-adminpass";
          dbtype = "sqlite";
          dbname = "nextcloud";
        };
        extraApps = {
          webapppassword = webapppasswordApp;
        };
        extraAppsEnable = true;
      };
      networking.firewall.allowedTCPPorts = [
        80
        443
      ];
      environment.etc."nextcloud-adminpass".text = "adminpass";
    };
  };

  node32 = if has32 then mkNode pkg32 "nextcloud32" else { };
  node33 = if has33 then mkNode pkg33 "nextcloud33" else { };
  node34 = if has34 then mkNode pkg34 "nextcloud34" else { };

in
# Fail early if any required Nextcloud package is missing
assert (lib.assertMsg has32 "Missing required package: nextcloud32 (expected in pkgs25_11)");
assert (lib.assertMsg has33 "Missing required package: nextcloud33 (expected in pkgs25_11)");
assert (lib.assertMsg has34 "Missing required package: nextcloud34 (expected in pkgs26_05)");

pkgs26_05.testers.nixosTest {
  name = "nextcloud_webapppassword";
  nodes = node32 // node33 // node34;
  interactive.sshBackdoor.enable = true; # provides ssh-config & vsock access (needs host vsock support)
  testScript = ''
    print("Has32=${toString has32} Has33=${toString has33} Has34=${toString has34}")
    start_all()

    # Helper to test a Nextcloud node consistently
    def test_version(node, label, pkg_version):
        print(f"Testing Nextcloud {label} ({pkg_version})")
        node.wait_for_unit("phpfpm-nextcloud.service")
        node.wait_for_unit("nginx.service")
        node.succeed("curl -fsSL http://localhost/status.php | grep 'installed' | grep 'true'")
        node.succeed("sudo -u nextcloud nextcloud-occ app:list | grep -i webapppassword || (echo 'App missing ({label})'; sudo -u nextcloud nextcloud-occ app:list; exit 1)")
        assert "200" in node.succeed("curl -s -o /dev/null -w '%{http_code}' http://localhost/login"), "Login page needs to show up!"
        node.succeed("sudo -u nextcloud nextcloud-occ status | grep -i 'version:'")
        # Test origins webapppassword app endpoint
        node.succeed("sudo -u nextcloud nextcloud-occ config:system:set webapppassword.origins 0 --value 'https://known-site.com'")
        assert "200" in node.succeed("curl -s -o /dev/null -w '%{http_code}' http://admin:adminpass@localhost/index.php/apps/webapppassword?target-origin=https%3A%2F%2Fknown-site.com"), "Access to https://known-site.com must be allowed!"
        assert "403" in node.succeed("curl -s -o /dev/null -w '%{http_code}' http://admin:adminpass@localhost/index.php/apps/webapppassword?target-origin=https%3A%2F%2Funknown-site.com"), "Access to https://unknown-site.com must be denied!"

    ${
      if has32 then
        ''test_version(nextcloud32, "32", "${pkg32.version}")''
      else
        ''print("Skipping Nextcloud 32: package not present")''
    }

    ${
      if has33 then
        ''test_version(nextcloud33, "33", "${pkg33.version}")''
      else
        ''print("Skipping Nextcloud 33: package not present")''
    }

    ${
      if has34 then
        ''test_version(nextcloud34, "34", "${pkg34.version}")''
      else
        ''print("Skipping Nextcloud 34: package not present")''
    }
    print("ALL_TESTS_DONE")
  '';
}
