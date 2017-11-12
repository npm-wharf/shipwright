const fs = require('fs')
const path = require('path')
const when = require('when')
const DEFAULT_REGISTRY = 'https://hub.docker.com'

function buildImage (log, settings, goggles, dockerFactory, options) {
  const repo = options.repo
  const name = options.name
  const workingPath = options.workingPath || settings.getDefaultDockerfile()
  const dockerFile = options.dockerFile || settings.getDefaultDockerfile()
  const namePrefix = options.namePrefix
  const namePostfix = options.namePostfix
  const alwaysBuild = options.alwaysBuild
  const buildBranches = alwaysBuild ? [options.defaultInfo.branch] : (options.buildBranches || '').split(',')
  const tagSpecs = options.tags && options.tags.length
    ? options.tags : settings.getDefaultTagSpecs(buildBranches, options.defaultInfo)
  const registry = options.registry
  const output = options.output || '.image.json'
  const skipPRs = options.skipPRs
  const ltsOnly = options.ltsOnly
  const noPush = options.noPush || false
  const defaultInfo = options.defaultInfo
  const docker = dockerFactory(options.sudo || false, dockerLog)

  const baseImage = [ namePrefix, name, namePostfix ].join('')
  const imageParts = [ repo, baseImage ]
  if (registry !== DEFAULT_REGISTRY && registry) {
    imageParts.unshift(registry)
  }
  const imageName = imageParts.join('/')
  const imageFile = path.join(workingPath, output)

  if (ltsOnly && !defaultInfo.isLTS) {
    log('Skipping build - Node version (%s) is not LTS', process.version)
    return when({})
  }

  var info
  log("Building Docker image '%s'.", imageName)
  return docker.build(imageName, workingPath, path.relative(workingPath, dockerFile))
    .then(
      () => {
        log("Docker image '%s' built successfully.", imageName)
      },
      onBuildFailed.bind(null, log, imageName)
    )
    .catch(exitOnError)
    .then(
      writeBuildInfo.bind(null, log, goggles, workingPath, imageName, tagSpecs, defaultInfo)
    )
    .catch(exitOnError)
    .then(
      buildInfo => {
        info = buildInfo
        return info
      }
    )
    .then(
      tagImage.bind(null, log, docker, skipPRs, imageName),
      onWriteInfoFailed.bind(null, log)
    )
    .catch(exitOnError)
    .then(
      pushImage.bind(null, log, docker, noPush, imageName),
      onTagFailed.bind(null, log, info)
    )
    .catch(exitOnError)
    .then(
      writeImageFile.bind(null, log, imageFile, imageName),
      onPushFailed.bind(null, log, imageName)
    )
    .catch(exitOnError)
}

function dockerLog (lines) {
  lines.split('\n')
    .forEach(
      line => {
        if (line) {
          console.log('\u1F433  ' + line)
        }
      }
    )
}

function exitOnError () {
  process.exit(100)
}

function getBuildInfo (goggles, unlink, workingPath, tags) {
  return goggles.getInfo({ repo: workingPath, tags: tags })
    .then(
      info => {
        if (unlink) {
          fs.unlinkSync(path.resolve(workingPath, '.buildinfo.json'))
        }
        return info
      }
    )
}

function onBuildFailed (log, imageName, buildError) {
  log("Docker build for image '%s' failed: %s", imageName, buildError.message)
  throw buildError
}

function onPushFailed (log, imageName, pushError) {
  log("Pushing the image '%s' failed for some or all tags:\n %s", imageName, pushError.message)
  throw pushError
}

function onTagFailed (log, imageName, info, tagError) {
  log("Tagging image '%s' with tags, '%s', failed with error:\n %s", imageName, info.tag, tagError)
  throw tagError
}

function onWriteInfoFailed (log, writeError) {
  log('Failed to acquire and write build information due to error: %s', writeError)
  throw writeError
}

function pushImage (log, docker, noPush, imageName, info) {
  if ((info && info.continue === false) || noPush) {
    log('Skipping push image.')
    return when(info)
  } else {
    log('Pushing image.')
    return docker.pushTags(imageName)
      .then(
        () => {
          log("Docker image '%s' was pushed successfully with tags: %s", imageName, info.tag)
          return info
        }
      )
  }
}

function tagImage (log, docker, skipPRs, imageName, info) {
  if ((skipPRs && info.ci && info.ci.pullRequest) || (info && info.continue === false)) {
    log('Skipping tag & push.')
    return when({ continue: false })
  } else {
    log('Tagging image.')
    return docker.tagImage(imageName)
      .then(
        () => info
      )
  }
}

function writeBuildInfo (log, goggles, workingPath, imageName, tags, info) {
  if (tags.length > 0) {
    return getBuildInfo(goggles, false, workingPath, tags)
      .then(
        newInfo => {
          if (newInfo.tag && newInfo.tag.length) {
            newInfo.tag = newInfo.tag.reduce((acc, t) => {
              if (t && t.length > 0) {
                acc.push(t)
              }
              return acc
            }, [])
          }
          if (!newInfo.tag || newInfo.tag.length === 0) {
            log('Tag specification resulted in an empty tag set, skipping tag and push.')
            log(`branch - '${info ? info.branch : 'N/A'}', PR - '${info ? info.ci.pullRequest : 'N/A'}', tag spec - '${tags}'`)
            newInfo.continue = false
          } else {
            newInfo.continue = true
          }
          return newInfo
        }
      )
  } else {
    log('No tags were specified, skipping tag and push.')
    log('branch - %s, PR - %s, tagged - %s',
      info.branch,
      info.ci.pullRequest,
      info.ci.tagged
    )
    return when({ continue: false })
  }
}

function writeImageFile (log, imageFile, imageName, info) {
  if (info && info.continue === false) {
    log('Skipping write of image file information.')
    return when(info)
  } else {
    log("Writing image file to '%s'.", imageFile)
    info.imageName = imageName
    return when.promise((resolve, reject) => {
      const json = JSON.stringify({
        image: imageName,
        tags: info.tag
      })
      fs.writeFile(imageFile, json, 'utf8', err => {
        if (err) {
          log("Failed to write image file to '%s' with error: %s", imageFile, err)
          reject(err)
        } else {
          log("Image file written to '%s' successfully.", imageFile)
          resolve(info)
        }
      })
    })
  }
}

module.exports = function (log, goggles, docker, settings) {
  return {
    buildImage: buildImage.bind(null, log, settings, goggles, docker),
    getBuildInfo: getBuildInfo.bind(null, goggles),
    onBuildFailed: onBuildFailed.bind(null, log),
    onPushFailed: onPushFailed.bind(null, log),
    onTagFailed: onTagFailed.bind(null, log),
    onWriteInfoFailed: onWriteInfoFailed.bind(null, log),
    pushImage: pushImage.bind(null, log, docker(false, dockerLog)),
    tagImage: tagImage.bind(null, log, docker(false, dockerLog)),
    writeBuildInfo: writeBuildInfo.bind(null, log, goggles),
    writeImageFile: writeImageFile.bind(null, log)
  }
}
