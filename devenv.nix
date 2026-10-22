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
    (python3.withPackages (ps: [ ps.playwright ]))
    playwright-driver.browsers
  ];

  env.PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
  env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";

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
