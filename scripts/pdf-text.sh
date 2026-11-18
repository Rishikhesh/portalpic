#!/bin/sh
# Prints the text of an official PDF notice, for the preset agent (it can't read PDFs through web fetch).
# Usage: sh scripts/pdf-text.sh https://example.gov/notice.pdf
set -eu
case "${1:-}" in https://*) ;; *) echo "usage: sh scripts/pdf-text.sh https://…/notice.pdf" >&2; exit 2 ;; esac
f=$(mktemp); trap 'rm -f "$f"' EXIT
curl -fsSL --proto '=https' --max-time 60 --max-filesize 30000000 -o "$f" "$1"
pdftotext -layout "$f" - | head -c 400000
