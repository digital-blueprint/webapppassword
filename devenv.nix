{
  pkgs,
  ...
}:

{
  # https://devenv.sh/packages/
  packages = with pkgs; [
    lazygit
    zellij
    libxml2 # for xmllint
  ];

  enterShell = ''
    echo "🛠️ WebAppPassword dev shell"
  '';

  # https://devenv.sh/git-hooks/
  git-hooks = {
    excludes = [
      "appinfo/signature.json"
      "docs/example/dist"
      "docs/example/src/packages"
    ];
  };

  # See full reference at https://devenv.sh/reference/options/
}
