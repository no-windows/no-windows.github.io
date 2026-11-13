import os
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class IsolatedHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()

    def do_GET(self):
        range_header = self.headers.get("Range")
        if not range_header:
            return super().do_GET()

        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().do_GET()

        size = os.path.getsize(path)
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", range_header.strip())
        if not match or size == 0 or (not match.group(1) and not match.group(2)):
            return self._range_not_satisfiable(size)

        if match.group(1):
            start = int(match.group(1))
            end = int(match.group(2)) if match.group(2) else size - 1
        else:
            suffix_length = int(match.group(2))
            start = max(size - suffix_length, 0)
            end = size - 1

        if start >= size or end < start:
            return self._range_not_satisfiable(size)
        end = min(end, size - 1)

        try:
            file = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return

        with file:
            file.seek(start)
            self.send_response(206)
            self.send_header("Content-Type", self.guess_type(path))
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(end - start + 1))
            self.send_header("Last-Modified", self.date_time_string(os.path.getmtime(path)))
            self.end_headers()

            remaining = end - start + 1
            while remaining:
                data = file.read(min(64 * 1024, remaining))
                if not data:
                    break
                self.wfile.write(data)
                remaining -= len(data)

    def _range_not_satisfiable(self, size):
        self.send_response(416)
        self.send_header("Content-Range", f"bytes */{size}")
        self.send_header("Content-Length", "0")
        self.end_headers()


if __name__ == "__main__":
    address = ("127.0.0.1", 8765)
    print("Serving at http://127.0.0.1:8765")
    ThreadingHTTPServer(address, IsolatedHandler).serve_forever()
