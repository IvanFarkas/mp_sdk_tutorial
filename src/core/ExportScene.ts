import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';

export default function ExportScene(scene: THREE.Scene) {
  //Export scene
  setTimeout(() => {
    let roomObject: THREE.Object3D = null;
    scene.traverse(function (child: any) {
      if (child.type === 'Object3D' && child.name.startsWith('ModelMesh')) {
        roomObject = child.clone();
      }
    });

    if (roomObject) {
      const convertedObject = convertMPToThreeMesh(roomObject);
      exportToGLTF(convertedObject);
    }
  }, 3000);
}

function convertMPToThreeMesh(obj: any) {
  let singleGeometry = new THREE.BufferGeometry();
  obj.traverse(function (child: any) {
    if (child.type === 'Mesh' && child.name.startsWith('RoomMesh')) {
      child.updateMatrix();
      singleGeometry = BufferGeometryUtils.mergeBufferGeometries([
        child.geometry,
        singleGeometry,
      ]);
    }
  });

  const resultMesh = new THREE.Mesh(
    singleGeometry,
    new THREE.MeshPhongMaterial()
  );
  return resultMesh;
}

function exportToGLTF(input: any) {
  const link = document.createElement('a');
  link.style.display = 'none';
  document.body.appendChild(link); // Firefox workaround, see #6594

  function save(blob: any, filename: any) {
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    // URL.revokeObjectURL( url ); breaks Firefox...
  }

  function saveString(text: any, filename: any) {
    save(new Blob([text], { type: 'text/plain' }), filename);
  }

  function saveArrayBuffer(buffer: any, filename: any) {
    save(new Blob([buffer], { type: 'application/octet-stream' }), filename);
  }

  const gltfExporter = new GLTFExporter();

  const options = {
    trs: false,
    onlyVisible: true,
    truncateDrawRange: true,
    binary: true,
    maxTextureSize: 1024,
  };
  gltfExporter.parse(
    input,
    function (result: any) {
      if (result instanceof ArrayBuffer) {
        saveArrayBuffer(result, 'scene.glb');
      } else {
        const output = JSON.stringify(result, null, 2);
        console.log(output);
        saveString(output, 'scene.gltf');
      }
    },
    options
  );
}
