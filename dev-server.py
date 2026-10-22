"""Serve Flex Studio for local development without browser caching.

python3 -m http.server sends no Cache-Control header, so browsers reuse old
ES modules after an edit and the page breaks in confusing ways.
"""

import functools
import http.server
import pathlib
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4380
    root = pathlib.Path(__file__).resolve().parent / "public"
    handler = functools.partial(NoCacheHandler, directory=str(root))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"Flex Studio on http://localhost:{port}")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
