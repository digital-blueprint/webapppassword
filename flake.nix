{
  description = "Nextcloud webapppassword app NixOS VM tests (Nextcloud 28?31)";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  # Add 24.11 channel for Nextcloud 28 & 29
  inputs.nixpkgs24_11.url = "github:NixOS/nixpkgs/nixos-24.11";

  outputs =
    { nixpkgs, nixpkgs24_11, ... }:
    let
      system = "x86_64-linux";
      # Allow insecure Nextcloud versions (e.g. 28) only if explicitly opted in via env (requires --impure) or always by editing below.
      allowInsecure =
        (builtins.getEnv "NIXPKGS_ALLOW_INSECURE" == "1")
        || (builtins.getEnv "ALLOW_INSECURE_NEXTCLOUD" == "1");
      permittedInsecure = [ "nextcloud-28.0.14" ];
      baseConfig =
        if allowInsecure then { config.permittedInsecurePackages = permittedInsecure; } else { };
      pkgs = import nixpkgs ({ inherit system; } // baseConfig);
      pkgs24 = import nixpkgs24_11 ({ inherit system; } // baseConfig);
      inherit (pkgs) lib;
      combinedTest = import ./tests/vm/basic.nix {
        inherit pkgs pkgs24;
        allowInsecureNextcloud = allowInsecure;
      };
      hasNextcloud31 = lib.hasAttr "nextcloud31" pkgs;
      test31 = if hasNextcloud31 then import ./tests/vm/nextcloud31.nix { inherit pkgs; } else null;
    in
    {
      nixosTests = {
        nextcloud-webapppassword = combinedTest;
      }
      // lib.optionalAttrs hasNextcloud31 { nextcloud31-webapppassword = test31; };

      checks.${system} = {
        nextcloud-webapppassword = combinedTest;
      }
      // lib.optionalAttrs hasNextcloud31 { nextcloud31-webapppassword = test31; };
    };
}
