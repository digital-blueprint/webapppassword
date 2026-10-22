{
  description = "Nextcloud webapppassword app NixOS VM tests (Nextcloud 32-35)";

  inputs = {
    # Nextcloud 32 & 33
    nixpkgs25_11.url = "github:NixOS/nixpkgs/nixos-25.11";
    # Nextcloud 34
    nixpkgs26_05.url = "github:NixOS/nixpkgs/nixos-26.05";
    # Nextcloud 35 (not available in 26.05)
    nixpkgsUnstable.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    {
      nixpkgs25_11,
      nixpkgs26_05,
      nixpkgsUnstable,
      ...
    }:
    let
      system = "x86_64-linux";
      pkgs25_11 = import nixpkgs25_11 { inherit system; };
      pkgs26_05 = import nixpkgs26_05 { inherit system; };
      pkgsUnstable = import nixpkgsUnstable { inherit system; };
      combinedTest = import ./tests/vm/basic.nix {
        inherit pkgs25_11 pkgs26_05 pkgsUnstable;
      };
    in
    {
      nixosTests = {
        nextcloud-webapppassword = combinedTest;
      };
    };
}
