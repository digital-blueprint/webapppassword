{
  pkgs25_05,
  pkgs24_11 ? null,
  allowInsecureNextcloud ? false,
  ...
}:

let
  inherit (pkgs25_05) lib;
  # Optional dev-only knob: set FORCE_REBUILD_NONCE (with --impure) to force a new store path
  # Example (fish): env FORCE_REBUILD_NONCE=(date +%s) nix build --impure -L .#nixosTests.nextcloud-webapppassword
  forceRebuildNonce = builtins.getEnv "FORCE_REBUILD_NONCE";
  tryAttr =
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

  # Wrapper to make legacy Nextcloud derivations ignore override args (e.g. caBundle introduced later)
  legacyCompat =
    pkg:
    pkg
    // {
      override = _args: legacyCompat pkg; # ignore args to avoid unexpected argument errors
      overrideDerivation = f: legacyCompat (pkg.overrideDerivation f);
    };

  # Flexible PHP package set selection for composer
  phpPkgSet =
    pkgs25_05.php84Packages
      or (pkgs25_05.php83Packages or (pkgs25_05.php82Packages or (pkgs25_05.php81Packages or null)));
  composerPkg =
    if phpPkgSet != null && phpPkgSet ? composer then phpPkgSet.composer else pkgs25_05.composer; # pkgs25_05.composer as last resort
  phpInterp = pkgs25_05.php or (if phpPkgSet != null && phpPkgSet ? php then phpPkgSet.php else null);

  raw28 = if allowInsecureNextcloud then tryAttr24 "nextcloud28" else null;
  raw29 = tryAttr24 "nextcloud29"; # still supported
  pkg28 = if raw28 != null then legacyCompat raw28 else null;
  pkg29 = if raw29 != null then legacyCompat raw29 else null;
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

  has28 = pkg28 != null;
  has29 = pkg29 != null;
  has30 = pkg30 != null;
  has31 = pkg31 != null;

  # Build the app once (using primary pkgs set)
  webapppasswordApp =
    pkgs25_05.runCommand "webapppassword-app"
      (
        {
          src = ../../.;
          buildInputs = lib.filter (x: x != null) [
            composerPkg
            phpInterp
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

in
pkgs25_05.nixosTest {
  name = "nextcloud_webapppassword";
  nodes = node28 // node29 // node30 // node31;
  testScript = ''
    print("Has28=${toString has28} Has29=${toString has29} Has30=${toString has30} Has31=${toString has31}")
    start_all()

    # Helper to test a Nextcloud node consistently
    def test_version(node, label, pkg_version):
        print(f"Testing Nextcloud {label} ({pkg_version})")
        node.wait_for_unit("phpfpm-nextcloud.service")
        node.wait_for_unit("nginx.service")
        node.succeed("curl -fsSL http://localhost/status.php | grep 'installed' | grep 'true'")
        node.succeed("sudo -u nextcloud nextcloud-occ app:list | grep -i webapppassword || (echo 'App missing ({label})'; sudo -u nextcloud nextcloud-occ app:list; exit 1)")
        node.succeed("curl -s -o /dev/null -w '%{http_code}' http://localhost/login | grep 200")
        node.succeed("sudo -u nextcloud nextcloud-occ status | grep -i 'version:'")

    ${
      if has28 then
        ''test_version(nextcloud28, "28", "${pkg28.version}")''
      else
        ''print("Skipping Nextcloud 28: not enabled or not permitted")''
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
        ''print("Skipping Nextcloud 31: package not present or not version 31.x")''
    }

    print("ALL_TESTS_DONE")
  '';
}
