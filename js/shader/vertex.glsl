uniform float time;
varying vec2 vUv;
varying vec3 vPosition;
varying vec2 pixels;
attribute float aRandom;
float PI=3.141592653589793238;

void main(){
  vUv=uv;
  
  vec3 pos=position;
  // pos.x+=aRandom*sin((uv.y+uv.x+time)*10.)*.5;
  // pos+=aRandom*normal;
  pos+=aRandom*(.5*sin(time)+.5)*normal;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);
}