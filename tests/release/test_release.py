"""Offline release preflight and publication safety regression tests."""

import base64
import hashlib
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


check = load("check-release")
github = load("publish-github-release")
appstore = load("publish-appstore")
VERSION = "26.10.0"
COMMIT = "a" * 40
REPOSITORY = "digital-blueprint/webapppassword"
URL = f"https://github.com/{REPOSITORY}/releases/download/v{VERSION}/webapppassword-{VERSION}.tar.gz"


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in check.REQUIRED:
            if "." in name or name == "COPYING":
                (self.root / name).write_text("fixture\n")
            else:
                (self.root / name).mkdir()
        (self.root / "appinfo/info.xml").write_text(
            f"<info><id>webapppassword</id><version>{VERSION}</version></info>"
        )
        (self.root / "CHANGELOG.md").write_text(
            f"# Changelog\n\n## {VERSION}\n\n- Release notes\n"
        )
        (self.root / "release-files.txt").write_text(
            "\n".join(sorted(check.REQUIRED)) + "\n"
        )
        (self.root / "scripts").mkdir()
        shutil.copy(
            ROOT / "scripts/check-release.py", self.root / "scripts/check-release.py"
        )
        (self.root / "build").mkdir()
        self.archive = self.root / "build" / f"webapppassword-{VERSION}.tar.gz"
        self.archive.write_bytes(b"signed archive fixture")
        self.signature = self.archive.with_name(self.archive.name + ".sig")
        self.signature.write_text(base64.b64encode(b"signature fixture").decode())
        self.checksum = self.archive.with_name(self.archive.name + ".sha256")
        self.checksum.write_text(
            f"{hashlib.sha256(self.archive.read_bytes()).hexdigest()}  {self.archive.name}\n"
        )

    def test_valid_release_and_last_changelog_section(self):
        self.assertEqual(check.check_release(self.root), (VERSION, "- Release notes\n"))

    def test_unreleased_requires_development_opt_in(self):
        path = self.root / "CHANGELOG.md"
        path.write_text("## Unreleased\n\n- Work in progress\n\n" + path.read_text())
        with self.assertRaisesRegex(ValueError, "newest section"):
            check.check_release(self.root)
        self.assertEqual(check.check_release(self.root, True)[0], VERSION)

    def test_duplicate_or_empty_changelog(self):
        path = self.root / "CHANGELOG.md"
        path.write_text(path.read_text() + f"\n## {VERSION}\n- Duplicate\n")
        with self.assertRaisesRegex(ValueError, "exactly one"):
            check.check_release(self.root)
        path.write_text(f"## {VERSION}\n\n## 26.9.0\n\n- Older notes\n")
        with self.assertRaisesRegex(ValueError, "empty"):
            check.check_release(self.root)

    def test_wrong_app_or_invalid_version(self):
        for app, version in [("qownnotes", VERSION), ("webapppassword", "26.13.0")]:
            (self.root / "appinfo/info.xml").write_text(
                f"<info><id>{app}</id><version>{version}</version></info>"
            )
            with self.assertRaises(ValueError):
                check.check_release(self.root)

    def test_manifest_rejects_missing_duplicate_traversal_and_symlinks(self):
        manifest = self.root / "release-files.txt"
        original = manifest.read_text()
        for extra in ["missing", "appinfo", "../secret"]:
            manifest.write_text(original + extra + "\n")
            with self.assertRaises(ValueError):
                check.check_release(self.root)
        manifest.write_text(original)
        (self.root / "js/link").symlink_to(self.root / "README.md")
        with self.assertRaisesRegex(ValueError, "Symlinks"):
            check.check_release(self.root)

    def test_github_rejects_mismatched_tag(self):
        responses = [None, "{}", json.dumps({"sha": "b" * 40})]
        with patch.object(github, "gh", side_effect=responses) as cli:
            with self.assertRaisesRegex(ValueError, "different commit"):
                github.publish(self.root, COMMIT, REPOSITORY)
            self.assertEqual(cli.call_count, 3)

    def test_github_rejects_bad_checksum_before_network(self):
        self.archive.write_bytes(b"changed archive")
        with patch.object(github, "gh") as cli:
            with self.assertRaisesRegex(ValueError, "checksum"):
                github.publish(self.root, COMMIT, REPOSITORY)
            cli.assert_not_called()

    def test_github_creates_draft_uploads_then_publishes(self):
        with patch.object(github, "gh", side_effect=[None, None] + [""] * 5) as cli:
            github.publish(self.root, COMMIT, REPOSITORY)
            calls = [call.args for call in cli.call_args_list]
            self.assertIn("--draft", calls[2])
            self.assertEqual(calls[3][:2], ("release", "upload"))
            self.assertIn("--draft=false", calls[-1])
            self.assertEqual(
                (self.root / "release-notes.md").read_text(), "- Release notes\n"
            )

    def test_github_does_not_add_assets_to_published_release(self):
        release = json.dumps({"draft": False, "assets": []})
        with (
            patch.object(
                github, "gh", side_effect=[release, "{}", json.dumps({"sha": COMMIT})]
            ),
            self.assertRaisesRegex(ValueError, "refusing to modify"),
        ):
            github.publish(self.root, COMMIT, REPOSITORY)

    def test_github_does_not_overwrite_existing_asset(self):
        release = json.dumps({"draft": True, "assets": [{"name": self.archive.name}]})

        def cli(*args, **kwargs):
            if args[:2] == ("release", "download"):
                (Path(args[args.index("--dir") + 1]) / self.archive.name).write_bytes(
                    b"different"
                )
                return ""
            return {
                f"repos/{REPOSITORY}/releases/tags/v{VERSION}": release,
                f"repos/{REPOSITORY}/git/ref/tags/v{VERSION}": "{}",
                f"repos/{REPOSITORY}/commits/v{VERSION}": json.dumps({"sha": COMMIT}),
            }[args[1]]

        with (
            patch.object(github, "gh", side_effect=cli),
            self.assertRaisesRegex(ValueError, "Refusing to overwrite"),
        ):
            github.publish(self.root, COMMIT, REPOSITORY)

    def test_appstore_rejects_invalid_inputs_without_network(self):
        with patch.object(appstore.urllib.request, "urlopen") as network:
            for url, token in [
                (URL, ""),
                (URL, "token\n"),
                (URL.replace(VERSION, "26.9.0"), "token"),
            ]:
                with self.assertRaises(ValueError):
                    appstore.publish(url, self.signature, self.archive, token)
            self.signature.write_text("not base64")
            with self.assertRaises(ValueError):
                appstore.publish(URL, self.signature, self.archive, "token")
            network.assert_not_called()

    def test_appstore_verifies_public_bytes_before_submission(self):
        with patch.object(appstore.urllib.request, "urlopen") as network:
            response = network.return_value.__enter__.return_value
            response.geturl.return_value = URL
            response.read.return_value = b"different public archive"
            with self.assertRaisesRegex(ValueError, "differs"):
                appstore.publish(URL, self.signature, self.archive, "token")
            self.assertEqual(network.call_count, 1)

    def test_appstore_token_only_sent_to_store(self):
        with patch.object(appstore.urllib.request, "urlopen") as network:
            response = network.return_value.__enter__.return_value
            response.geturl.return_value = URL
            response.read.return_value = self.archive.read_bytes()
            response.status = 201
            self.assertEqual(
                appstore.publish(URL, self.signature, self.archive, "token"), 201
            )
            self.assertEqual(network.call_args_list[0].args, (URL,))
            request = network.call_args_list[1].args[0]
            self.assertEqual(request.full_url, appstore.ENDPOINT)
            self.assertEqual(request.get_header("Authorization"), "Token token")
            self.assertEqual(json.loads(request.data)["nightly"], False)


if __name__ == "__main__":
    unittest.main()
