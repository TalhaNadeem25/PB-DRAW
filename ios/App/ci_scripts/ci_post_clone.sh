#!/bin/sh

# Xcode Cloud runs this automatically after cloning the repo, before the
# archive build starts. The web app (dist/) and the Capacitor-generated
# ios/App/App/public/ folder are both gitignored, so they don't exist in a
# fresh checkout — this script builds them and syncs native dependencies
# (including CocoaPods) so the Xcode build phase that follows has everything
# it needs.
#
# Must live at ios/App/ci_scripts/ci_post_clone.sh (a sibling of App.xcodeproj)
# per Xcode Cloud's convention.

set -e

echo "== ci_post_clone: ensuring Node.js is available =="
# Xcode Cloud's macOS image doesn't ship Node by default, but it does have
# Homebrew preinstalled — use that to get a Node matching package.json's
# "engines" requirement (>=20).
if ! command -v node >/dev/null 2>&1; then
  brew install node@20
  brew link --overwrite --force node@20
fi
node -v
npm -v

echo "== ci_post_clone: installing JS dependencies =="
# CI_WORKSPACE is set by Xcode Cloud to the repo root.
cd "$CI_WORKSPACE"
npm ci

echo "== ci_post_clone: building web app =="
npm run build

echo "== ci_post_clone: syncing Capacitor iOS project (copies dist/, runs pod install) =="
npx cap sync ios

echo "== ci_post_clone: done =="
