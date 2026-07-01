#!/usr/bin/env python3
"""Simple HTTP server with POST support to save slide HTML files."""
import http.server
import json
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
DIR = os.path.dirname(os.path.abspath(__file__))


class SlideServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        path = self.path.lstrip("/")
        if not path.endswith(".html"):
            self.send_error(400, "Only .html files accepted")
            return

        filepath = os.path.join(DIR, path)
        if not os.path.abspath(filepath).startswith(DIR):
            self.send_error(403, "Path traversal denied")
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8")

        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(body)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"ok": True, "file": path}).encode())

    def log_message(self, format, *args):
        print(f"[{self.client_address[0]}] {format % args}")


if __name__ == "__main__":
    print(f"Serving slides on http://localhost:{PORT}/index.html")
    print(f"POST saves to: {DIR}")
    http.server.HTTPServer(("0.0.0.0", PORT), SlideServer).serve_forever()
