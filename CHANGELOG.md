# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure and documentation
- Comprehensive MCP server implementation
- Example tools: calculator, filesystem, text-processing, weather
- Example resources: configuration, documentation, logs
- Docker support with multi-stage builds
- CI/CD pipeline templates
- Health check endpoints and monitoring
- Comprehensive test suite with Jest
- Code quality tools (ESLint, Prettier, TypeScript)

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- Input validation and sanitization for all tools
- File path validation to prevent directory traversal
- Expression sanitization in calculator tool
- Request logging for security auditing

## [1.0.0] - 2025-01-03

### Added
- Initial release of the MCP starter template
- Complete MCP server implementation with example tools and resources
- TypeScript support with comprehensive type definitions
- Production-ready error handling and logging
- Docker containerization support
- Comprehensive documentation and examples
- Test suite with good coverage
- Development and production build configurations

---

## Template for Future Releases

When making changes, add them under the "Unreleased" section using this format:

```markdown
## [Unreleased]

### Added
- New features or functionality

### Changed
- Changes to existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Features removed in this release

### Fixed
- Bug fixes

### Security
- Security improvements or fixes
```

## Release Process

1. Update the version number in `package.json`
2. Move unreleased changes to a new version section
3. Add the release date
4. Create a git tag with the version number
5. Push changes and tag to trigger deployment