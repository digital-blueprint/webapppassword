{
  description = "Nextcloud webapppassword app NixOS VM tests (Nextcloud 30 & 31)";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";

  outputs =
    { nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
      combinedTest = import ./tests/vm/basic.nix { inherit pkgs; };
      test31 = import ./tests/vm/nextcloud31.nix { inherit pkgs; };
    in
    {
      nixosTests.nextcloud-webapppassword = combinedTest;
      nixosTests.nextcloud31-webapppassword = test31;
      checks.${system}.nextcloud-webapppassword = combinedTest;
      checks.${system}.nextcloud31-webapppassword = test31;
    };
}
