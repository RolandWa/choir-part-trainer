#!/usr/bin/env python3
"""Publish a new version of Choir Part Trainer.

Usage:
    python tools/release.py 1.1.0 "What changed"            # update files, commit, tag, push
    python tools/release.py 1.1.0 "What changed" --no-git   # update files only
    add --skip-tests to publish even when tests fail (not recommended)

What it does:
  0. runs the tests (node tests/run.js, and tests/browser/run.js when Playwright is installed) and stops if any fails,
  1. sets APP_VERSION in index.html,
  2. updates the ?v=... numbers of i18n.js and warmups.js in index.html and warmups.html
     and the cache name in sw.js (so phones load the new files together with the new page),
  3. adds an entry at the top of CHANGELOG.md,
  4. commits, creates the tag v1.1.0 and pushes to GitHub (GitHub Pages then publishes it).
"""
import datetime
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCRIPT_REF = re.compile(r'(src="(?:i18n|warmups)\.js)(?:\?v=[^"]*)?"')


def fail(msg):
    print('Error: ' + msg)
    sys.exit(1)


def update_file(path, version, set_app_version=False):
    text = path.read_text(encoding='utf-8')
    new = SCRIPT_REF.sub(lambda m: m.group(1) + '?v=' + version + '"', text)
    if set_app_version:
        if not re.search(r"const APP_VERSION='[^']*'", new):
            fail('APP_VERSION not found in ' + path.name)
        new = re.sub(r"const APP_VERSION='[^']*'", "const APP_VERSION='" + version + "'", new)
    path.write_text(new, encoding='utf-8')


def update_changelog(version, notes):
    path = ROOT / 'CHANGELOG.md'
    text = path.read_text(encoding='utf-8') if path.exists() else '# Changelog\n'
    if re.search(r'^## ' + re.escape(version) + r'\b', text, re.M):
        print('CHANGELOG.md already has ' + version + ' – left unchanged.')
        return
    entry = '## ' + version + ' – ' + datetime.date.today().isoformat() + '\n\n'
    if notes:
        entry += ''.join('- ' + line.strip() + '\n' for line in notes.split(';') if line.strip())
    entry += '\n'
    lines = text.split('\n', 1)
    head, rest = lines[0], (lines[1] if len(lines) > 1 else '')
    path.write_text(head + '\n\n' + entry + rest.lstrip('\n'), encoding='utf-8')


def run_tests():
    runner = ROOT / 'tests' / 'run.js'
    if not runner.exists():
        return
    try:
        r = subprocess.run(['node', str(runner)], cwd=ROOT)
    except FileNotFoundError:
        print('Note: Node.js is not installed, so the tests were not run (they still run on GitHub).')
        return
    if r.returncode != 0:
        fail('tests failed – fix them first, or add --skip-tests if you really want to publish.')
    # browser tests: only when Playwright is installed (npm install --no-save playwright && npx playwright install chromium)
    browser = ROOT / 'tests' / 'browser' / 'run.js'
    if browser.exists():
        r = subprocess.run(['node', str(browser)], cwd=ROOT)
        if r.returncode == 2:
            print('Note: Playwright is not installed, so the browser tests were not run (they still run on GitHub).')
        elif r.returncode != 0:
            fail('browser tests failed – fix them first, or add --skip-tests if you really want to publish.')


def git(*args):
    print('$ git ' + ' '.join(args))
    r = subprocess.run(['git', *args], cwd=ROOT)
    if r.returncode != 0:
        fail('git ' + args[0] + ' failed – fix the problem above and run the git commands by hand.')


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = {a for a in sys.argv[1:] if a.startswith('--')}
    if not args or not re.fullmatch(r'\d+\.\d+\.\d+', args[0]):
        print(__doc__)
        sys.exit(1)
    version, notes = args[0], (args[1] if len(args) > 1 else '')
    if '--skip-tests' not in flags:
        run_tests()

    index = ROOT / 'index.html'
    old = re.search(r"const APP_VERSION='([^']*)'", index.read_text(encoding='utf-8'))
    old = old.group(1) if old else '?'
    update_file(index, version, set_app_version=True)
    update_file(ROOT / 'warmups.html', version)
    sw = ROOT / 'sw.js'
    if sw.exists():
        sw.write_text(re.sub(r"const CACHE = '[^']*'", "const CACHE = 'choir-cache-" + version + "'", sw.read_text(encoding='utf-8')), encoding='utf-8')
    update_changelog(version, notes)
    print('Version ' + old + ' -> ' + version)

    if '--no-git' in flags:
        print('Files updated. Commit and push them yourself (or upload them on github.com).')
        return
    git('add', '-A')
    git('commit', '-m', 'Release ' + version + (': ' + notes if notes else ''))
    git('tag', '-a', 'v' + version, '-m', 'Version ' + version)
    git('push')
    git('push', 'origin', 'v' + version)
    print('Done. GitHub Pages will publish the new version in about a minute.')


if __name__ == '__main__':
    main()
