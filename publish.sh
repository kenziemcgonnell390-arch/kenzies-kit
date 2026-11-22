#!/bin/sh
# Publishes Kenzie's Kit to GitHub Pages.
# Source of truth: ../scrollcraft/builds/stillwater (edit picks.js there).
# This folder is the public repo kenziemcgonnell390-arch/kenzies-kit; only the
# files the page needs are copied in, so notes and other builds stay private.
set -e
cd "$(dirname "$0")"
SRC=../scrollcraft/builds/stillwater
for f in index.html page.js picks.js ground.js scrollcraft.js scrollcraft.css site.css; do
  cp "$SRC/$f" "site/$f"
done
touch site/.nojekyll
git add -A site
if git diff --cached --quiet; then echo "Nothing changed."; exit 0; fi
git commit -q -m "Update Kenzie's Kit from stillwater build"
git push -q
echo "Pushed. Live in a minute at https://kenziemcgonnell390-arch.github.io/kenzies-kit/"
