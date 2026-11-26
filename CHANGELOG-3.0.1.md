# NEXORA 3.0.1

## Build fix
- Fixed `MediaMetadataRetriever` metadata key types in `nx/B.java`. Android metadata key constants are integers, so the key array is now `int[]` and values are passed directly to `extractMetadata(int)`.
- Kept scraper engine, downloader, UI, and feature behavior unchanged.
- Incremented Android version to 3.0.1 (versionCode 9).

## Validation
- Source-level patch checked. A full Android Gradle build still needs to run in GitHub Actions with Android SDK installed.
