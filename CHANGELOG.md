# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed
- Avoided dependency overrides by downgrading to `child-process-promise@2.1.3`

## [2.0.0] - 2025-08-04
### Security
- Replaced vulnerable `download@8.0.0` package (which used `got@8.3.2` with GHSA-pfrx-2q88-qq97)
- Implemented native HTTP/HTTPS downloader using Node.js built-in modules

### Changed
- Extracted HTTP download functionality into separate `httpDownloader` utility module
- Improved Windows binary extraction with proper file write completion handling

### Fixed
- Fixed race condition in ZIP file extraction that could cause incomplete downloads
- Improved MIME type validation in file command output parsing to prevent error messages from being returned as valid results
- Enhanced backward compatibility by ensuring errors are properly thrown instead of being silently returned as results

## [1.0.1] - 2025-04-28
### Fixed
- Removed redundant dependencies
- Updated dependency check
- Updated to latest `@signageos/codestyle`

## [1.0.0] - 2025-04-25
### Changed
- Updated project dependencies
- Updated build, lint and test scripts
- Added documentation

## [0.1.1] - 2021-10-20
### Fixed
- Fix randomly not downloading file.exe binary on win32 platform

## [0.1.0] - 2020-06-21
### Added
- Package is available in npm registry https://www.npmjs.com/package/@signageos/file
