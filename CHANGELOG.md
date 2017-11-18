# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.3.1"></a>
## [1.3.1](https://github.com/npm-wharf/dockyard/compare/v1.3.0...v1.3.1) (2017-11-18)


### Bug Fixes

* remove console.log from index ([966d373](https://github.com/npm-wharf/dockyard/commit/966d373))



<a name="1.3.0"></a>
# [1.3.0](https://github.com/npm-wharf/dockyard/compare/v1.2.5...v1.3.0) (2017-11-18)


### Features

* add cache-from and cache-from-latest arguments to support cache feature in docker builds ([5ddfffa](https://github.com/npm-wharf/dockyard/commit/5ddfffa))



<a name="1.2.5"></a>
## [1.2.5](https://github.com/npm-wharf/dockyard/compare/v1.2.4...v1.2.5) (2017-11-14)


### Bug Fixes

* correct defect causing single tag builds to exit before tag and push ([928a272](https://github.com/npm-wharf/dockyard/commit/928a272))
* remove console.log from command during tag parsing ([ae20aec](https://github.com/npm-wharf/dockyard/commit/ae20aec))



<a name="1.2.4"></a>
## [1.2.4](https://github.com/npm-wharf/dockyard/compare/v1.2.3...v1.2.4) (2017-11-12)


### Bug Fixes

* correct an issue that caused multiple tag specifications to parse incorrectly from the CLI ([44e75d9](https://github.com/npm-wharf/dockyard/commit/44e75d9))



<a name="1.2.3"></a>
## [1.2.3](https://github.com/npm-wharf/dockyard/compare/v1.2.2...v1.2.3) (2017-11-12)


### Bug Fixes

* remove tag specifications that result in an empty tag and cause errors, add log output if all tag specs will be filtered out and result in a skipped tag & push step ([b9efa4e](https://github.com/npm-wharf/dockyard/commit/b9efa4e))



<a name="1.2.2"></a>
## [1.2.2](https://github.com/npm/dockyard/compare/v1.2.1...v1.2.2) (2017-07-31)


### Bug Fixes

* add missing tag specification for tagged builds ([f74244b](https://github.com/npm/dockyard/commit/f74244b))



<a name="1.2.1"></a>
## [1.2.1](https://github.com/npm/dockyard/compare/v1.2.0...v1.2.1) (2017-07-30)


### Bug Fixes

* correct missing argument to getDefaultTagSpecs when building default tags for command ([734e42c](https://github.com/npm/dockyard/commit/734e42c))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/npm/dockyard/compare/v1.1.2...v1.2.0) (2017-07-30)


### Features

* add --always-build, --build-branches flags. adopt standard formatting. ([4c7a8fe](https://github.com/npm/dockyard/commit/4c7a8fe))



<a name="1.1.2"></a>
## [1.1.2](https://github.com/npm/dockyard/compare/v1.1.0...v1.1.2) (2017-07-21)


### Bug Fixes

* specificy that various options are of type boolean ([#1](https://github.com/npm/dockyard/issues/1)) ([f596fe6](https://github.com/npm/dockyard/commit/f596fe6))
* upgrade to buildgoggle version to correct version behavior for repos with multiple package files ([1912d70](https://github.com/npm/dockyard/commit/1912d70))



<a name="1.1.1"></a>
## [1.1.1](https://github.com/npm/dockyard/compare/v1.1.0...v1.1.1) (2017-07-08)


### Bug Fixes

* specificy that various options are of type boolean ([#1](https://github.com/npm/dockyard/issues/1)) ([f596fe6](https://github.com/npm/dockyard/commit/f596fe6))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/npm/dockyard/compare/v1.0.0...v1.1.0) (2017-07-07)


### Features

* improve logging and add verbose option to allow inclusion of Docker build output ([36d8e69](https://github.com/npm/dockyard/commit/36d8e69))
