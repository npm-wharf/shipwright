# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.5.7"></a>
## [1.5.7](https://github.com/npm-wharf/shipwright/compare/v1.5.6...v1.5.7) (2018-10-19)


### Bug Fixes

* adjust flatten approach to use files instead of pipes when available memory is less than half the container's size ([04058b1](https://github.com/npm-wharf/shipwright/commit/04058b1))



<a name="1.5.6"></a>
## [1.5.6](https://github.com/npm-wharf/shipwright/compare/v1.5.5...v1.5.6) (2018-10-19)


### Bug Fixes

* attempt to improve logging to help with troubleshooting Travis edge case during flattening ([abb6033](https://github.com/npm-wharf/shipwright/commit/abb6033))



<a name="1.5.5"></a>
## [1.5.5](https://github.com/npm-wharf/shipwright/compare/v1.5.4...v1.5.5) (2018-10-19)


### Bug Fixes

* always try to remove container before starting flattening process ([56aa8d0](https://github.com/npm-wharf/shipwright/commit/56aa8d0))



<a name="1.5.4"></a>
## [1.5.4](https://github.com/npm-wharf/shipwright/compare/v1.5.3...v1.5.4) (2018-10-19)


### Bug Fixes

* update pequod version and make minor change to how CMD is added back to imported images to fix issue with import change support ([6fc0550](https://github.com/npm-wharf/shipwright/commit/6fc0550))



<a name="1.5.3"></a>
## [1.5.3](https://github.com/npm-wharf/shipwright/compare/v1.5.2...v1.5.3) (2018-10-19)


### Bug Fixes

* preserve CMD, ENTRYPOINT, ENV, EXPOSE, USER, VOLUME, and WORKDIR from original image when flattening ([2990612](https://github.com/npm-wharf/shipwright/commit/2990612))



<a name="1.5.2"></a>
## [1.5.2](https://github.com/npm-wharf/shipwright/compare/v1.5.1...v1.5.2) (2018-10-18)


### Bug Fixes

* improvement to container creation call to prevent empty images when exporting ([6eb177d](https://github.com/npm-wharf/shipwright/commit/6eb177d))



<a name="1.5.1"></a>
## [1.5.1](https://github.com/npm-wharf/shipwright/compare/v1.5.0...v1.5.1) (2018-10-18)


### Bug Fixes

* correct bug introduced to cache-from-latest by new flatten behavior ([dd29313](https://github.com/npm-wharf/shipwright/commit/dd29313))



<a name="1.5.0"></a>
# [1.5.0](https://github.com/npm-wharf/shipwright/compare/v1.4.2...v1.5.0) (2018-10-17)


### Features

* add flatten flag that enables shipwright to produce a flattened image to remove command and layers from Docker image when built ([cddda4f](https://github.com/npm-wharf/shipwright/commit/cddda4f))



<a name="1.4.2"></a>
## [1.4.2](https://github.com/npm-wharf/shipwright/compare/v1.4.1...v1.4.2) (2018-06-27)


### Bug Fixes

* add latest buildGoggle release to correct for Travis bug ([82eebc2](https://github.com/npm-wharf/shipwright/commit/82eebc2))



<a name="1.4.1"></a>
## [1.4.1](https://github.com/npm-wharf/shipwright/compare/v1.4.0...v1.4.1) (2018-01-29)


### Bug Fixes

* remove console.log for build args ([2e675bb](https://github.com/npm-wharf/shipwright/commit/2e675bb))



<a name="1.4.0"></a>
# [1.4.0](https://github.com/npm-wharf/shipwright/compare/v1.3.5...v1.4.0) (2018-01-29)


### Features

* add support for parameterized Dockerfiles via ARG and build-arg. ([a8ce426](https://github.com/npm-wharf/shipwright/commit/a8ce426))



<a name="1.3.5"></a>
## [1.3.5](https://github.com/npm-wharf/shipwright/compare/v1.3.4...v1.3.5) (2017-11-26)


### Bug Fixes

* ensure buildinfo gets updated during write step ([870ac74](https://github.com/npm-wharf/shipwright/commit/870ac74))



<a name="1.3.4"></a>
## [1.3.4](https://github.com/npm-wharf/shipwright/compare/v1.3.3...v1.3.4) (2017-11-26)


### Bug Fixes

* correct argument arity in onBuildError handler ([388fece](https://github.com/npm-wharf/shipwright/commit/388fece))



<a name="1.3.3"></a>
## [1.3.3](https://github.com/npm-wharf/shipwright/compare/v1.3.2...v1.3.3) (2017-11-18)


### Bug Fixes

* add pull action before attempting to use cache-from ([ebe269b](https://github.com/npm-wharf/shipwright/commit/ebe269b))



<a name="1.3.2"></a>
## [1.3.2](https://github.com/npm-wharf/shipwright/compare/v1.3.1...v1.3.2) (2017-11-18)


### Bug Fixes

* add indicate-progress flag to prevent travis from exiting during long builds ([e563587](https://github.com/npm-wharf/shipwright/commit/e563587))



<a name="1.3.1"></a>
## [1.3.1](https://github.com/npm-wharf/shipwright/compare/v1.3.0...v1.3.1) (2017-11-18)


### Bug Fixes

* remove console.log from index ([966d373](https://github.com/npm-wharf/shipwright/commit/966d373))



<a name="1.3.0"></a>
# [1.3.0](https://github.com/npm-wharf/shipwright/compare/v1.2.5...v1.3.0) (2017-11-18)


### Features

* add cache-from and cache-from-latest arguments to support cache feature in docker builds ([5ddfffa](https://github.com/npm-wharf/shipwright/commit/5ddfffa))



<a name="1.2.5"></a>
## [1.2.5](https://github.com/npm-wharf/shipwright/compare/v1.2.4...v1.2.5) (2017-11-14)


### Bug Fixes

* correct defect causing single tag builds to exit before tag and push ([928a272](https://github.com/npm-wharf/shipwright/commit/928a272))
* remove console.log from command during tag parsing ([ae20aec](https://github.com/npm-wharf/shipwright/commit/ae20aec))



<a name="1.2.4"></a>
## [1.2.4](https://github.com/npm-wharf/shipwright/compare/v1.2.3...v1.2.4) (2017-11-12)


### Bug Fixes

* correct an issue that caused multiple tag specifications to parse incorrectly from the CLI ([44e75d9](https://github.com/npm-wharf/shipwright/commit/44e75d9))



<a name="1.2.3"></a>
## [1.2.3](https://github.com/npm-wharf/shipwright/compare/v1.2.2...v1.2.3) (2017-11-12)


### Bug Fixes

* remove tag specifications that result in an empty tag and cause errors, add log output if all tag specs will be filtered out and result in a skipped tag & push step ([b9efa4e](https://github.com/npm-wharf/shipwright/commit/b9efa4e))



<a name="1.2.2"></a>
## [1.2.2](https://github.com/npm-wharf/shipwright/compare/v1.2.1...v1.2.2) (2017-07-31)


### Bug Fixes

* add missing tag specification for tagged builds ([f74244b](https://github.com/npm-wharf/shipwright/commit/f74244b))



<a name="1.2.1"></a>
## [1.2.1](https://github.com/npm-wharf/shipwright/compare/v1.2.0...v1.2.1) (2017-07-30)


### Bug Fixes

* correct missing argument to getDefaultTagSpecs when building default tags for command ([734e42c](https://github.com/npm-wharf/shipwright/commit/734e42c))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/npm-wharf/shipwright/compare/v1.1.2...v1.2.0) (2017-07-30)


### Features

* add --always-build, --build-branches flags. adopt standard formatting. ([4c7a8fe](https://github.com/npm-wharf/shipwright/commit/4c7a8fe))



<a name="1.1.2"></a>
## [1.1.2](https://github.com/npm-wharf/shipwright/compare/v1.1.0...v1.1.2) (2017-07-21)


### Bug Fixes

* specificy that various options are of type boolean ([#1](https://github.com/npm-wharf/shipwright/issues/1)) ([f596fe6](https://github.com/npm/shipwright/commit/f596fe6))
* upgrade to buildgoggle version to correct version behavior for repos with multiple package files ([1912d70](https://github.com/npm/shipwright/commit/1912d70))



<a name="1.1.1"></a>
## [1.1.1](https://github.com/npm-wharf/shipwright/compare/v1.1.0...v1.1.1) (2017-07-08)


### Bug Fixes

* specificy that various options are of type boolean ([#1](https://github.com/npm-wharf/shipwright/issues/1)) ([f596fe6](https://github.com/npm-wharf/shipwright/commit/f596fe6))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/npm-wharf/shipwright/compare/v1.0.0...v1.1.0) (2017-07-07)


### Features

* improve logging and add verbose option to allow inclusion of Docker build output ([36d8e69](https://github.com/npm-wharf/shipwright/commit/36d8e69))
