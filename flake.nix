{
  description = "A development shell for the project";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in
    {
      devShells."${system}".default =
        with import nixpkgs { system = "x86_64-linux"; };
        mkShell {
          packages = with pkgs; [
            gnumake
            nodejs
            php83
            php83Packages.composer
            zellij # smart terminal workspace
            lazygit # git terminal
            just # task runner
          ];

          shellHook = ''
            # Determine the repository root
            REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

            # Check if we are in the repository root
            if [ "$REPO_ROOT" = "$(pwd)" ]; then
              # Symlink the pre-commit hook into the .git/hooks directory
              ln -sf ../../scripts/pre-commit.sh .git/hooks/pre-commit
            fi
          '';
        };
    };
}
