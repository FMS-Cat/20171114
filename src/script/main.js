import xorshift from './xorshift';
xorshift( 13487134006 );
import GLCat from './glcat';
import Path from './glcat-path';
import step from './step';
import Tweak from './tweak';
import Automaton from './automaton.min';
import octahedron from './octahedron';

const glslify = require( 'glslify' );

// ------

const clamp = ( _value, _min, _max ) => Math.min( Math.max( _value, _min ), _max );
const saturate = ( _value ) => clamp( _value, 0.0, 1.0 );

// ------

let automaton = new Automaton( {
  gui: divAutomaton,
  data: `
  {"rev":20170418,"length":1,"resolution":1000,"params":{"fillColor":[{"time":0,"value":0,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":1,"value":1,"mode":1,"params":{},"mods":[false,false,false,false]}],"jpegLofi":[{"time":0,"value":0.05,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":0.27692307692307716,"value":0.045829418367000024,"mode":2,"params":{},"mods":[false,false,false,false]},{"time":0.4403846153846154,"value":0.11427823097212272,"mode":2,"params":{},"mods":[false,false,false,false]},{"time":0.4923076923076924,"value":0.24501014775891428,"mode":2,"params":{},"mods":[false,false,false,false]},{"time":0.5826923076923077,"value":0.1225561536445513,"mode":2,"params":{},"mods":[false,false,false,false]},{"time":0.7980769230769231,"value":0.10033198644652486,"mode":2,"params":{},"mods":[false,false,false,false]},{"time":1,"value":0.05,"mode":2,"params":{},"mods":[false,false,false,false]}],"pixelsortThreshold":[{"time":0,"value":0.1,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":0.5942307692307692,"value":0.2,"mode":2,"params":{},"mods":[false,false,false,false]},{"time":0.6461538461538462,"value":0.7708701333526915,"mode":2,"params":{},"mods":[false,false,false,false]},{"time":0.7903846153846154,"value":0.4262424461837446,"mode":2,"params":{},"mods":[false,false,false,false]},{"time":1,"value":0.1,"mode":2,"params":{},"mods":[false,false,false,false]}],"jpegHigh":[{"time":0,"value":0,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":0.5297692307692308,"value":0.05085498069607048,"mode":2,"params":{},"mods":[false,false,false,false]},{"time":0.5846153846153846,"value":0.4315425178784763,"mode":2,"params":{},"mods":[false,false,false,false]},{"time":0.7480769230769231,"value":0.05206736564711889,"mode":2,"params":{},"mods":[false,false,false,false]},{"time":1,"value":0,"mode":2,"params":{},"mods":[false,false,false,false]}]},"gui":{"snap":{"enable":false,"bpm":120,"offset":0}}}
`
} );
let auto = automaton.auto;

// ------

let width = 320;
let height = 320;
canvas.width = width;
canvas.height = height;

let gl = canvas.getContext( 'webgl' );
let glCat = new GLCat( gl );
let path = new Path( glCat );

// ------

let tweak = new Tweak( divTweak );

// ------

let oct = octahedron( 0 );

// ------

let totalFrame = 0;
let frame = 0;
let frames = 160;
let time = 0.0;
let init = true;
let secs = 1.0;
let deltaTime = 0.0;

let timeUpdate = () => {
  let reset = false;

  totalFrame ++;
  frame ++;
  if ( frames <= frame ) {
    frame = 0;
    reset = true;
  }
  
  let prevTime = time;
  time = secs * frame / frames;
  deltaTime = ( time + ( reset ? secs : 0.0 ) ) - prevTime;

  init = false;
};

// ------

let particlePixels = 4;
let particlesSqrt = 8;
let particles = particlesSqrt * particlesSqrt;
let vertsPerParticle = oct.pos.length / 3;

let vboQuad = glCat.createVertexbuffer( [ -1, -1, 1, -1, -1, 1, 1, 1 ] );

let vboTube = glCat.createVertexbuffer( ( () => {
  let ret = [];
  for ( let iy = 0; iy < 33; iy ++ ) {
    for ( let ix = 0; ix < 32; ix ++ ) {
      // AWFUL CODE START
      ret.push( 10.0 * Math.cos( ix * Math.PI * 2.0 / 32.0 ) );
      ret.push( 10.0 * Math.sin( ix * Math.PI * 2.0 / 32.0 ) );
      ret.push( 40.0 * ( iy - 16.0 ) / 16.0 );

      ret.push( 10.0 * Math.cos( ( ix + 1 ) * Math.PI * 2.0 / 32.0 ) );
      ret.push( 10.0 * Math.sin( ( ix + 1 ) * Math.PI * 2.0 / 32.0 ) );
      ret.push( 40.0 * ( iy - 16.0 ) / 16.0 );

      ret.push( 10.0 * Math.cos( ix * Math.PI * 2.0 / 32.0 ) );
      ret.push( 10.0 * Math.sin( ix * Math.PI * 2.0 / 32.0 ) );
      ret.push( 40.0 * ( iy - 16.0 ) / 16.0 );

      ret.push( 10.0 * Math.cos( ix * Math.PI * 2.0 / 32.0 ) );
      ret.push( 10.0 * Math.sin( ix * Math.PI * 2.0 / 32.0 ) );
      ret.push( 40.0 * ( ( iy + 1 ) - 16.0 ) / 16.0 );
      // AWFUL CODE END
    }
  }
  return ret;
} )() );

let vboParticle = glCat.createVertexbuffer( ( () => {
  let ret = [];
  for ( let i = 0; i < particlesSqrt * particlesSqrt * vertsPerParticle; i ++ ) {
    let ix = Math.floor( i / vertsPerParticle ) % particlesSqrt;
    let iy = Math.floor( i / particlesSqrt / vertsPerParticle );
    let iz = i % vertsPerParticle;
    
    ret.push( ix * particlePixels );
    ret.push( iy );
    ret.push( iz );
  }
  return ret;
} )() );

// ------

let textureRandomSize = 256;

let textureRandomUpdate = ( _tex ) => {
  glCat.setTextureFromArray( _tex, textureRandomSize, textureRandomSize, ( () => {
    let len = textureRandomSize * textureRandomSize * 4;
    let ret = new Uint8Array( len );
    for ( let i = 0; i < len; i ++ ) {
      ret[ i ] = Math.floor( xorshift() * 256.0 );
    }
    return ret;
  } )() );
};

let textureRandomStatic = glCat.createTexture();
glCat.textureWrap( textureRandomStatic, gl.REPEAT );
textureRandomUpdate( textureRandomStatic );

let textureRandom = glCat.createTexture();
glCat.textureWrap( textureRandom, gl.REPEAT );

let textureOctahedronPos = glCat.createTexture();
glCat.setTextureFromFloatArray( textureOctahedronPos, oct.pos.length / 3, 1, ( () => {
  let ret = [];
  for ( let i = 0; i < oct.pos.length / 3; i ++ ) {
    ret[ i * 4 + 0 ] = oct.pos[ i * 3 + 0 ];
    ret[ i * 4 + 1 ] = oct.pos[ i * 3 + 1 ];
    ret[ i * 4 + 2 ] = oct.pos[ i * 3 + 2 ];
    ret[ i * 4 + 3 ] = 1.0;
  }
  return ret;
} )() );

let textureOctahedronNor = glCat.createTexture();
glCat.setTextureFromFloatArray( textureOctahedronNor, oct.nor.length / 3, 1, ( () => {
  let ret = [];
  for ( let i = 0; i < oct.nor.length / 3; i ++ ) {
    ret[ i * 4 + 0 ] = oct.nor[ i * 3 + 0 ];
    ret[ i * 4 + 1 ] = oct.nor[ i * 3 + 1 ];
    ret[ i * 4 + 2 ] = oct.nor[ i * 3 + 2 ];
    ret[ i * 4 + 3 ] = 1.0;
  }
  return ret;
} )() );

// ------

let renderA = document.createElement( 'a' );

let saveFrame = () => {
  renderA.href = canvas.toDataURL();
  renderA.download = ( '0000' + totalFrame ).slice( -5 ) + '.png';
  renderA.click();
};

// ------

let cameraPos = [ 0.0, 0.0, 5.0 ];
let cameraRot = 0.0;
let cameraFov = 60.0;

// ------

path.setGlobalFunc( () => {
  glCat.uniform1i( 'init', init );
  glCat.uniform1f( 'time', time );
  glCat.uniform1f( 'deltaTime', deltaTime );
  glCat.uniform3fv( 'cameraPos', cameraPos );
  glCat.uniform1f( 'cameraRot', cameraRot );
  glCat.uniform1f( 'cameraFov', cameraFov );
  glCat.uniform1f( 'particlesSqrt', particlesSqrt );
  glCat.uniform1f( 'particlePixels', particlePixels );
  glCat.uniform1f( 'frame', frame % frames );
  glCat.uniform1f( 'frames', frames );
  glCat.uniform1i( 'blockSize', 8 );
  glCat.uniform1f( 'vertsPerParticle', vertsPerParticle );
} );

path.add( {
  pComputeReturn: {
    width: particlesSqrt * particlePixels,
    height: particlesSqrt,
    vert: glslify( './shader/quad.vert' ),
    frag: glslify( './shader/return.frag' ),
    blend: [ gl.ONE, gl.ONE ],
    clear: [ 0.0, 0.0, 0.0, 0.0 ],
    func: () => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniformTexture( 'texture', path.fb( "pCompute" ).texture, 0 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },

  CHUB: {
    width: width,
    height: height,
    vert: glslify( './shader/object.vert' ),
    frag: glslify( './shader/prender.frag' ),
    blend: [ gl.ONE, gl.ONE ],
    func: () => {
      glCat.attribute( 'pos', vboTube, 3 );
      glCat.uniform3fv( 'color', [ 0.1, 0.1, 0.1 ] );
      gl.drawArrays( gl.LINES, 0, vboTube.length / 3 );
    }
  },

  pCompute: {
    width: particlesSqrt * particlePixels,
    height: particlesSqrt,
    vert: glslify( './shader/quad.vert' ),
    frag: glslify( './shader/pcompute.frag' ),
    blend: [ gl.ONE, gl.ONE ],
    clear: [ 0.0, 0.0, 0.0, 0.0 ],
    func: () => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniformTexture( 'textureReturn', path.fb( "pComputeReturn" ).texture, 0 );
      glCat.uniformTexture( 'textureRandom', textureRandom, 1 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },
  
  pRender: {
    width: width,
    height: height,
    vert: glslify( './shader/prender.vert' ),
    frag: glslify( './shader/prender.frag' ),
    blend: [ gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    func: () => {
      glCat.attribute( 'vuv', vboParticle, 3 );
      glCat.uniform1i( 'depth', false );
      glCat.uniform2fv( 'resolutionPcompute', [ particlesSqrt * particlePixels, particlesSqrt ] );
      glCat.uniformTexture( 'texturePcompute', path.fb( "pCompute" ).texture, 0 );
      glCat.uniformTexture( 'textureOctahedronPos', textureOctahedronPos, 1 );
      glCat.uniformTexture( 'textureOctahedronNor', textureOctahedronNor, 2 );

      glCat.uniform3fv( 'color', [ 1.2, 0.02, 0.2 ] );
      gl.drawArrays( gl.LINE_STRIP, 0, particles * vertsPerParticle );
    }
  },
  
  おたくはすぐポストエフェクトを挿す: {
    width: width,
    height: height,
    vert: glslify( './shader/quad.vert' ),
    frag: glslify( './shader/post.frag' ),
    blend: [ gl.ONE, gl.ONE ],
    clear: [ 0.0, 0.0, 0.0, 0.0 ],
    func: () => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniformTexture( 'sampler0', path.fb( "pRender" ).texture, 0 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },
  
  jpegCosine: {
    width: width,
    height: height,
    vert: glslify( './shader/quad.vert' ),
    frag: glslify( './shader/jpeg-cosine.frag' ),
    blend: [ gl.ONE, gl.ONE ],
    clear: [ 0.0, 0.0, 0.0, 0.0 ],
    func: () => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniformTexture( 'sampler0', path.fb( "おたくはすぐポストエフェクトを挿す" ).texture, 0 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },
    
  jpegRender: {
    width: width,
    height: height,
    vert: glslify( './shader/quad.vert' ),
    frag: glslify( './shader/jpeg-render.frag' ),
    blend: [ gl.ONE, gl.ONE ],
    clear: [ 0.0, 0.0, 0.0, 0.0 ],
    func: () => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniform1f( 'highFreqMultiplier', auto( "jpegHigh" ) );
      // glCat.uniform1f( 'dataThreshold', 0.04 );
      glCat.uniform1f( 'dataLofi', auto( "jpegLofi" ) );
      glCat.uniformTexture( 'sampler0', path.fb( "jpegCosine" ).texture, 0 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },
  
  pixelsortCompare: {
    width: width,
    height: height,
    vert: glslify( './shader/quad.vert' ),
    frag: glslify( './shader/pixelsort-compare.frag' ),
    blend: [ gl.ONE, gl.ONE ],
    clear: [ 0.0, 0.0, 0.0, 0.0 ],
    func: () => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniform1f( 'threshold', auto( "pixelsortThreshold" ) );
      glCat.uniformTexture( 'sampler0', path.fb( "jpegRender" ).texture, 0 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },
  
  pixelsortRender: {
    width: width,
    height: height,
    vert: glslify( './shader/quad.vert' ),
    frag: glslify( './shader/pixelsort-render.frag' ),
    blend: [ gl.ONE, gl.ONE ],
    clear: [ 0.0, 0.0, 0.0, 0.0 ],
    func: () => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniformTexture( 'sampler0', path.fb( "jpegRender" ).texture, 0 );
      glCat.uniformTexture( 'samplerMap', path.fb( "pixelsortCompare" ).texture, 1 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },
} );

// ------

let update = () => {
  if ( frame % frames === 0 ) { xorshift( 79017846734887343443 ); }

  if ( !tweak.checkbox( 'play', { value: true } ) ) {
    setTimeout( update, 10 );
    return;
  }
  
  textureRandomUpdate( textureRandom );
  
  automaton.update( time );
  path.render( "pComputeReturn" );
  path.render( "pCompute" );
  path.render( "pRender" );
  path.render( "CHUB", path.fb( "pRender" ).framebuffer );
  path.render( "おたくはすぐポストエフェクトを挿す" );
  path.render( "jpegCosine" );
  path.render( "jpegRender" );
  path.render( "pixelsortCompare" );
  path.render( "pixelsortRender", null );

  cameraPos = [
    2.0,
    1.0,
    10.0
  ];
  // cameraRot = time * Math.PI * 2.0;

  console.log( totalFrame );

  timeUpdate();

  if ( tweak.checkbox( 'save', { value: false } ) ) {
    saveFrame();
  }
  
  requestAnimationFrame( update );
};

// ------

step( {
  0: ( done ) => {
    update();
  }
} );

window.addEventListener( 'keydown', ( _e ) => {
  if ( _e.which === 27 ) {
    tweak.checkbox( 'play', { set: false } );
  }
} );
