# https://wiki.nixos.org/wiki/NixOS_VM_tests
{
  pkgs24_11,
  pkgs25_05,
  pkgs25_11,
  ...
}:

let
  inherit (pkgs25_05) lib;
  tryAttr25 =
    name:
    let
      t = builtins.tryEval (builtins.getAttr name pkgs25_05);
    in
    if t.success then t.value else null;
  # Safe lookup on pkgs24_11 catching insecure-package eval errors
  tryAttr24 =
    name:
    if pkgs24_11 != null && builtins.hasAttr name pkgs24_11 then
      (
        let
          t = builtins.tryEval (builtins.getAttr name pkgs24_11);
        in
        if t.success then t.value else null
      )
    else
      null;
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

  # Wrapper to make legacy Nextcloud derivations ignore override args (e.g. caBundle introduced later)
  legacyCompat =
    pkg:
    pkg
    // {
      override = _args: legacyCompat pkg; # ignore args to avoid unexpected argument errors
      overrideDerivation = f: legacyCompat (pkg.overrideDerivation f);
    };

  # Helper to fetch a legacy pkg (from 24_11 set) and wrap it if it exists
  legacyPkg =
    name:
    let
      p = tryAttr24 name;
    in
    if p != null then legacyCompat p else null;

  # Flexible PHP package set selection for composer
  phpPkgSet =
    pkgs25_05.php84Packages
      or (pkgs25_05.php83Packages or (pkgs25_05.php82Packages or (pkgs25_05.php81Packages or null)));
  composerPkg =
    if phpPkgSet != null && phpPkgSet ? composer then phpPkgSet.composer else pkgs25_05.composer; # pkgs25_05.composer as last resort
  phpInterp = pkgs25_05.php or (if phpPkgSet != null && phpPkgSet ? php then phpPkgSet.php else null);

  # Legacy (28/29) come from 24.11, 30/31 from 25.05, 32 from 25.11
  pkg28 = legacyPkg "nextcloud28";
  pkg29 = legacyPkg "nextcloud29";
  pkg30 = tryAttr25 "nextcloud30";
  pkg31 = tryAttr25 "nextcloud31";
  pkg32 = tryAttr2511 "nextcloud32";

  has28 = pkg28 != null;
  has29 = pkg29 != null;
  has30 = pkg30 != null;
  has31 = pkg31 != null;
  has32 = pkg32 != null;

  # Build the app once (using primary pkgs set)
  webapppasswordApp =
    pkgs25_05.runCommand "webapppassword-app"
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

  node28 = if has28 then mkNode pkg28 "nextcloud28" else { };
  node29 = if has29 then mkNode pkg29 "nextcloud29" else { };
  node30 = if has30 then mkNode pkg30 "nextcloud30" else { };
  node31 = if has31 then mkNode pkg31 "nextcloud31" else { };
  node32 = if has32 then mkNode pkg32 "nextcloud32" else { };

in
# Fail early if any required Nextcloud package is missing
assert (lib.assertMsg has28 "Missing required package: nextcloud28 (expected in pkgs24_11)");
assert (lib.assertMsg has29 "Missing required package: nextcloud29 (expected in pkgs24_11)");
assert (lib.assertMsg has30 "Missing required package: nextcloud30 (expected in pkgs25_05)");
assert (lib.assertMsg has31 "Missing required package: nextcloud31 (expected in pkgs25_05)");
assert (lib.assertMsg has32 "Missing required package: nextcloud32 (expected in pkgs25_11)");

pkgs25_05.nixosTest {
  name = "nextcloud_webapppassword";
  nodes = node28 // node29 // node30 // node31 // node32;
  interactive.sshBackdoor.enable = true; # provides ssh-config & vsock access (needs host vsock support)
  testScript = ''
    print("Has28=${toString has28} Has29=${toString has29} Has30=${toString has30} Has31=${toString has31} Has32=${toString has32}")
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
      if has28 then
        ''test_version(nextcloud28, "28", "${pkg28.version}")''
      else
        ''print("Skipping Nextcloud 28: package not present")''
    }

    ${
      if has29 then
        ''test_version(nextcloud29, "29", "${pkg29.version}")''
      else
        ''print("Skipping Nextcloud 29: package not present")''
    }

    ${
      if has30 then
        ''test_version(nextcloud30, "30", "${pkg30.version}")''
      else
        ''print("Skipping Nextcloud 30: package not present")''
    }

    ${
      if has31 then
        ''test_version(nextcloud31, "31", "${pkg31.version}")''
      else
        ''print("Skipping Nextcloud 31: package not present")''
    }

    ${
      if has32 then
        ''test_version(nextcloud32, "32", "${pkg32.version}")''
      else
        ''print("Skipping Nextcloud 32: package not present")''
    }
    print("ALL_TESTS_DONE")
  '';
}
