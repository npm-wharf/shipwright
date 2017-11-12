const format = require('util').format
const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const when = require('when')

function createPR (log, githubChangeFile, buildInfo, options) {
  return when.promise((resolve, reject) => {
    log("Creating pull request to '%s/%s:%s' to change file '%s'",
      options.source.owner,
      options.source.repo,
      options.source.branch || 'master',
      options.source.file
    )
    githubChangeFile({
      user: options.source.owner,
      repo: options.source.repo,
      filename: options.source.file,
      branch: options.source.branch || 'master',
      newBranch: options.branch || [ 'update', buildInfo.owner, buildInfo.repository, buildInfo.branch ].join('-'),
      transform: options.transform,
      token: process.env.GITHUB_API_TOKEN
    })
    .then(
      result => {
        resolve(result)
      }
    )
    .catch(
      error => {
        reject(new Error(
          format("Failed to create PR to '%s/%s:%s' to update file '%s' due to error: %s",
            options.source.owner,
            options.source.repo,
            options.source.branch,
            options.source.file,
            error.message
          )
        ))
      }
    )
  })
}

function getOptions (log, changeFile) {
  const fullPath = path.resolve(changeFile)
  return when.promise((resolve, reject) => {
    if (!fs.existsSync(fullPath)) {
      reject(new Error(format("Invalid change file path specified '%s'", fullPath)))
    } else {
      const ext = path.extname(changeFile)
      log("Reading PR option file '%s'.", fullPath)
      try {
        const content = fs.readFileSync(fullPath, 'utf8')
        let options
        if (ext === '.json') {
          options = JSON.parse(content)
        } else if (/[.]ya?ml/.test(ext)) {
          options = yaml.load(content)
        } else {
          reject(new Error(format("Unknown change file extension specified - '%s' in '%s'", ext, fullPath)))
        }
        resolve(options)
      } catch (ex) {
        reject(new Error(format("Error deserializing change file '%s': %s", fullPath, ex.message)))
      }
    }
  })
}

function loadModule (log, buildInfo, options) {
  return when.promise((resolve, reject) => {
    var modulePath
    try {
      modulePath = require.resolve(options.module)
    } catch (e) {
      reject(e)
    }
    log("Loading PR transform module from '%s'", modulePath)
    try {
      options.transform = require(options.module)(buildInfo, options.args)
      resolve(options)
    } catch (ex) {
      reject(new Error(format(
        "Failed to load PR module '%s' due to error: %s",
        options.module,
        ex.message
      )))
    }
  })
}

function onGetOptionsFailed (log, error) {
  log('Failed to get options for update with error: %s', error.message)
  throw error
}

function onLoadModuleFailed (log, error) {
  log('Failed to load module due to error: %s', error.message)
  throw error
}

function updateWith (log, githubChangeFile, buildInfo, changeFile) {
  return getOptions(log, changeFile)
    .then(
      loadModule.bind(null, log, buildInfo),
      onGetOptionsFailed.bind(null, log)
    )
    .then(
      createPR.bind(null, log, githubChangeFile, buildInfo),
      onLoadModuleFailed.bind(null, log)
    )
}

module.exports = function (log, githubChangeFile) {
  return {
    createPR: createPR.bind(null, log, githubChangeFile),
    getOptions: getOptions.bind(null, log),
    loadModule: loadModule.bind(null, log),
    onGetOptionsFailed: onGetOptionsFailed.bind(null, log),
    onLoadModuleFailed: onLoadModuleFailed.bind(null, log),
    updateWith: updateWith.bind(null, log, githubChangeFile)
  }
}
