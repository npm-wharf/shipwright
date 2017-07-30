var fs = require('fs')
var path = require('path')

function getBuildInfo (goggles, unlink, workingPath, tags) {
  return goggles.getInfo({ repo: workingPath, tags: tags })
    .then(function (info) {
      if (unlink) {
        fs.unlinkSync(path.resolve(workingPath, '.buildinfo.json'))
      }
      return info
    })
}

function getDefaultInfo (goggles) {
  return getBuildInfo(goggles, true, getDefaultWorkingPath())
}

function getDefaultWorkingPath () {
  return path.resolve('./')
}

function getDefaultDockerfile () {
  return path.resolve('./Dockerfile')
}

function getDefaultName (info) {
  var pkg = require(path.resolve(info.path, './package.json'))
  return pkg.name
}

function getDefaultTagSpecs (branches, info) {
  if (info.ci && info.ci.tagged) {
    return [ 'v_s', 'v', 'miv', 'ma' ]
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
