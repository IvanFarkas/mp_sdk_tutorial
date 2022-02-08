import { Scene, Object3D, Event, Mesh, BufferGeometry, MeshPhongMaterial } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

export default function ExportScene(scene: Scene) {
  //Export scene
  setTimeout(() => {
    let roomObject: Object3D<Event> | null = null;

    scene.traverse((object: Object3D<Event>) => {
      if (object.type === 'Object3D' && object.name.startsWith('ModelMesh')) {
        roomObject = object.clone();
      }
    });

    if (roomObject) {
      const convertedObject: Object3D<Event> = convertMPToThreeMesh(roomObject);

      exportToGLTF(convertedObject);
    }
  }, 3000);
}

function convertMPToThreeMesh(obj: Object3D<Event>): Mesh<BufferGeometry, MeshPhongMaterial> {
  const geometry = new BufferGeometry();

  obj.traverse((child: any) => {
    if (child.type === 'Mesh' && child.name.startsWith('RoomMesh')) {
      child.updateMatrix();
      geometry.merge(child.geometry, child.matrix);
    }
  });
  return new Mesh(geometry, new MeshPhongMaterial());
}

function exportToGLTF(input: Object3D<Event>) {
  const link = document.createElement('a');

  link.style.display = 'none';
  document.body.appendChild(link); // Firefox workaround, see #6594

  const save = (blob: any, filename: string) => {
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    // URL.revokeObjectURL( url ); breaks Firefox...
  };
  const saveString = (text: string, filename: string) => {
    save(new Blob([text], { type: 'text/plain' }), filename);
  };
  const saveArrayBuffer = (buffer: any, filename: string) => {
    save(new Blob([buffer], { type: 'application/octet-stream' }), filename);
  };
  const gltfExporter = new GLTFExporter();
  const options = {
    trs: false,
    onlyVisible: true,
    truncateDrawRange: true,
    binary: true,
    maxTextureSize: 1024
  };

  gltfExporter.parse(
    input,
    (result: object) => {
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
