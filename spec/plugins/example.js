// simple example
// changes the package JSON file of a project
// depending on the built project to use the built version
module.exports = function (buildInfo, instructions) {
  return function (raw) {
    var json = JSON.parse(raw)
    var project = buildInfo.repository
    var version = buildInfo.version
    var dependencies = json.dependencies
    var devDependencies = json.devDependencies
    if (devDependencies && devDependencies[ project ]) {
      devDependencies[ project ] = version
    }
    if (dependencies && dependencies[ project ]) {
      dependencies[ project ] = version
    }
    return JSON.stringify(json)
  }
}
