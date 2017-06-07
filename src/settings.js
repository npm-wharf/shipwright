var fs = require( "fs" );
var path = require( "path" );

function getBuildInfo( goggles, unlink, workingPath, tags ) {
  return goggles.getInfo( { repo: workingPath, tags: tags } )
    .then( function( info ) {
      if( unlink ) {
        fs.unlinkSync( path.resolve( workingPath, ".buildinfo.json" ) );
      }
      return info;
    } );
}

function getDefaultInfo( goggles ) {
  return getBuildInfo( goggles, true, getDefaultWorkingPath() );
}

function getDefaultWorkingPath() {
  return path.resolve( "./" );
}

function getDefaultDockerfile() {
  return path.resolve( "./Dockerfile" );
}

function getDefaultName( info ) {
  var package = require( path.resolve( info.path, "./package.json" ) );
  return package.name;
}

function getDefaultTagSpecs( info ) {
  if( info.ci && info.ci.tagged ) {
    return [ "v_s", "v", "miv", "ma" ];
  } else if( info.branch === "master" ){
    return [ "v_c_s" ];
  } else if ( /\[build[-]image\]/.test( info.commitMessage ) ) {
    return [ "b_v_c_s" ];
  } else {
    return [];
  }
}


module.exports = function( goggles ) {
  return {
    getDefaultInfo: getDefaultInfo.bind( null, goggles ),
    getDefaultWorkingPath: getDefaultWorkingPath,
    getDefaultDockerfile: getDefaultDockerfile,
    getDefaultName: getDefaultName,
    getDefaultTagSpecs: getDefaultTagSpecs
  };
};
