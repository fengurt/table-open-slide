# Vendored brand fonts (server-side preview only)

Drop brand `.ttf` / `.otf` files here (e.g. `Manrope-Regular.ttf`) and they are
installed into the Docker image at `/usr/share/fonts/truetype/brand/` and picked
up by `fc-cache`. LibreOffice then uses them when rendering the PDF/PNG preview.

Notes:

- The generated `.docx` only references font **names**; a recipient's Word
  resolves fonts locally. These vendored files only fix the **server-side**
  preview (PDF/PNG) rendering.
- CJK coverage is already provided by `fonts-noto-cjk` installed via apt in the
  `Dockerfile`; you only need to vendor Latin display fonts that have no Debian
  package (such as Manrope).
- This directory is intentionally kept (via this README) so the `COPY` step in
  the `Dockerfile` always has a valid source even when no fonts are vendored.
