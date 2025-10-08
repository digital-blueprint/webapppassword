{
  description = "Nextcloud webapppassword app NixOS VM tests (Nextcloud 28?31)";

  inputs.nixpkgs25_05.url = "github:NixOS/nixpkgs/nixos-25.05";
  # Add 24.11 channel for Nextcloud 28 & 29
  inputs.nixpkgs24_11.url = "github:NixOS/nixpkgs/nixos-24.11";

  outputs =
    { nixpkgs25_05, nixpkgs24_11, ... }:
    let
      system = "x86_64-linux";
      baseConfig = {
        config.permittedInsecurePackages = [ "nextcloud-28.0.14" ];
      };
      pkgs25_05 = import nixpkgs25_05 ({ inherit system; } // baseConfig);
      pkgs24_11 = import nixpkgs24_11 ({ inherit system; } // baseConfig);
      combinedTest = import ./tests/vm/basic.nix {
        inherit pkgs25_05 pkgs24_11;
      };
    in
    {
      nixosTests = {
        nextcloud-webapppassword = combinedTest;
      };
    };
}
