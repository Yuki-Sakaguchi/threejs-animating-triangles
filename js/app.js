import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import fragment from './shader/fragment.glsl';
import vertex from './shader/vertex.glsl';
import GUI from 'lil-gui';
// import gsap from 'gsap';
import dancer from '../model.glb';
import './lib/extend.js'; // https://github.com/Fyrestar/THREE.extendMaterial

// let wg = [t(vf), t(ff), t(gf)][Math.floor(3 * Math.random())];

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xffffff, 0);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.001,
      1000
    );

    // const size = 10;
    // const aspect = wiindow.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera(size * aspect / 2, size * aspect / 2, size / 2, size / 2, -1000, 1000);

    this.camera.position.set(2, 2, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/');
    this.gltf = new GLTFLoader();
    this.gltf.setDRACOLoader(this.dracoLoader);

    this.isPlaying = true;

    this.settings = {
      progress: 0,
      color: 0x2ec0ff,
    };

    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.addLights();
    this.initSettings();
  }

  initSettings() {
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01).onChange(val => {
      this.material2.uniforms.progress.value = val;
    });
    this.gui.addColor(this.settings, "color").onChange(val => {
      this.material2.uniforms.diffuse.value = new THREE.Color(val);
    });
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.camera.updateProjectionMatrix();
  }

  addObjects() {

    // 床を追加
    let floor = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 150, 100, 100),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    )
    floor.rotation.x = -Math.PI * 0.5;
    floor.position.y = -1.1;
    this.scene.add(floor);
    floor.castShadow = false;
    floor.receiveShadow = true;

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivativers : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector4() },
      },
      wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.geometry = new THREE.IcosahedronGeometry(2, 10).toNonIndexed();
    // this.geometry = new THREE.SphereGeometry(1, 32, 32).toNonIndexed(); // ポリゴンを繋げない

    // this.material2 = new THREE.MeshStandardMaterial({
    //   color: 0xff0000
    // });

    // 拡張したマテリアル（https://github.com/Fyrestar/THREE.extendMaterial）
    this.material2 = THREE.extendMaterial(THREE.MeshStandardMaterial, {
      class: THREE.CustomMaterial,  // In this case ShaderMaterial would be fine too, just for some features such as envMap this is required
      vertexHeader: `
      attribute float aRandom;
      attribute vec3 aCenter;
      uniform float time;
      uniform float progress;

      // 回転処理（https://gist.github.com/yiwenl/3f804e80d0930e34a0b33359259b556c）
      mat4 rotationMatrix(vec3 axis, float angle) {
        axis = normalize(axis);
        float s = sin(angle);
        float c = cos(angle);
        float oc = 1.0 - c;
        return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                    0.0,                                0.0,                                0.0,                                1.0);
      }

      vec3 rotate(vec3 v, vec3 axis, float angle) {
        mat4 m = rotationMatrix(axis, angle);
        return (m * vec4(v, 1.0)).xyz;
      }
      `,
      vertex: {
        transformEnd: `
        // float prog = (position.y + 10.0) / 2.0;
        // float locprog = clamp((progress - 0.8 * prog) / 0.2, 0.0, 1.0);

        // // locprog = progress;

        // transformed = transformed - aCenter;
        // transformed += 30.0 * normal * aRandom * locprog;
        // transformed *= (1.0 - locprog);
        // transformed += aCenter;
        // transformed = rotate(transformed, vec3(0.0, 1.0, 0.0), aRandom * (locprog) * 3.14 * 3.0);

        float prog = clamp((position.y + 1.12)/2.,0.,1.); 
        float locprog = clamp( (progress - 0.8*prog)/0.2, 0., 1.);

        transformed = transformed - aCenter;
        transformed +=4.*normal*aRandom*(locprog);
        transformed *=clamp((1.- locprog*9.),0.,1.);
        transformed += aCenter;
        transformed = rotate(transformed, vec3(0.0, 1.0, 0.0), aRandom*(locprog)*3.14*4.);
        `
      },
      // fragment: {
      //   "vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;": "outgoingLight =texture2D( matcap, uv ).rgb;"
      // },
      uniforms: {
        roughness: 0.75,
        // matcap: (new THREE.TextureLoader.load()),
        time: {
          mixed: true,    // Uniform will be passed to a derivative material (MeshDepthMaterial below)
          linked: true,   // Similar as shared, but only for derivative materials, so wavingMaterial will have it's own, but share with it's shadow material
          value: 0
        },
        progress: {
          mixed: true,
          linked: true,
          value: 0.0
        }
      }
    });

    // 色をつけるには uniforms.diffuse を書き換えないとダメっぽい。多分シェーダー使ってるから
    this.material2.uniforms.diffuse.value = new THREE.Color(this.settings.color);

    // glbファイルを読み込んでシーンに追加
    this.gltf.load(dancer, (gltf) => {
      // this.dancer = gltf.scene.getObjectByName('mesh_0');
      gltf.scene.traverse((e => {
        console.log(e, e.isMesh)
        if (e.isMesh) {
          let t = e.clone();

          // サイズの調整
          let s = 0.005;
          t.geometry.scale(s, s, s);
          this.group.add(t);

          // 追加
          // this.scene.add(this.dancer);

          // ジオメトリを上書き
          const geo = t.geometry.toNonIndexed();
          t.geometry = geo;

          // マテリアルを自作のものに
          t.material = this.material2;
          t.castShadow = true;

          // シェーダーで形を変えた時に影も形を変えるために設定する
          // 参考：https://qiita.com/aa_debdeb/items/2a3527b1527380e4af85
          t.customDepthMaterial = THREE.extendMaterial(THREE.MeshDepthMaterial, {
            template: this.material2,
          });

          let len = geo.attributes.position.count;

          // ポリゴンごとに動きをランダムにするために頂点ごとのランダムの値を生成する
          // 頂点の数を取得して、それの３倍の数の配列を作る 
          // その一つ一つにランダムの値を設定して、シェーダーで渡している aRandom に格納して、 vertex.glsl 側でそれを使って、頂点ごとに動きをつける
          let randoms = new Float32Array(len);

          // ポリゴンごとの真ん中の位置を保存する
          // これを使って、最初大きさがゼロになって見えないところから始まるようにする（シェーダーで使う）
          let centers = new Float32Array(len * 3);

          for (let i = 0; i < len; i += 3) {
            let r = Math.random();
            randoms[i] = r;
            randoms[i + 1] = r;
            randoms[i + 2] = r;

            // ポリゴンの3つの頂点ごとの位置を取得
            let x = geo.attributes.position.array[i * 3];
            let y = geo.attributes.position.array[i * 3 + 1];
            let z = geo.attributes.position.array[i * 3 + 2];
            let x1 = geo.attributes.position.array[i * 3 + 3];
            let y1 = geo.attributes.position.array[i * 3 + 4];
            let z1 = geo.attributes.position.array[i * 3 + 5];
            let x2 = geo.attributes.position.array[i * 3 + 6];
            let y2 = geo.attributes.position.array[i * 3 + 7];
            let z2 = geo.attributes.position.array[i * 3 + 8];

            // それらの位置から真ん中を求める
            let center = new THREE.Vector3(x, y, z).add(new THREE.Vector3(x1, y1, z1)).add(new THREE.Vector3(x2, y2, z2)).divideScalar(3);

            // 頂点3つあるのでそれぞれに同じ真ん中の位置を保存
            centers.set([center.x, center.y, center.z], i * 3);
            centers.set([center.x, center.y, center.z], (i + 1) * 3);
            centers.set([center.x, center.y, center.z], (i + 2) * 3);
          }
          geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
          geo.setAttribute('aCenter', new THREE.BufferAttribute(centers, 3));
        }
      }))

    });
  }

  addLights() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(light1);

    const light2 = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 3, 0.3);
    light2.position.set(0, 2, 2);
    light2.target.position.set(0, 0, 0);
    light2.castShadow = true;
    light2.shadow.camera.near = 0.1;
    light2.shadow.camera.far = 9;
    light2.shadow.bias = 0.0001;
    light2.shadow.mapSize.width = 2048;
    light2.shadow.mapSize.height = 2048;
    this.scene.add(light2);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.render();
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.04;
    this.group.rotation.y = this.settings.progress * Math.PI * 2;
    this.material2.uniforms.time.value = this.time;
    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById('container'),
});