#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Validate release inputs without credentials or publication."""

import argparse
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

CALVER = r"[0-9]{2}\.(?:[1-9]|1[0-2])\.(?:0|[1-9][0-9]*)"
REQUIRED = {
    "appinfo",
    "css",
    "img",
    "js",
    "l10n",
    "lib",
    "templates",
    "COPYING",
    "README.md",
    "CHANGELOG.md",
}


def check_release(root: Path, allow_unreleased: bool = False) -> tuple[str, str]:
    info = ET.parse(root / "appinfo/info.xml").getroot()
    version = info.findtext("version", "")
    if info.findtext("id") != "webapppassword":
        raise ValueError("appinfo/info.xml must use app ID webapppassword")
    if not re.fullmatch(CALVER, version):
        raise ValueError("appinfo/info.xml must contain a CalVer YY.M.patch version")
    changelog = (root / "CHANGELOG.md").read_text()
    sections = list(re.finditer(r"^## (.+)$", changelog, re.MULTILINE))
    matching = [section for section in sections if section.group(1) == version]
    if len(matching) != 1:
        raise ValueError(f"CHANGELOG.md must contain exactly one section for {version}")
    preceding = sections[: sections.index(matching[0])]
    if preceding and not (
        allow_unreleased
        and len(preceding) == 1
        and preceding[0].group(1) == "Unreleased"
    ):
        raise ValueError(f"CHANGELOG.md newest section must match {version}")
    notes = re.split(
        r"^## ", changelog[matching[0].end() :], maxsplit=1, flags=re.MULTILINE
    )[0].strip()
    if not notes:
        raise ValueError(f"CHANGELOG.md release notes for {version} are empty")
    entries = []
    for line in (root / "release-files.txt").read_text().splitlines():
        if not line or line.startswith("#"):
            continue
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", line) or line in entries:
            raise ValueError(f"Invalid or duplicate release-files.txt entry: {line!r}")
        entries.append(line)
        path = root / line
        if not path.exists():
            raise ValueError(f"Missing release input: {line}")
        if path.is_symlink() or (
            path.is_dir() and any(p.is_symlink() for p in path.rglob("*"))
        ):
            raise ValueError(f"Symlinks are not allowed in release input: {line}")
    if missing := REQUIRED - set(entries):
        raise ValueError(
            f"Missing required release inputs: {', '.join(sorted(missing))}"
        )
    return version, notes + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path, default=Path(__file__).resolve().parent.parent
    )
    parser.add_argument(
        "--allow-unreleased",
        action="store_true",
        help="allow one leading Unreleased section for development checks",
    )
    parser.add_argument("--notes-output", type=Path)
    args = parser.parse_args()
    try:
        version, notes = check_release(args.root, args.allow_unreleased)
        if args.notes_output:
            args.notes_output.write_text(notes)
    except (OSError, ValueError, ET.ParseError) as error:
        print(f"Release check failed: {error}", file=sys.stderr)
        return 1
    print(version)
    return 0


if __name__ == "__main__":
    sys.exit(main())
