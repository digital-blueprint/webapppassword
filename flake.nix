{
  description = "Nextcloud webapppassword app NixOS VM tests (Nextcloud 32-34)";

  inputs = {
    # Nextcloud 32 & 33
    nixpkgs25_11.url = "github:NixOS/nixpkgs/nixos-25.11";
    # Nextcloud 34
    nixpkgs26_05.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs =
    {
      nixpkgs25_11,
      nixpkgs26_05,
      ...
    }:
    let
      system = "x86_64-linux";
      pkgs25_11 = import nixpkgs25_11 { inherit system; };
      pkgs26_05 = import nixpkgs26_05 { inherit system; };
      combinedTest = import ./tests/vm/basic.nix {
        inherit pkgs25_11 pkgs26_05;
      };
    in
    {
      nixosTests = {
        nextcloud-webapppassword = combinedTest;
      };
    };
}
