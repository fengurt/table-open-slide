"""
Browse the repo `slides/` folder (zip archives + loose HTML), convert slide HTML with Docling → Markdown.

Run:
  ./tools/slides-showcase/run.sh

Or:
  cd tools/slides-showcase && python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt
  SLIDES_DIR=/path/to/slides .venv/bin/streamlit run app.py
"""

from __future__ import annotations

import os
import tempfile
import zipfile
from pathlib import Path

import streamlit as st
from docling.document_converter import DocumentConverter


def default_slides_dir() -> Path:
    env = os.environ.get("SLIDES_DIR", "").strip()
    if env:
        return Path(env).expanduser().resolve()
    return Path(__file__).resolve().parents[2] / "slides"


@st.cache_resource
def get_converter() -> DocumentConverter:
    return DocumentConverter()


def list_slide_archives(slides_dir: Path) -> list[Path]:
    if not slides_dir.is_dir():
        return []
    return sorted(slides_dir.glob("*.zip"))


def list_loose_html(slides_dir: Path) -> list[Path]:
    if not slides_dir.is_dir():
        return []
    return sorted(slides_dir.glob("*.html"))


@st.cache_data(show_spinner=False)
def zip_members(zip_path_str: str) -> tuple[str, ...]:
    path = Path(zip_path_str)
    with zipfile.ZipFile(path, "r") as zf:
        names = [n for n in zf.namelist() if not n.endswith("/")]
        html_names = sorted(n for n in names if n.lower().endswith(".html"))
        return tuple(html_names)


def extract_member_to_temp(zip_path: Path, member: str, tmp_root: Path) -> Path:
    safe_member = member.replace("\\", "/").lstrip("/")
    if ".." in Path(safe_member).parts:
        raise ValueError("Invalid zip member path")
    dest_dir = tmp_root / zip_path.stem
    dest_dir.mkdir(parents=True, exist_ok=True)
    out_file = dest_dir / Path(safe_member).name
    with zipfile.ZipFile(zip_path, "r") as zf:
        with zf.open(safe_member) as src, open(out_file, "wb") as dst:
            dst.write(src.read())
    return out_file


def html_to_markdown(converter: DocumentConverter, html_path: Path) -> str:
    result = converter.convert(str(html_path))
    return result.document.export_to_markdown()


def main() -> None:
    st.set_page_config(page_title="Slides showcase (Docling)", layout="wide")
    base_slides_dir = default_slides_dir()

    st.title("Slides showcase")
    st.caption("Slide HTML from your `slides` folder, converted to Markdown with Docling.")

    with st.sidebar:
        st.header("Library")
        override = st.text_input(
            "Slides directory",
            value=os.environ.get("SLIDES_DIR", str(base_slides_dir)),
            help="Absolute path to the folder that contains `.zip` slide bundles and/or `.html` files.",
        )
        active_dir = Path(override.strip()).expanduser().resolve()
        if not active_dir.is_dir():
            st.error("That path is not a directory.")
            st.stop()

        archives = list_slide_archives(active_dir)
        loose = list_loose_html(active_dir)

        if not archives and not loose:
            st.warning("No `.zip` or `.html` found here.")
            st.stop()

        mode = st.radio("Source type", ["Zip archive", "Loose HTML"], horizontal=False)

        selected_zip: Path | None = None
        selected_member: str | None = None
        selected_loose: Path | None = None

        if mode == "Zip archive":
            if not archives:
                st.info("No zip archives in this folder.")
                st.stop()
            labels = [p.name for p in archives]
            choice = st.selectbox("Archive", options=labels, index=0)
            selected_zip = archives[labels.index(choice)]
            try:
                member_names = list(zip_members(str(selected_zip)))
            except (zipfile.BadZipFile, OSError) as exc:
                st.error(f"Cannot read zip: {exc}")
                st.stop()
            if not member_names:
                st.warning("No HTML files inside this archive.")
                st.stop()
            selected_member = st.selectbox("Slide", options=member_names, index=0)
        else:
            if not loose:
                st.info("No loose HTML in this folder.")
                st.stop()
            loose_labels = [p.name for p in loose]
            lc = st.selectbox("HTML file", options=loose_labels, index=0)
            selected_loose = loose[loose_labels.index(lc)]

    converter = get_converter()

    try:
        if mode == "Zip archive" and selected_zip is not None and selected_member is not None:
            with tempfile.TemporaryDirectory(prefix="slides-showcase-") as tmp:
                html_path = extract_member_to_temp(selected_zip, selected_member, Path(tmp))
                with st.spinner("Converting with Docling…"):
                    md = html_to_markdown(converter, html_path)
            st.subheader(selected_member)
        elif selected_loose is not None:
            with st.spinner("Converting with Docling…"):
                md = html_to_markdown(converter, selected_loose)
            st.subheader(selected_loose.name)
        else:
            st.stop()
    except Exception as exc:
        st.error(f"Conversion failed: {exc}")
        st.stop()

    tab_preview, tab_source = st.tabs(["Rendered", "Markdown source"])
    with tab_preview:
        st.markdown(md)
    with tab_source:
        st.code(md, language="markdown")


if __name__ == "__main__":
    main()
