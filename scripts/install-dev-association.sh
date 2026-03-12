#!/usr/bin/env bash
# Registers Magnesium as a file-type handler for development builds.
# Run once after `npm run build`, and again if you move the project folder.
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ELECTRON_BIN="$APP_DIR/node_modules/.bin/electron"
DESKTOP_FILE="$HOME/.local/share/applications/magnesium-dev.desktop"

if [ ! -f "$APP_DIR/out/main/index.js" ]; then
  echo "Error: out/main/index.js not found. Run 'npm run build' first."
  exit 1
fi

mkdir -p "$HOME/.local/share/applications"

sed \
  -e "s|ELECTRON_BIN|$ELECTRON_BIN|g" \
  -e "s|APP_DIR|$APP_DIR|g" \
  "$APP_DIR/magnesium-dev.desktop" > "$DESKTOP_FILE"

chmod +x "$DESKTOP_FILE"

# Register with the desktop database
update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true

# Register MIME associations
xdg-mime default magnesium-dev.desktop text/markdown
xdg-mime default magnesium-dev.desktop text/plain
xdg-mime default magnesium-dev.desktop text/x-csrc
xdg-mime default magnesium-dev.desktop text/x-chdr
xdg-mime default magnesium-dev.desktop text/x-c++src
xdg-mime default magnesium-dev.desktop text/x-c++hdr
xdg-mime default magnesium-dev.desktop text/x-java
xdg-mime default magnesium-dev.desktop text/x-python
xdg-mime default magnesium-dev.desktop text/html
xdg-mime default magnesium-dev.desktop text/css
xdg-mime default magnesium-dev.desktop application/javascript
xdg-mime default magnesium-dev.desktop application/typescript

echo "Done. Magnesium is now registered as a file handler."
echo "Installed: $DESKTOP_FILE"
echo ""
echo "To make it the default for .md files:"
echo "  xdg-mime default magnesium-dev.desktop text/markdown"
