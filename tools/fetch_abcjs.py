#!/usr/bin/env python3
"""Download abcjs into vendor/ so the app does not depend on a CDN.

Usage:  python tools/fetch_abcjs.py [version]     (default 6.2.2)

abcjs (https://github.com/paulrosen/abcjs) is MIT-licensed, (c) Paul Rosen and Gregory Dyke.
The app loads it from cdnjs or jsDelivr first and uses vendor/abcjs-basic-min.js as the last fallback.
"""
import pathlib
import sys
import urllib.request

ver = sys.argv[1] if len(sys.argv) > 1 else '6.2.2'
root = pathlib.Path(__file__).resolve().parent.parent
out = root / 'vendor'
out.mkdir(exist_ok=True)
files = {
    'abcjs-basic-min.js': [
        'https://cdn.jsdelivr.net/npm/abcjs@%s/dist/abcjs-basic-min.js' % ver,
        'https://cdnjs.cloudflare.com/ajax/libs/abcjs/%s/abcjs-basic-min.js' % ver,
    ],
    'abcjs-LICENSE.md': ['https://cdn.jsdelivr.net/npm/abcjs@%s/LICENSE.md' % ver],
}
for name, urls in files.items():
    for url in urls:
        try:
            data = urllib.request.urlopen(url, timeout=30).read()
            (out / name).write_bytes(data)
            print('saved vendor/%s (%d bytes) from %s' % (name, len(data), url))
            break
        except Exception as e:
            print('  failed %s: %s' % (url, e))
    else:
        print('Could not download ' + name)
