import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';

/** vertex shader source */
const vertexShaderSource = `
varying vec2 vUv;
varying vec3 vPos;
varying vec2 vCoodinates;

attribute vec3 aCoordinates;
attribute float aSpeed;
attribute float aOffset;
attribute float aDirection;
attribute float aPress;

uniform float move;
uniform float time;
uniform float mousePressed;
uniform float transition;

void main () {
  vUv = uv;
  vec3 pos = position;
  
  pos.x += sin(move * aSpeed) * 5.0;
  pos.y += sin(move * aSpeed) * 5.0;
  pos.z = position.z + move * 20.0 * aSpeed + aOffset;
  
  pos = mix(pos, position, transition);
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 3000.0 * (1.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
  
  vCoodinates = aCoordinates.xy;
  vPos = pos;
}

`;

/** fragment shader source */
const fragmentShaderSource = `
varying vec2 vCoodinates;
varying vec3 vPos;

uniform sampler2D t1;
uniform sampler2D t2;
uniform sampler2D mask;
uniform float move;

void main () {
  vec4 maskTexture = texture2D(mask, gl_PointCoord);
  vec2 myUV = vec2(vCoodinates.x / 512.0, vCoodinates.y / 512.0);
  vec4 tt1 = texture2D(t1, myUV);
  vec4 tt2 = texture2D(t2, myUV);
  
  vec4 final = mix(tt1, tt2, smoothstep(0.0, 1.0, fract(move)));
  
  float alpha = 1.0 - clamp(0.0, 1.0, abs(vPos.z / 900.0));
  gl_FragColor = final;
  gl_FragColor.a *= maskTexture.r * alpha;
}

`;

const getRandomNumber = (min, max) => {
  return Math.random() * (max - min) + min;
};

/**
 * class Sketch
 */
class Sketch {
  constructor() {
    this.animationId = null;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    document.getElementById('container').appendChild(this.renderer.domElement);
    this.camera = null;
    this.scene = null;
    this.controls = null;
    this.time = null;
    this.mouse = null;
    this.point = null;
    this.init();
  }
  
  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.camera.position.z = 1000;
    this.scene = new THREE.Scene();
    
    this.textures = [
      new THREE.TextureLoader().load('https://assets.codepen.io/3919397/1625747283927.jpeg?width=512&height=512&format=auto'),
      new THREE.TextureLoader().load('https://assets.codepen.io/3919397/1625747722281.jpeg?width=512&height=512&format=auto'),
      new THREE.TextureLoader().load('https://assets.codepen.io/3919397/1625747309022.jpeg?width=512&height=512&format=auto'),
      new THREE.TextureLoader().load('https://assets.codepen.io/3919397/1625747790149.jpeg?width=512&height=512&format=auto'),
      new THREE.TextureLoader().load('https://assets.codepen.io/3919397/1625799454774.png')
    ];
    
    this.time = 0;
    this.move = 0;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.addMesh();
    this.render();
  }
  
  addMesh() {
    this.material = new THREE.ShaderMaterial({
      fragmentShader: fragmentShaderSource,
      vertexShader: vertexShaderSource,
      uniforms: {
        progress: {type: 'f', value: 0},
        t1: {type: 't', value: this.textures[0]},
        t2: {type: 't', value: this.textures[1]},
        t3: {type: 't', value: this.textures[2]},
        t4: {type: 't', value: this.textures[3]},
        mask: {type: 't', value: this.textures[4]},
        mouse: {type: 'f', value: null},
        move: {type: 'f', value: 0},
        time: {type: 'f', value: 0},
        mousePressed: {type: 'f', value: 0},
        transition: {type: 'f', value: null}
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: false,
      //blending: THREE.AdditiveBlending
    });
    
    const number = 512 * 512;
    this.geometry = new THREE.BufferGeometry();
    this.positions = new THREE.BufferAttribute(new Float32Array(number * 3), 3);
    this.coordinates = new THREE.BufferAttribute(new Float32Array(number * 3), 3);
    this.speeds = new THREE.BufferAttribute(new Float32Array(number), 1);
    this.offset = new THREE.BufferAttribute(new Float32Array(number), 1);
    this.direction = new THREE.BufferAttribute(new Float32Array(number), 1);
    this.press = new THREE.BufferAttribute(new Float32Array(number), 1);
    
    let index = 0;
    for (let i = 0; i < 512; i++) {
      let posX = i - 256;
      for (let j = 0; j < 512; j++) {
        this.positions.setXYZ(index, posX * 2, (j - 256) * 2, 0.0);
        this.coordinates.setXYZ(index, i, j, 0);
        this.offset.setX(index, getRandomNumber(-1000, 1000));
        this.speeds.setX(index, getRandomNumber(0.4, 1));
        this.direction.setX(index, Math.random() > 0.5 ? 1 : -1);
        this.press.setX(index, getRandomNumber(0.4, 1));
        index++;
      }
    }
    
    this.geometry.setAttribute('position', this.positions);
    this.geometry.setAttribute('aCoordinates', this.coordinates);
    this.geometry.setAttribute('aOffset', this.offset);
    this.geometry.setAttribute('aSpeed', this.speeds);
    this.geometry.setAttribute('aPress', this.press);
    this.geometry.setAttribute('aDirection', this.direction);
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.mesh);
  }
  
  render() {
    this.time++;
    this.index = Math.abs(Math.floor(this.time * 0.005) % 4);
    this.mesh.rotation.x += 0.005;
    this.mesh.rotation.y += 0.005;
    this.material.uniforms.t1.value = this.textures[this.index];
    this.index === 3 ? this.index = 0 : this.index++;
    this.material.uniforms.t2.value = this.textures[this.index];
    //this.material.uniforms.transition.value = this.settings.progress;
    this.material.uniforms.transition.value = Math.sin(this.time * 0.01);
    this.material.uniforms.time.value = this.time;
    this.material.uniforms.move.value = this.time * 0.005 % 4;
    this.renderer.render(this.scene, this.camera);
    this.animationId = window.requestAnimationFrame(this.render.bind(this));
  }
  
  resize() {
    window.cancelAnimationFrame(this.animationId);
    this.init();
  }
}

window.addEventListener('load', () => {
  console.clear();
  
  const sketch = new Sketch();
  
  window.addEventListener('resize', () => {
    sketch.resize();
  });
});
