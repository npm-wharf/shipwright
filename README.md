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

### dockyard build image
Builds a docker image with all default options. Read carefully, there are kindovalot.

  * --repo - the image repository to build for, **no default**
  * --name - defaults to the package's `name`
  * --name-prefix - optionally prefix default package name
  * --name-postfix - optionally postfix default package name
  * --working-path - the working directory for the build, defaults to `./`
  * --docker-file - the DockerFile to use, defaults to `./Dockerfile`
  * --tags - defaults are: (see [buildgoggles](https://github.com/arobson/buildgoggles) for tag specifications)
    * `lt,v_s,v,miv,ma` `[ 'latest', '1.2.3_abcdefgh', '1.2.3', '1.2', '1' ]` - for tagged builds
    * `v_c_s` `[ '1.2.3_10_abcdefgh' ]` - for master commits
    * `b_v_c_s` `[ 'branch_1.2.3_10_abcdefgh' ]` - in any other branch when:
      * `--always-build` is an argument
      * `--build-branches` contains the current branch
      * the commit message contains `[build-image]`
  * --registry - defaults to hub.docker.com
  * --lts-only - defaults to `true`: when true, skips everything for non-LTS Node versions 
  * --skip-prs - defaults to `true`: should anything other than a Docker build is done for PRs
  * --no-push - prevents dockyard from pushing the image to the registry
  * --update-with - specify an instruction file for how to send a PR to another GitHub repository's file
  * --sudo - defaults to `true`: use sudo with Docker commands
  * --verbose - defaults to `false`: include Docker build output in console logs
  * --always-build - always produce a build regardless of the branch by providing the default tag specification `[ 'b_v_c_s' ]` if no other tags have been specified
  * --build-branches - defaults to `[ 'staging', 'qa', 'dev' ]`: a list of branches to build for (other than master) with the default tag specification `[ 'b_v_c_s' ]` if no other tags have been specified. 

### Use cases for `--always-build` and `--build-branches`

These flags are intended to supply ways to get dockyard to generate build images for development branches without disrupting the useful default tag specs provided for master and tagged builds and without having to constantly rely on filling your commit log with `[build-image]`.

The `build-branches` defaults effectively guarantee you'll get build images if you push to branches named `staging`, `qa`, or `dev`.

### Default Build Behavior

With all the tags, it is a bit unclear what the dockyard's default behavior actually would be if you were to, for example, just add the following lines to travis:

```shell
after_success:
  - docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"
  - dockyard build image --repo=myRepo --name=imageName 
```

#### For Builds On Master (With Git Tags On The Commit)

A docker image will get built, tagged and pushed with the following tags:

 * `latest`
 * `1`
 * `1.2`
 * `1.2.3`
 * `1.2.3_abcdefgh`

#### For Builds On Master (Without Git Tags On The Commit)

A docker image will get built, tagged and pushed with a tag that contains the version, build number and commit sha:

 * `1.2.3_10_abcdefgh`

#### For Builds On A `--build-branches` (`staging`, `qa`, `dev`)

A docker image will get built, tagged and pushed with a tag that contains the branch name, version, build number, and commit sha:

 * `branch-name_1.2.3_10_abcdefgh`

#### For Builds With `[build-image]` In The Commit Message

Even without adding flags, you can still get a build on any branch with the tag specification that contains the branch, version:

 * `branch-name_1.2.3_10_abcdefgh`

#### For PRs and Builds On Non-LTS Versions of Node

Dockyard won't do _anything_ at all. This is to avoid drawing out the build times on your CI server. You can change these behaviors with the `skip-prs` and `lts-only` flags, of course, but this is about default build behavior.

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
