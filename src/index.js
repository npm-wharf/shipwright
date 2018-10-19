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
  const buildArgs = options.buildArgs
  const indicateProgress = options.indicateProgress
  const docker = dockerFactory({
    sudo: options.sudo || false,
    log: options.verbose ? dockerLog : null
  })
  const flatten = options.flatten
  let cacheFrom
  let preBuild = () => when({})

  const baseImage = [ namePrefix, name, namePostfix ].join('')
  const imageParts = [ repo, baseImage ]
  if (registry !== DEFAULT_REGISTRY && registry) {
    imageParts.unshift(registry)
  }
  let imageName = imageParts.join('/')
  const temporary = 'temp'
  const final = imageName
  if (flatten) {
    imageName = temporary
  }
  const imageFile = path.join(workingPath, output)

  if (options.cacheFromLatest) {
    cacheFrom = [final, 'latest'].join(':')
  } else if (options.cacheFrom) {
    cacheFrom = options.cacheFrom
  }

  if (ltsOnly && !defaultInfo.isLTS) {
    log(`Skipping build - Node version (${process.version}) is not LTS`)
    return when({})
  }

  let progress
  if (indicateProgress) {
    progress = setInterval(() => {
      process.stdout.write('.')
    }, 3000)
  }

  let info
  log(`Building Docker image '${final}'.`)

  if (cacheFrom) {
    preBuild = () => {
      log(`Attempting to pull image '${cacheFrom}' to use as cache baseline.`)
      return docker.pull(cacheFrom)
        .then(
          () => {
            log(`Pull from '${cacheFrom}' complete.`)
          },
          err => {
            log(`Docker failed to pull cache image '${cacheFrom}', building without cache argument: ${err.message}`)
            cacheFrom = undefined
          }
        )
    }
  }
  return preBuild()
    .then(
      () => docker.build(imageName, {
        working: workingPath,
        file: dockerFile,
        args: buildArgs,
        cacheFrom
      })
    )
    .then(
      () => {
        log(`Docker image '${final}' built successfully.`)
        return true
      },
      onBuildFailed.bind(null, log, imageName)
    )
    .catch(exitOnError.bind(null, progress))
    .then(() => {
      if (progress) {
        clearInterval(progress)
      }
    })
    .then(() => {
      if (flatten) {
        return flattenImage(log, docker, imageName, final)
          .then(() => {
            imageName = final
            log(`Image flattened into '${final}' successfully.`)
          })
      }
    })
    .catch(exitOnError)
    .then(
      writeBuildInfo.bind(null, log, goggles, workingPath, final, tagSpecs, defaultInfo)
    )
    .catch(exitOnError)
    .then(
      buildInfo => {
        info = buildInfo
        return info
      }
    )
    .then(
      tagImage.bind(null, log, docker, skipPRs, final)
    )
    .catch(exitOnError)
    .then(
      pushImage.bind(null, log, docker, noPush, final)
    )
    .catch(exitOnError)
    .then(
      writeImageFile.bind(null, log, imageFile, final)
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

function flattenImage (log, docker, initialImage, finalImage) {
  const tag = `${initialImage}:latest`
  return docker.inspect(tag)
    .then(data => {
      const changes = []
      const user = data.Config.User
      const working = data.Config.WorkingDir
      const env = data.Config.Env || []
      const ports = Object.keys(data.Config.ExposedPorts || {})
      const cmd = data.Config.Cmd || []
      const entry = data.Config.Entrypoint || []
      if (user) {
        changes.push(`USER ${user}`)
      }
      if (working) {
        changes.push(`WORKDIR ${working}`)
      }
      if (env.length > 0) {
        env.forEach(e => {
          changes.push(`ENV ${e}`)
        })
      }
      if (ports.length > 0) {
        ports.forEach(p => {
          changes.push(`EXPOSE ${p}`)
        })
      }
      if (cmd.length > 0) {
        changes.push(`CMD ${JSON.stringify(cmd)}`)
      }
      if (entry.length > 0) {
        changes.push(`ENTRYPOINT ${JSON.stringify(entry)}`)
      }
      log(`Flattening temporary image '${initialImage}' into '${finalImage}'.`)
      const onNoContainer = () => {
        return docker.create(tag, { name: 'temp-container' })
          .then(
            () => {
              return docker.export('temp-container')
                .then(pipe => {
                  return docker.import('pipe', finalImage, { pipe, changes }).catch(e => console.log(e))
                }).catch(e => console.log(e))
            }
          ).catch(e => console.log(e))
      }
      return docker.removeContainer('temp-container', { force: true })
        .then(onNoContainer, onNoContainer)
    })
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
  log(`Docker build for image '${imageName}' failed: ${buildError.message}`)
  throw buildError
}

function onPushFailed (log, imageName, pushError) {
  log(`Pushing the image '${imageName}' failed for some or all tags:\n ${pushError.message}`)
  throw pushError
}

function onTagFailed (log, imageName, info, tagError) {
  const tag = Array.isArray(info.tag) ? info.tag.join(', ') : info.tag
  log(`Tagging image '${imageName}' with tags, '${tag}', failed with error:\n ${tagError.message}`)
  throw tagError
}

function onWriteInfoFailed (log, writeError) {
  log(`Failed to acquire and write build information due to error: ${writeError}`)
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
          log(`Docker image '${imageName}' was pushed successfully with tags: ${Array.isArray(info.tag) ? info.tag.join(', ') : info.tag}`)
          return info
        },
        onPushFailed.bind(null, log, imageName)
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
        () => info,
        onTagFailed.bind(null, log, imageName, info)
      )
  }
}

function writeBuildInfo (log, goggles, workingPath, imageName, tags, info) {
  if (tags.length > 0) {
    return getBuildInfo(goggles, false, workingPath, tags)
      .then(
        newInfo => {
          if (newInfo.tag && Array.isArray(newInfo.tag)) {
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
          const json = JSON.stringify(newInfo, null, 2)
          const filePath = path.resolve(process.cwd(), '.buildInfo.json')
          fs.writeFileSync(filePath, json, 'utf8')
          return newInfo
        },
        onWriteInfoFailed.bind(null, log)
      )
  } else {
    log('No tags were specified, skipping tag and push.')
    log(`branch - ${info.branch}, PR - ${info.ci.pullRequest}, tagged - ${info.ci.tagged}`)
    return when({ continue: false })
  }
}

function writeImageFile (log, imageFile, imageName, info) {
  if (info && info.continue === false) {
    log('Skipping write of image file information.')
    return when(info)
  } else {
    log(`Writing image file to '${imageFile}'.`)
    info.imageName = imageName
    return when.promise((resolve, reject) => {
      const json = JSON.stringify({
        image: imageName,
        tags: info.tag
      })
      fs.writeFile(imageFile, json, 'utf8', err => {
        if (err) {
          log(`Failed to write image file to '${imageFile}' with error: ${err.message}`)
          reject(err)
        } else {
          log(`Image file written to '${imageFile}' successfully.`)
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
