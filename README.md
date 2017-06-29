# dockyard
A simple/consistent way to create build artifacts with calculated tags and then update related repositories (think packages, tarballs, docker builds, etc.).

[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]

__Why Not Bash?__

 * copy pasta'd shell script is tough to maintain, "did I copy that change to all 20+ repos?"
 * automated testing is nicer than pushing to CI to see what will happen
 * with an increasing set of integration/features I prefer JS as a way to develop and share these features/ideas

## CLI
Right now this mashes a lot of other tools into a promise chain behind a single command.

#### dockyard build image
Builds a docker image with all default options. Read carefully, there are kindovalot.

  * --repo - the image repository to build for, **no default**
  * --name - defaults to the package's `name`
  * --name-prefix - optionally prefix default package name
  * --name-postfix - optionally postfix default package name
  * --working-path - the working directory for the build, defaults to `./`
  * --docker-file - the DockerFile to use, defaults to `./Dockerfile`
  * --tags - defaults are: (see [buildgoggles](https://github.com/arobson/buildgoggles) for tag specifications)
    * `v_s,v,miv,ma` for tagged builds: [ `1.2.3_abcdefgh`, `1.2`, `1` ]
    * `v_c_s` for master commits: [ `1.2.3_10_abcdefgh` ]
    * `b_v_c_s` in any other branch if the commit contained `[build-image]`: [ `branch_1.2.3_10_abcdefgh` ]
  * --registry - defaults to hub.docker.com
  * --lts-only - defaults to `true`: when true, skips everything for non-LTS Node versions 
  * --skip-prs - defaults to `true`: should anything other than a Docker build is done for PRs
  * --no-push - prevents dockyard from pushing the image to the registry
  * --update-with - specify an instruction file for how to send a PR to another GitHub repository's file
  * --sudo - defaults to `true`: use sudo with Docker commands

## `updateWith` - Instruction Files & PR Plugins
The `updateWith` argument is way to plug in your own transformers after the fact to get dockyard to send a PR to another GitHub repository in order to update a single file.

This uses [github-change-remote-file](https://github.com/boennemann/github-change-remote-file) so the limitation here is that it can change 1 file at a time. The transformer plugin you write will get passed a `buildInfo` hash with all the context of the build and the instruction file with any static arguments you'd like to pass it.

### plugin format
The plugin module should export a function that takes the build information and instruction file content and returns a function that transforms the target file's contents (passed as a string) and returns the changed content.
```js
module.exports = function( buildInfo, instructions ) {
    return function( raw ) {
      // do something to the file
      return changedContent;
    };
}
```

### instruction file
You can provide an instruction file in either JSON or YAML.

The source properties control the repository and branch the pull request will be made *from* and what file will be changed. The source `owner`, `repo`, and `file` values are required to specify the target GitHub repository and path to the file relative to the repository's root. If the source `branch` is left out, it will default to `master`. The `module` argument is required and should be the name of an installed npm module or the relative path to a JS module in the current repository that satisfies the plugin behavior. The `branch` name is also optional and if left off, will be calculated based off the current build parameters.

Any other values included in the file itself will be deserialized and passed to your plugin.

```json
{
  "source": {
    "owner": "me",
    "repo": "test",
    "file": "somefile.txt",
    "branch": "master"
  },
  "module": "myPlugin",
  "branch": "pr"
}
```

```yaml
source:
  owner: me
  repo: test
  file: somefile.txt
  branch: master
module: myPlugin
branch: pr
```

### `buildInfo` hash
The build information hash will contain the following properties:

```json
{
  "owner": "npm",
  "repository": "dockyard",
  "branch": "master",
  "version": "0.1.0",
  "build": 10,
  "slug": "a1b2c3d4",
  "tag": "arobson_build-goggles_master_0.1.0_1_a1b2c3d4",
  "isLTS": true,
  "commitMessage": "the commit message used",
  "ci": {
    "inCI": "true",
    "tagged": false,
    "pullRequest": false
  },
  "imageName": "repo/image"
}
```

> Note: the `imageName` property will only exist if an artifact (like a Docker image) was produced as part of the build

## Roadmap

 * separate command so that build and push are represented as different steps
 * add support for additional artifact types
 * support multiple artifact types per build

[travis-url]: https://travis-ci.com/npm/dockyard
[travis-image]: https://travis-ci.com/npm/dockyard.svg?token=nx7pjhpjyWEn4WyoMujZ&branch=master
[coveralls-url]: https://coveralls.io/github/npm/dockyard
[coveralls-image]: https://coveralls.io/repos/github/npm/dockyard/badge.svg?t=CQD4yS
