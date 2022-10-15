# 3Dオブジェクトを回転させながらポリゴンに分解して消える演出
https://yuki-sakaguchi.github.io/threejs-animating-triangles/dist/

https://user-images.githubusercontent.com/16290220/195995684-f83f3b23-fc8c-4ae7-a6b3-5f32893dc6d7.mov

## 考え方
オブジェクトのジオメトリの頂点を取得して `time` や `progress` などに紐づけて移動させる。  
１ポリゴン（３頂点）ごとにまとめて動かすイメージ. 
  
今回はその頂点三点の真ん中を保存しておいて、スケール０から徐々に大きくしながら回転しつつ表示している. 
  
基本的にはシェーダーを使う. 

影もオブジェクトと同じように反応させるためには `customDepthMaterial` を設定する必要がある. 


## 参考
- YouTube
  - https://www.youtube.com/watch?v=frgmk0Wu76A
- 3Dモデルをダウンロードできるサイト. 
  - https://sketchfab.com/3d-models/figure-of-a-dancer-63212acff8474095ba2626d9366df852
- gltfファイルを開いて解析したり、glbファイルに変換したりできるサイト. 
  - https://gltf.report/

## メモ
- `three-extend-material` を使おうとしたけど npm でインストールしてもうまく動かなかったから、ソースをごっそりサイトから持ってきて `extend.js` としてローカルに配置して使うようにした
  - https://github.com/Fyrestar/THREE.extendMaterial

## 作りながらできた動き

https://user-images.githubusercontent.com/16290220/195996433-c1dac6d2-5b7d-4c19-bb2d-fa69a53bd846.mov

https://user-images.githubusercontent.com/16290220/195996394-0711d22b-4186-453a-b3b3-9f1d8387d6b3.mov

https://user-images.githubusercontent.com/16290220/195996357-93ac33a1-7ec8-406a-b95a-1452becd3ad6.mov

https://user-images.githubusercontent.com/16290220/195996330-aae2143d-4d9d-4dda-ad2b-7dd8eeab6213.mov

https://user-images.githubusercontent.com/16290220/195996289-c0a90a4e-a9d1-430a-92ad-8dd9687233ee.mov

https://user-images.githubusercontent.com/16290220/195996248-f52d329f-2581-46b1-beec-bf3ffa5343d9.mov

https://user-images.githubusercontent.com/16290220/195996210-d0505ded-48e7-42b4-b1a9-bacf5eb11e6b.mov
