require('./setup.js')
const path = require('path')
const log = sinon.spy(function () {})
const githubChangeFile = sinon.stub()
const github = require('../src/github')(log, githubChangeFile)

describe('GitHub', function () {
  it('should log options file load failures in correct format', function () {
    (function () {
      github.onGetOptionsFailed(new Error('ohnoes'))
    }).should.throw(Error, 'ohnoes')
    log.should.have.been.calledWith(
      'Failed to get options for update with error: ohnoes'
    )
  })

  it('should log module failures in correct format', function () {
    (function () {
      github.onLoadModuleFailed(new Error('oops'))
    }).should.throw(Error, 'oops')
    log.should.have.been.calledWith(
      'Failed to load module due to error: oops'
    )
  })

  describe('create PR', function () {
    describe('on success', function () {
      var result

      before(function () {
        process.env.GITHUB_API_TOKEN = 'TEST'
        githubChangeFile
          .withArgs({
            user: 'user',
            repo: 'test',
            filename: 'package.json',
            branch: 'master',
            newBranch: 'update-package',
            transform: sinon.match.func,
            token: 'TEST'
          }).resolves({ test: true })

        return github.createPR({}, {
          source: {
            owner: 'user',
            repo: 'test',
            branch: 'master',
            file: 'package.json'
          },
          branch: 'update-package',
          transform: function () {}
        })
        .then(function (x) {
          result = x
        })
      })

      it('should log PR creation', function () {
        log.should.have.been.calledWith(
          "Creating pull request to 'user/test:master' to change file 'package.json'"
        )
      })

      it('should have called githubChangeFile with correct arguments', function () {
        githubChangeFile
          .should.have.been.calledWith({
            user: 'user',
            repo: 'test',
            filename: 'package.json',
            branch: 'master',
            newBranch: 'update-package',
            transform: sinon.match.func,
            token: 'TEST'
          })
      })

      it('should resolve result on success', function () {
        result.should.eql({ test: true })
      })

      after(function () {
        githubChangeFile.reset()
        delete process.env.GITHUB_API_TOKEN
      })
    })

    describe('on failure', function () {
      var result
      before(function () {
        process.env.GITHUB_API_TOKEN = 'TEST'
        githubChangeFile
          .withArgs({
            user: 'user',
            repo: 'test',
            filename: 'package.json',
            branch: 'master',
            newBranch: 'update-package',
            transform: sinon.match.func,
            token: 'TEST'
          }).rejects(new Error('just ... no'))

        return github.createPR({}, {
          source: {
            owner: 'user',
            repo: 'test',
            branch: 'master',
            file: 'package.json'
          },
          branch: 'update-package',
          transform: function () {}
        })
        .then(null, function (x) {
          result = x
        })
      })

      it('should log PR creation', function () {
        log.should.have.been.calledWith(
          "Creating pull request to 'user/test:master' to change file 'package.json'"
        )
      })

      it('should have called githubChangeFile with correct arguments', function () {
        githubChangeFile
          .should.have.been.calledWith({
            user: 'user',
            repo: 'test',
            filename: 'package.json',
            branch: 'master',
            newBranch: 'update-package',
            transform: sinon.match.func,
            token: 'TEST'
          })
      })

      it('should reject with error on failure', function () {
        result.message.should.eql(
          "Failed to create PR to 'user/test:master' to update file 'package.json' due to error: just ... no"
        )
      })

      after(function () {
        githubChangeFile.reset()
        delete process.env.GITHUB_API_TOKEN
      })
    })
  })

  describe('get options', function () {
    it('should reject with error when given a bad path', function () {
      return github.getOptions('./test')
        .should.be.rejectedWith(
          Error,
          `Invalid change file path specified '${path.resolve('./test')}'`
        )
    })

    it('should load valid json', function () {
      return github.getOptions('./spec/plugins/example.json')
        .should.eventually.eql({
          source: {
            owner: 'npm-wharf',
            repo: 'shipwright',
            file: './package.json'
          },
          module: '../spec/plugins/example'
        })
    })

    it('should load valid yaml', function () {
      return github.getOptions('./spec/plugins/example.yaml')
        .should.eventually.eql({
          source: {
            owner: 'npm-wharf',
            repo: 'shipwright',
            file: './package.json',
            branch: 'not-master'
          },
          module: './spec/plugins/example'
        })
    })

    it('should load valid yml', function () {
      return github.getOptions('./spec/plugins/example.yml')
        .should.eventually.eql({
          source: {
            owner: 'npm-wharf',
            repo: 'shipwright',
            file: './package.json'
          },
          module: './spec/plugins/example',
          branch: 'update-shipwright-version'
        })
    })

    it('should fail to load invalid json', function () {
      return github.getOptions('./spec/plugins/nope.json')
        .should.be.rejectedWith(Error,
          /Error deserializing change.*nope\.json/
        )
    })

    it('should fail to load invalid extention', function () {
      return github.getOptions('./spec/plugins/nope.txt')
        .should.be.rejectedWith(Error,
          `Unknown change file extension specified - '.txt' in '${path.resolve('./spec/plugins/nope.txt')}'`
        )
    })
  })

  describe('module load', function () {
    it('should reject with error when given a bad path', function () {
      return github.loadModule({}, { module: './test' })
        .should.be.rejectedWith(Error, "Cannot find module './test'")
    })

    it('should reject with error when module is invalid', function () {
      return github.loadModule({}, { module: '../spec/plugins/invalid' })
        .should.be.rejectedWith(Error, "Failed to load PR module '../spec/plugins/invalid' due to error: Unexpected token ?")
    })

    describe('when valid module is provided', function () {
      var options
      before(function () {
        return github.loadModule({}, { module: '../spec/plugins/example' })
          .then(function (x) {
            options = x
          })
      })

      it('should add transform to options', function () {
        options.should.have.property('module')
        options.should.have.property('transform')
      })

      it('should log loading module', function () {
        log.should.be.calledWith(
          `Loading PR transform module from '${require.resolve('../spec/plugins/example')}'`
        )
      })
    })
  })

  describe('update with', function () {
    var result
    before(function () {
      process.env.GITHUB_API_TOKEN = 'TEST'
      githubChangeFile
          .withArgs({
            user: 'npm-wharf',
            repo: 'shipwright',
            filename: './package.json',
            branch: 'master',
            newBranch: 'update-npm-wharf-shipwright-master',
            transform: sinon.match.func,
            token: 'TEST'
          }).resolves({ test: true })

      return github.updateWith(
        {
          owner: 'npm-wharf',
          repository: 'shipwright',
          branch: 'master',
          version: '1.0.0'
        },
        './spec/plugins/example.json'
      )
      .then(function (x) {
        result = x
      })
    })

    it('should log loading module', function () {
      log.should.be.calledWith(
        `Loading PR transform module from '${require.resolve('../spec/plugins/example')}'`
      )
    })

    it('should log PR creation', function () {
      log.should.have.been.calledWith(
        `Creating pull request to 'npm-wharf/shipwright:master' to change file './package.json'`
      )
    })

    it('should have called githubChangeFile with correct arguments', function () {
      githubChangeFile
        .should.have.been.calledWith({
          user: 'npm-wharf',
          repo: 'shipwright',
          filename: './package.json',
          branch: 'master',
          newBranch: 'update-npm-wharf-shipwright-master',
          transform: sinon.match.func,
          token: 'TEST'
        })
    })

    it('should resolve result on success', function () {
      result.should.eql({ test: true })
    })

    after(function () {
      githubChangeFile.reset()
      delete process.env.GITHUB_API_TOKEN
    })
  })
})
