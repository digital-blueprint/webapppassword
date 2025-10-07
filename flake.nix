{
  description = "Nextcloud webapppassword app NixOS VM tests (Nextcloud 30 & 31)";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";

  outputs =
    { nixpkgs, ... }: # accept self to avoid unexpected argument error
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
      inherit (pkgs) lib;
      combinedTest = import ./tests/vm/basic.nix { inherit pkgs; };
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
