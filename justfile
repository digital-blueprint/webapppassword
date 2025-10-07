# Use `just <recipe>` to run a recipe
# https://just.systems/man/en/

# By default, run the `--list` command
default:
    @just --list

# Variables

transferDir := `if [ -d "$HOME/NextcloudPrivate/Transfer" ]; then echo "$HOME/NextcloudPrivate/Transfer"; else echo "$HOME/Nextcloud/Transfer"; fi`
projectName := 'webapppassword'

# Aliases

alias fmt := format

# Open a terminal with the project session
[group('dev')]
term-run:
    zellij --layout term.kdl attach {{ projectName }} -c

# Kill the project session
[group('dev')]
term-kill:
    -zellij delete-session {{ projectName }} -f

# Kill and run a terminal with the project session
[group('dev')]
term: term-kill term-run

# Apply the patch to the project repository
[group('patch')]
git-apply-patch:
    git apply {{ transferDir }}/{{ projectName }}.patch

# Create a patch from the staged changes in the project repository
[group('patch')]
@git-create-patch:
    echo "transferDir: {{ transferDir }}"
    git diff --no-ext-diff --staged --binary > {{ transferDir }}/{{ projectName }}.patch
    ls -l1t {{ transferDir }}/ | head -2

# Run the GitHub Actions test workflow locally with act
[group('dev')]
github-run-test:
    nix-shell -p act --run "act -W .github/workflows/test.yml"

# Run the unit tests (only would work in a Nextcloud test environment)
[group('dev')]
test:
    php ./vendor/phpunit/phpunit/phpunit -c phpunit.xml
    php ./vendor/phpunit/phpunit/phpunit -c phpunit.integration.xml

# Build the project
[group('dev')]
build:
    make build

# Format all files using treefmt
[group('linter')]
format args='':
    treefmt {{ args }}

# Format all files using pre-commit
[group('linter')]
format-all args='':
    composer install
    pre-commit run --all-files {{ args }}

# Add git commit hashes to the .git-blame-ignore-revs file
[group('linter')]
add-git-blame-ignore-revs:
    git log --pretty=format:"%H" --grep="^lint" >> .git-blame-ignore-revs
    sort .git-blame-ignore-revs | uniq > .git-blame-ignore-revs.tmp
    mv .git-blame-ignore-revs.tmp .git-blame-ignore-revs

# Run tests for multiple versions of Nextcloud
[group('test')]
vm-test-combined args='':
    nix build -L .#nixosTests.nextcloud-webapppassword {{ args }}
