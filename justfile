# Use `just <recipe>` to run a recipe
# https://just.systems/man/en/

import ".shared/common.just"

# By default, run the `--list` command
default:
    @just --list

# Variables

transferDir := `if [ -d "$HOME/NextcloudPrivate/Transfer" ]; then echo "$HOME/NextcloudPrivate/Transfer"; else echo "$HOME/Nextcloud/Transfer"; fi`
projectName := 'webapppassword'

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

# Run tests for multiple versions of Nextcloud
[group('test')]
vm-test args='':
    nix build -L .#nixosTests.nextcloud-webapppassword {{ args }}

# Interactive NixOS test driver session for the combined Nextcloud versions.
# Tries driverInteractive first (non-executing build), then falls back to driver (also non-executing) if needed.
# Usage examples:
#   just vm-test-interactive
#   just vm-test-interactive args="--impure"        # allow env vars: FORCE_REBUILD_NONCE=...

# Interactive NixOS test driver session for the combined Nextcloud versions test
[group('test')]
vm-test-interactive args='':
    if nix build -L .#nixosTests.nextcloud-webapppassword.driverInteractive {{ args }}; then \
        echo "Built driverInteractive attribute"; \
    elif nix build -L .#nixosTests.nextcloud-webapppassword.driver {{ args }}; then \
        echo "driverInteractive missing; using driver attribute"; \
    else \
        echo "Failed to build either driverInteractive or driver attribute"; \
        exit 1; \
    fi
    ./result/bin/nixos-test-driver
