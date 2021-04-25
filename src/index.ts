import * as THREE from 'three';
import * as restSamples from './rest';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';

// TODO: Fix to work like in Threejs-TS/src/client/client.ts line 6 - https://github.com/IvanFarkas/Threejs-TS/blob/dbb8bc6edde359d612a2b051c9b51b6e5ad8eefa/src/client/client.ts#L6
// import { GUI } from 'three/examples/jsm/libs/dat.gui.module'

// Read from .env file
const NodeEnv = process.env.NODE_ENV;
const ModelId = process.env.MODEL_ID;
const SdkKey = process.env.SDK_KEY;
const SdkVersion = process.env.SDK_VERSION; // https://matterport.github.io/showcase-sdk/sdk_release_notes.html

// augment window with the MP_SDK property
declare global {
  interface Window {
    MP_SDK: any;
  }
}

let _this: App;
let _showcase: HTMLIFrameElement;
let _window: Window;
let _sdk: any;
let _scene: any;
let _renderer: THREE.WebGLRenderer;
let _three: any;
let _stats: Stats;

class App {
  _hitCnt: any;
  _floors: any;
  _labels: any;
  _model: any;
  _snapshots: any;
  _modelDetails: any;
  _mattertag: any; // get a mattertag from the collection using: sdk.Mattertag.getData
  _cameraPose: any; // get pose using: sdk.Camera.pose.subscribe
  _animMixer: any;
  _clock: any;

  constructor() {
    this.config();
  }

  private config(): void {
    // Print environment variables
    console.log('NodeEnv:', NodeEnv);
    console.log('ModelId:', ModelId);
    console.log('SdkKey:', SdkKey);
    console.log('SdkVersion:', SdkVersion);

    // Set showcase IFrame attributes
    _showcase = <HTMLIFrameElement>document.getElementById('showcase');
    _showcase.src = `/bundle/showcase.html?m=${ModelId}&applicationKey=${SdkKey}&play=1&qs=1&log=0`;
    _showcase.width = '100%';
    _showcase.height = '100%';

    // const gui = new GUI();

    // Stats
    _stats = this.createStats(_showcase);

    // TODO: does it make sense to use in MP Shocase?
    // OrbitControls
    // const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
    // renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild(renderer.domElement);
    // const controls = new OrbitControls(camera, renderer.domElement);

    this.loadShowcase();
  }

  private async loadShowcase(this: App): Promise<void> {
    _this = this;
    _showcase.addEventListener('load', async () => {
      try {
        _window = _showcase.contentWindow;

        // using the latest server-side SDK version in the .connect function - https://matterport.github.io/showcase-sdk/sdk_release_notes.html
        _sdk = await _window.MP_SDK.connect(_showcase, SdkKey, SdkVersion);

        _this.navMesh();
        _this.getModelEvent();
        //_this.getCameraEvent();
        _this.getFloorEvent();
        _this.getSweepEvent();
        _this.getTourEvent();
        _this.getSensorEvent();
        _this.getRoomEvent();

        const moveToOptions = {
          rotation: { x: 0, y: 0 }, //x: 30, y: -45
          transition: _sdk.Sweep.Transition.INSTANT,
          transitionTime: 2000 // in milliseconds
        };

        console.log(_sdk);

        _this._clock = new THREE.Clock();

        _this.keyPressListener();
        _this.getAppState();
        _this.getTag();
        _this.getPose();
        _this.settings();
        _this.getModelDetails();
        _this.getLabels();
        _this.getTour();
        _this.getMattertag();
        _this.getZoom();
        // _this.getIntersection();
        // _this.moveTo();
        // await _this.glTFModel();

        await _this.scene();
        await _this.fbxModel();

        _this
          .restApiTest()
          .then((model: any) => {
            console.log('restApiTest');
          })
          .catch((error: any) => {
            console.error(error);
          });
      } catch (e) {
        console.error(e);
        return;
      }
    });
  }

  private createStats(iFarme: HTMLIFrameElement) {
    const stats = Stats();

    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0';
    stats.domElement.style.top = '0';

    // TODO: Make stats work. The scene is in the iframe. How do I get iframe stats in main browser window or showcase window?
    let showcaseDoc = iFarme.contentWindow.document;
    let statsDiv = showcaseDoc.body.appendChild(stats.domElement);

    return stats;
  }

  private async navMesh() {
    _scene = await _sdk.Scene.query(['scene']);
    console.log('scene:', _scene);
    this.toggleWireframe(_scene, true);
  }

  private toggleWireframe(scene: any, wireframe: boolean) {
    let children = scene[0].children;
    for (let i = 0; i < children.length; i++) {
      const child: any = children[i];
      console.log(child.type, child.name, child);

      let children2 = child.children;
      for (let j = 0; j < children2.length; j++) {
        this.logSceneObjects(children2[j]);

        let children3 = children2[j].children;
        for (let k = 0; k < children3.length; k++) {
          this.logSceneObjects(children3[k]);
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

  private logSceneObjects(object: any) {
    switch (object.type) {
      case 'Object3D':
        if (object.name.startsWith('FloorMesh:')) {
          console.log('\t', object.name, object);
        } else {
          console.log('\t', object.type, object.name, object);
        }
        break;

      case 'Mesh':
        if (object.name.startsWith('RoomMesh:')) {
          console.log('\t\t', object.name, object);
          if (object.name == 'RoomMesh:0-4') {
            let geometry: THREE.BufferGeometry = object.geometry;
            console.log('\t\t', geometry.name, geometry);

            // Add Wireframe
            const wireframeGeometry = new THREE.WireframeGeometry(geometry);
            const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
            const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

            wireframe.name = 'wireframe';
            object.add(wireframe);
          }
        } else {
          console.log('\t', object.type, object.name, object);
        }
        break;

      case 'Group':
        console.log('\t\t', object.type, object.name, object);
        break;

      case 'PerspectiveCamera':
        console.log('PerspectiveCamera', object.type, object.name, object);
        break;

      case 'AmbientLight':
        console.log('AmbientLight', object.type, object.name, object);
        break;

      case 'DirectionalLight':
        console.log('DirectionalLight', object.type, object.name, object);
        break;

      default:
        console.log('Unknown', object.type, object.name, object);
        break;
    }
  }

  private getModelEvent() {
    _this = this;
    _sdk.Model.getData()
      .then((model: any) => {
        _this._model = model;
        console.log(model);
      })
      .catch((error: any) => {
        console.error(error);
      });

    const callback = (object: any) => {
      console.log('is drone model?');
      console.log(object);
      console.log('Model loaded!');
    };

    // Start listening to the event.
    _sdk.on(_sdk.Model.Event.MODEL_LOADED, callback);

    // Stop listening to the event.
    //_sdk.off(_sdk.Model.Event.MODEL_LOADED, callback);
  }

  private getCameraEvent() {
    const callback = (object: any) => {
      console.log(object);
      console.log('Camera moved!');
    };

    _sdk.on(_sdk.Camera.Event.MOVE, callback);

    _sdk.Camera.pose.subscribe((pose: any) => {
      console.log('Camera', pose.position, pose.rotation, pose.sweep, pose.mode);
    });
  }

  private getFloorEvent() {
    _this = this;
    const callback = (object: any) => {
      console.log(object);
      console.log('Floor event!');
    };

    _sdk.on(_sdk.Floor.Event.CHANGE_START, callback);
    _sdk.on(_sdk.Floor.Event.CHANGE_END, callback);

    //TODO: not getting Flooor data
    // _sdk.Floor.data.subscribe({
    //   onAdded: (collection: any) => {
    //     console.log('Collection received. There are ', Object.keys(collection).length, 'Floors in the collection');
    //   }
    // });

    _sdk.Floor.getData()
      .then((floors: any) => {
        _this._floors = floors;
        console.log('Floor:', floors.currentFloor);
        console.log('Total floos:', floors.totalFloors);
        console.log('Name of first floor:', floors.floorNames[0]);
      })
      .catch((error: any) => {
        console.error('Floors data retrieval error.');
      });

    _sdk.Floor.current.subscribe((floor: any) => {
      if (floor.sequence === -1) {
        console.log('Viewing all floors');
      } else if (floor.sequence === undefined) {
        if (floor.id === undefined) {
          console.log('Viewing an unplaced unaligned sweep');
        } else {
          console.log('Transitioning between floors');
        }
      } else {
        console.log('Floor id:', floor.id);
        console.log('Floor index:', floor.sequence);

        //TODO: BUG: floor.name is empty
        //console.log('Floor name:', floor.name)
        console.log('Floor name:', _this._floors.floorNames[floor.sequence]);
      }
    });
  }

  private getSweepEvent() {
    _sdk.Sweep.current.subscribe((sweep: any) => {
      if (sweep.sid === '') {
        console.log('Not currently stationed at a sweep position');
      } else {
        console.log('Sweep sid:', sweep.sid);
        console.log('Sweep position:', sweep.position);
        console.log('Sweep on floor', sweep.floorInfo);
      }
    });

    _sdk.Sweep.data.subscribe({
      onAdded: (index: number, item: any, collection: any) => {
        // console.log('Sweep added to the collection', index, item, collection);
      },
      onRemoved: (index: number, item: any, collection: any) => {
        console.log('Sweep removed from the collection', index, item, collection);
      },
      onUpdated: (index: number, item: any, collection: any) => {
        console.log('Sweep updated in place in the collection', index, item, collection);
      },
      onCollectionUpdated: (collection: any) => {
        // console.log('Sweep entire up-to-date collection', collection);
      }
    });
  }

  private getTourEvent() {
    _sdk.on(_sdk.Tour.Event.STARTED, () => {
      console.log('Tour started');
    });
    _sdk.on(_sdk.Tour.Event.STEPPED, (index: any) => {
      console.log('Tour index:', index);
    });
    _sdk.on(_sdk.Tour.Event.STOPPED, () => {
      console.log('Tour stopped');
    });
    _sdk.on(_sdk.Tour.Event.ENDED, () => {
      console.log('Tour ended');
    });

    //TODO: Find a way to test if Tour exits
    if (false) {
      _sdk.Tour.getData()
        .then((tour: any) => {
          console.log('Tour has:', tour.length, 'stops');
          return _sdk.Tour.start(0);
        })
        .then(() => {
          // console 'Tour started'
          // console -> 'Tour index 0'
          return _sdk.Tour.next();
        })
        .then(() => {
          // console -> 'Tour index 1'
          return _sdk.Tour.step(3);
        })
        .then(() => {
          // console -> 'Tour index 3'
          return _sdk.Tour.prev();
        })
        .then(() => {
          // console -> 'Tour index 2'
          // console -> 'Tour stopped'
          return _sdk.Tour.stop();
        });
    }
  }

  private getSensorEvent() {
    //https://matterport.github.io/showcase-sdk/docs/sdk/reference/current/modules/sensor.html
    //TODO: Understand, implement. Looks very useful to set up space regions and anser inside, outside, near questions
  }

  private getRoomEvent() {
    //https://matterport.github.io/showcase-sdk/docs/sdk/reference/current/modules/room.html
    //TODO: tere is no Room in _sdk. What's showcase
    // showcase.Room.data.subscribe({
    // _sdk.Room.current.subscribe((room: any) => {
    //   if (room.id === '') {
    //     console.log('Not currently stationed at a room');
    //   } else {
    //     console.log('Room id:', room.id);
    //     console.log('Room size:', room.size);
    //     console.log('Room center:', room.center);
    //     console.log('Room bounds:', room.bounds);
    //     console.log('Room on floor', room.floorInfo);
    //   }
    // });
    // _sdk.Room.data.subscribe({
    //   onCollectionUpdated: (collection: any) => {
    //     console.log('Collection received. There are ', Object.keys(collection).length, 'rooms in the collection');
    //   }
    // });
  }

  private keyPressListener(): void {
    _this = this;
    _window.addEventListener('keydown', (e: any) => {
      var keyStr = ['Control', 'Shift', 'Alt', 'Meta'].includes(e.key) ? '' : e.key + ' ';
      var reportStr = 'The ' + (e.ctrlKey ? 'Control ' : '') + (e.shiftKey ? 'Shift ' : '') + (e.altKey ? 'Alt ' : '') + (e.metaKey ? 'Meta ' : '') + keyStr + 'key was pressed.';
      console.log(reportStr);

      //--- Was a Ctrl-Alt-E combo pressed?
      if (e.ctrlKey && e.altKey && e.key === 'e') {
        // case sensitive
        _this._hitCnt = (_this._hitCnt || 0) + 1;
        console.log(`cnt: ${_this._hitCnt}`);
      }

      if (!e.repeat) {
        switch (e.key) {
          case 'e':
            console.log(`Camera.rotate`);
            _sdk.Camera.rotate(10, 0, { speed: 10 })
              .then(() => {})
              .catch((error: any) => {});
            break;

          case 'q':
            console.log(`Camera.pan`);

            // TODO: did not pan
            _sdk.Camera.pan({ x: 1, z: 1 })
              .then(() => {})
              .catch((error: any) => {});
            break;

          case 't':
            var sweepId = _this._model.sweeps[1].uuid;
            var moveToOptions = {
              rotation: { x: 0, y: 0 }, //x: 30, y: -45
              transition: _sdk.Sweep.Transition.INSTANT,
              transitionTime: 2000 // in milliseconds
            };

            this.moveToSweep(sweepId, moveToOptions);
            break;

          case 'm':
            console.log(`Camera.lookAtScreenCoords`);
            _sdk.Camera.lookAtScreenCoords(500, 320)
              .then(() => {})
              .catch((error: any) => {});
            break;

          case 'z':
            console.log(`Camera.zoomBy`);

            _sdk.Camera.zoomBy(0.1).then((newZoom: any) => {
              console.log('Camera zoomed to', newZoom);
            });
            // sdk.Camera.zoomTo(2.0).then((newZoom: any) => { console.log('Camera zoomed to', newZoom); });
            break;

          default:
            console.log(`Key "${e.key}" pressed  [event: keydown]`);
            break;
        }
      } else {
        console.log(`Key "${e.key}" repeating  [event: keydown]`);
      }

      e.stopPropagation();
      e.preventDefault();
    });
  }

  private getAppState() {
    _sdk.App.state.subscribe((appState: any) => {
      // app state has changed
      console.log('Application: ', appState.application);
      console.log('Loaded at: ', appState.phaseTimes[_sdk.App.Phase.LOADING]);
      console.log('Started at: ', appState.phaseTimes[_sdk.App.Phase.STARTING]);

      switch (appState.phase) {
        case _sdk.App.Phase.LOADING:
          console.log('Phase: ', appState.phase);
          break;

        case _sdk.App.Phase.STARTING:
          console.log('Phase: ', appState.phase);
          break;

        case _sdk.App.Phase.PLAYING:
          console.log('Phase: ', appState.phase);
          break;

        case _sdk.App.Phase.UNINITIALIZED:
          console.log('Phase: ', appState.phase);
          break;

        case _sdk.App.Phase.WAITING:
          console.log('Phase: ', appState.phase);
          break;

        case _sdk.App.Phase.ERROR:
          console.log('Phase: ', appState.phase);
          break;
      }
    });
  }

  private settings() {
    _sdk.Settings.update('labels', true)
      .then((data: any) => {
        console.log('Labels setting: ' + data);
      })
      .catch((error: any) => {});

    _sdk.Settings.get('labels')
      .then((data: any) => {
        console.log(`Labels setting: ${data}`);
      })
      .catch((error: any) => {});

    _sdk.Settings.update('param1', 'param 1')
      .then((data: any) => {
        console.log('Labels setting: ' + data);
      })
      .catch((error: any) => {});

    _sdk.Settings.get('param1')
      .then((data: any) => {
        console.log(`Labels setting: ${data}`);
      })
      .catch((error: any) => {});

    // sdk.Pointer.intersection.subscribe((intersectionData: any) => {
  }

  private getTag() {
    _sdk.Mattertag.add([
      {
        label: 'tag01',
        description: 'Tag 01',
        anchorPosition: { x: 0, y: 0, z: 0 },
        // make the Mattertag stick straight up and make it 0.30 meters (~1 foot) tall
        stemVector: { x: 0, y: 0.3, z: 0 },
        // blue disc
        color: { r: 0.0, g: 0.0, b: 1.0 },
        floorId: 0 // optional, if not specified the sdk will provide an estimate of the floor id for the anchor position provided.
      }
    ]);
  }

  private getPose() {
    let currentSweep = '';
    _this = this;

    _sdk.Camera.pose.subscribe((pose: any) => {
      // Changes to the Camera pose have occurred.
      _this._cameraPose = pose;
      if (pose.sweep != currentSweep && pose.sweep != undefined) {
        console.log(pose);
      }
      currentSweep = pose.sweep;
    });
  }

  private getLabels(): void {
    _this = this;
    _sdk.Label.getData()
      .then((labels: any) => {
        _this._labels = labels;
        console.log('Labels:');
        console.log(labels);
      })
      .catch((error: any) => {
        console.error(error);
      });
  }

  private getMattertag(): void {
    _sdk.Mattertag.getData()
      .then((mattertags: any) => {
        console.log('Mattertags:');
        console.log(mattertags);
      })
      .catch((error: any) => {
        console.error(error);
      });
  }

  private getModelDetails(): void {
    _this = this;
    _sdk.Model.getDetails()
      .then((modelDetails: any) => {
        _this._modelDetails = modelDetails;
        console.log(modelDetails);
      })
      .catch((error: any) => {
        console.error(error);
      });
  }

  private getTour(): void {
    _this = this;
    _sdk.Tour.getData()
      .then((snapshots: any) => {
        _this._snapshots = snapshots;
        console.log('Tour snapshots:');
        console.log(snapshots);
      })
      .catch((error: any) => {
        if (error == 'No tour data found') {
          console.info(error);
        } else {
          console.error(error);
        }
      });
  }

  private getZoom() {
    _sdk.Camera.zoom.subscribe((zoom: any) => {
      console.log('Zoom: ', zoom.level);
    });
  }

  private getIntersection() {
    _sdk.Pointer.intersection.subscribe((intersectionData: any) => {
      console.log('Intersection position:', intersectionData.position);
      console.log('Intersection normal:', intersectionData.normal);
    });
  }

  private moveTo(): void {
    const mode = _sdk.Mode.Mode.FLOORPLAN;
    const position = { x: 0, y: 0, z: 0 };
    const rotation = { x: -90, y: 0 };
    const transition = _sdk.Mode.TransitionType.FLY;
    const zoom = 5;

    _sdk.Mode.moveTo(mode, {
      position: position,
      rotation: rotation,
      transition: transition,
      zoom
    })
      .then((nextMode: any) => {
        console.log(`View mode: ${nextMode}`);
      })
      .catch((error: any) => {
        console.error(error);
      });
  }

  private moveToSweep(sweepId: any, moveToOptions: any): void {
    _sdk.Sweep.moveTo(sweepId, moveToOptions)
      .then((sweepId: any) => {
        console.log(`Arrived at sweep ${sweepId}`);
      })
      .catch((error: any) => {
        console.error(error);
      });
  }

  private async scene() {
    await _sdk.Scene.configure((renderer: THREE.WebGLRenderer, three: any, effectComposer: any) => {
      _renderer = renderer;
      _three = three;

      // configure PBR
      renderer.physicallyCorrectLights = true;

      // configure shadow mapping
      renderer.shadowMap.enabled = true;
      //renderer.shadowMap.bias = 0.0001;
      renderer.shadowMap.type = three.PCFSoftShadowMap;

      if (effectComposer) {
        // add a custom pass here
      }
    });
  }

  private async light() {
    // Setup your scene - https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_models.html#setup-your-scene
    const lights = await _sdk.Scene.createNode();
    // var initial = {
    //   enabled: true,
    //   color: { r: 0.2, g: 0.2, b: 0.2 },
    //   intensity: 0.8,
    // };
    // var initial = {
    //   enabled: false,
    //   debug: false,
    //   intensity: 0.8,
    //   color: { r: 0, g: 1, b: 0 },
    //   position: { x: 0, y: 1, z: 0 },
    //   target: { x: 0, y: 0, z: 0 },
    // };

    // node.addComponent('mp.ambientLight', initial);
    // node.addComponent('mp.directionalLight', initial);
    lights.addComponent('mp.lights');
    lights.start();
  }

  private async fbxModel() {
    await this.light();

    // Add component to the scene node - https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_models.html#add-your-component-to-the-scene-node
    const modelNode = await _sdk.Scene.createNode();
    //const url = 'https://gitcdn.link/repo/mrdoob/three.js/dev/examples/models/fbx/stanford-bunny.fbx';
    //const url = 'http://localhost:8000/assets/models/parrot_bebop_droneB.fbx';
    const url = 'http://localhost:8000/assets/models/tester.fbx';
    //const url = 'http://localhost:8000/assets/models/parrot_bebop_droneAnimated6.fbx';
    const initial = {
      url: url,
      visible: true,
      localPosition: { x: 0, y: -1.72, z: 0 },
      localRotation: { x: 0, y: -90, z: 0 }
      // localScale: { x: 1, y: 1, z: 1 },
    };

    // Store the fbx component since we will need to adjust it in the next step.
    const component = modelNode.addComponent(_sdk.Scene.Component.FBX_LOADER, initial);

    // Scale model - https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_models.html#scale-your-model
    // component.inputs.localScale = { x: 0.00002, y: 0.00002, z: 0.00002 };

    // Position model within view - https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_models.html#position-your-model-within-view
    // modelNode.obj3D.position.set(0, -1.2, 0); // drop ~3 feet

    // TODO: Question: How do I attach standard events to objects created with createNode()?

    // Start it - https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_models.html#start-it
    // Scene Nodes - https://matterport.github.io/showcase-sdk/sdkbundle_architecture.html#scene-nodes
    // modelNode.obj3D.children[0].animations[0].play()

    modelNode.start();

    setTimeout(() => {
      const model = modelNode.obj3D.children[0].children[0]; // TODO: please explain in comment what .children[0].children[0] is and provide links to resources
      const mixer = new THREE.AnimationMixer(model);
      _this._animMixer = mixer;
      const animationWalk = model.animations[4]; // Walk
      const action = mixer.clipAction(animationWalk);
      action.play();

      const animCtrlDiv = document.createElement('div');
      animCtrlDiv.style.position = 'absolute';
      animCtrlDiv.style.top = '200px';
      animCtrlDiv.style.right = '10px';
      animCtrlDiv.style.zIndex = '999';
      animCtrlDiv.style.display = 'flex';
      animCtrlDiv.style.flexDirection = 'column';
      document.body.appendChild(animCtrlDiv);

      for (let i in model.animations) {
        const animation = model.animations[i];
        const animButton = document.createElement('button');
        animButton.style.height = '40px';
        animButton.innerText = model.animations[i].name;

        animButton.addEventListener('click', (e) => {
          // Stop all animations
          for (let k in model.animations) {
            const animation = model.animations[k];
            _this._animMixer.clipAction(animation).stop();
          }

          // Start animation
          const action = _this._animMixer.clipAction(animation);
          action.play();
        });
        animCtrlDiv.appendChild(animButton);
      }
    }, 2000);

    // Animate it - https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_models.html#animate-it
    const tick = () => {
      requestAnimationFrame(tick);
      if (_this._animMixer) {
        _this._animMixer.update(_this._clock.getDelta());
      }
    };
    tick();
  }

  // TODO: Error: TransformControls: The attached 3D object must be a part of the scene graph.
  private async transform() {
    this.light();

    const url = 'https://github.com/CesiumGS/cesium/blob/master/Apps/SampleData/models/CesiumDrone/CesiumDrone.glb?raw=true'; //https://github.com/CesiumGS/cesium/blob/master/Apps/SampleData/models/CesiumMan/Cesium_Man.glb?raw=true
    const initial = {
      url: url,
      visible: true,
      localPosition: { x: -0.3, y: -1, z: 0.3 },
      localRotation: { x: 0, y: 0, z: 0 },
      localScale: { x: 0.2, y: 0.2, z: 0.2 }
    };

    // Create a scene node with a model component.
    // This node's transform will be changed by the transform control.
    const modelNode = await _sdk.Scene.createNode();
    const component = modelNode.addComponent(_sdk.Scene.Component.GLTF_LOADER, initial);
    modelNode.start();

    // // Create a scene node with a transform control component.
    // const node = await sdk.Scene.createNode();
    // const myControl = node.addComponent(sdk.Scene.Component.TRANSFORM_CONTROLS);
    // node.start();

    // // Make the transform control visible so that the user can manipulate the control selection.
    // myControl.inputs.visible = true;

    // // Attach the model to the transform control
    // myControl.inputs.selection = modelNode;

    // // set 'translate' mode to position the selection.
    // myControl.inputs.mode = 'translate';
  }

  private async glTFModel() {
    this.light();

    // Model
    const modelNode = await _sdk.Scene.createNode();
    // const url = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/2CylinderEngine/glTF-Draco/2CylinderEngine.gltf";
    const url = 'http://localhost:8000/assets/models/tester.gltf';

    const initial = {
      url: url,
      visible: true,
      // localScale: { x: 5, y: 5, z: 5 },
      localPosition: { x: 0.1, y: 0, z: 0 }
      // localRotation: { x: 0, y: -130, z: 0 },
    };

    const component = modelNode.addComponent(_sdk.Scene.Component.GLTF_LOADER, initial);

    // Transform Control
    // Create a scene node with a transform control component.
    const node = await _sdk.Scene.createNode();
    node.start();

    // const myControl = node.addComponent(
    //   _sdk.Scene.Component.TRANSFORM_CONTROLS
    // );

    // // Make the transform control visible so that the user can manipulate the control selection.
    // myControl.inputs.visible = true;

    // // Attach the model to the transform control
    // myControl.inputs.selection = modelNode;

    // // set 'translate' mode to position the selection.
    // myControl.inputs.mode = "translate";
  }

  private getMeasurements() {
    _sdk.Measurements.data.subscribe({
      onAdded: (index: any, item: any, collection: any) => {
        console.log('item added to the collection', index, item, collection);
      },
      onRemoved: (index: any, item: any, collection: any) => {
        console.log('item removed from the collection', index, item, collection);
      },
      onUpdated: (index: any, item: any, collection: any) => {
        console.log('item updated in place in the collection', index, item, collection);
      }
    });

    _sdk.Measurements.mode.subscribe((measurementModeState: any) => {
      console.log('isActive? ', measurementModeState.active);
    });

    // var screenCoordinate = sdk.Conversion.worldToScreen(mattertag.anchorPosition, cameraPose, showcaseSize)
  }

  private async restApiTest() {
    await restSamples.run();
  }
}

export default new App();
