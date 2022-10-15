uniform vec2 u_resolution;
varying vec2 vUv;

void main(){
  vec3 color=vec3(vUv.x,vUv.y,0.);
  gl_FragColor=vec4(color,1.);
}