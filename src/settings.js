const fs = require('fs')
const path = require('path')

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

function getDefaultInfo (goggles) {
  return getBuildInfo(goggles, true, getDefaultWorkingPath())
}

function getDefaultWorkingPath () {
  return path.resolve('./')
}

function getDefaultDockerfile () {
  return 'Dockerfile'
}

function getDefaultName (info) {
  const pkg = require(path.resolve(info.path, './package.json'))
  return pkg.name
}

function getDefaultTagSpecs (branches, info) {
  if (info.ci && info.ci.tagged) {
    return [ 'lt', 'v_s', 'v', 'miv', 'ma' ]
  } else if (info.branch === 'master') {
    return [ 'v_c_s' ]
  } else if (branches.indexOf(info.branch) >= 0) {
    return [ 'b_v_c_s' ]
  } else if (/\[build[-]image\]/.test(info.commitMessage)) {
    return [ 'b_v_c_s' ]
  } else {
    return []
  }
}

module.exports = function (goggles) {
  return {
    getDefaultInfo: getDefaultInfo.bind(null, goggles),
    getDefaultWorkingPath: getDefaultWorkingPath,
    getDefaultDockerfile: getDefaultDockerfile,
    getDefaultName: getDefaultName,
    getDefaultTagSpecs: getDefaultTagSpecs
  }
}
