import * as THREE from 'three';

export default function ToggleWireframe(scene: any, wireframe: boolean) {
  for (let i = 0; i < scene.children.length; i++) {
    const child: any = scene.children[i];
    // console.log(child.type, child.name, child);

    let children2 = child.children;
    for (let j = 0; j < children2.length; j++) {
      logSceneObjects(children2[j]);

      let children3 = children2[j].children;
      for (let k = 0; k < children3.length; k++) {
        logSceneObjects(children3[k]);
      }
    }
  }

  // if (wireframe == false) {
  //   // TODO: Why are we getting Error: TypeError: model.traverse is not a function
  //   scene.traverse((child) => {
  //     let mesh: THREE.Mesh = (<THREE.Mesh>child).isMesh ? <THREE.Mesh>child : null;

  //     if (mesh != null) {
  //       // Setup our wireframe
  //       const wireframeGeometry = new THREE.WireframeGeometry(mesh.geometry);
  //       const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  //       const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

  //       wireframe.name = 'wireframe';
  //       child.add(wireframe);
  //     }
  //   });
  //   wireframe = true;
  // } else {
  //   // scene.remove(scene.getObjectByName('wireframe'));
  //   wireframe = false;
  // }
}

function logSceneObjects(object: any) {
  switch (object.type) {
    case 'Object3D':
      if (object.name.startsWith('FloorMesh:')) {
        // console.log('\t', object.name, object);
      } else {
        // console.log('\t', object.type, object.name, object);
      }
      break;

    case 'Mesh':
      if (object.name.startsWith('RoomMesh:')) {
        // console.log('\t\t', object.name, object);
        if (object.name == 'RoomMesh:0-4') {
          let geometry: THREE.BufferGeometry = object.geometry;
          // console.log('\t\t', geometry.name, geometry);

          // Add Wireframe
          const wireframeGeometry = new THREE.WireframeGeometry(geometry);
          const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
          const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

          wireframe.name = 'wireframe';
          object.add(wireframe);
        }
      } else {
        // console.log('\t', object.type, object.name, object);
      }
      break;

    case 'Group':
      // console.log('\t\t', object.type, object.name, object);
      break;

    case 'PerspectiveCamera':
      // console.log('PerspectiveCamera', object.type, object.name, object);
      break;

    case 'AmbientLight':
      // console.log('AmbientLight', object.type, object.name, object);
      break;

    case 'DirectionalLight':
      // console.log('DirectionalLight', object.type, object.name, object);
      break;

    default:
      // console.log('Unknown', object.type, object.name, object);
      break;
  }
}
