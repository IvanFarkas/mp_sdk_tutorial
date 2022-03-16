import * as THREE from 'three';
import * as restSamples from './rest';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import ExportScene from './core/ExportScene';
import ToggleWireframe from './core/ToggleWireframe';
import NavigationSystem from './core/NavigationSystem';

// TODO: Fix to work like in Threejs-TS/src/client/client.ts line 6 - https://github.com/IvanFarkas/Threejs-TS/blob/dbb8bc6edde359d612a2b051c9b51b6e5ad8eefa/src/client/client.ts#L6
// import { GUI } from 'three/examples/jsm/libs/dat.gui.module'

// Read from .env file
const NodeEnv = process.env.NODE_ENV;
const PORT = process.env.PORT;
const ModelId = process.env.MODEL_ID;
const SdkKey = process.env.SDK_KEY;
const SdkVersion = process.env.SDK_VERSION; // https://matterport.github.io/showcase-sdk/sdk_release_notes.html

// augment window with the MP_SDK property
declare global {
  interface Window {
    MP_SDK: any;
  }
}

class App {
  window: Window;
  showcaseElement: HTMLIFrameElement;
  sdk: any;
  mpFloors: any;
  mpLabels: any;
  mpModel: any;
  mpSnapshots: any;
  mpModelDetails: any;
  mpCameraPose: any; // get pose using: sdk.Camera.pose.subscribe
  threeScene: THREE.Scene;
  threeStats: any;
  threeRenderer: THREE.WebGLRenderer;
  threeClock: any;
  threeAnimMixer: any;
  intersectPoint: THREE.Vector3;
  playerNode: any;
  navigationSystem: NavigationSystem;

  constructor() {
    // Print environment variables
    console.log('NodeEnv:', NodeEnv);
    console.log('Port:', PORT);
    console.log('ModelId:', ModelId);
    console.log('SdkKey:', SdkKey);
    console.log('SdkVersion:', SdkVersion);

    // Set showcase IFrame attributes
    this.showcaseElement = <HTMLIFrameElement>(
      document.getElementById('showcase')
    );
    this.showcaseElement.src = `/bundle/showcase.html?m=${ModelId}&applicationKey=${SdkKey}&play=1&qs=1&log=0`;
    this.showcaseElement.width = '100%';
    this.showcaseElement.height = '100%';

    this.threeStats = this.createStats(this.showcaseElement);
    this.threeClock = new THREE.Clock();
    this.intersectPoint = new THREE.Vector3();

    this.loadShowcase();
  }

  private async loadShowcase(this: App): Promise<void> {
    this.showcaseElement.addEventListener('load', async () => {
      try {
        this.window = this.showcaseElement.contentWindow;
        // using the latest server-side SDK version in the .connect function - https://matterport.github.io/showcase-sdk/sdk_release_notes.html
        this.sdk = await this.window.MP_SDK.connect(
          this.showcaseElement,
          SdkKey,
          SdkVersion
        );
        console.log('SDK :', this.sdk);

        const scenes = await this.sdk.Scene.query(['scene']);
        this.threeScene = scenes[0];

        await this.configScene();

        this.addLights();

        this.getModelEvent();
        this.getCameraEvent();
        this.getFloorEvent();
        this.getSweepEvent();
        this.getTourEvent();
        this.getSensorEvent();
        this.getRoomEvent();

        this.keyPressListener();
        this.getAppState();
        this.getTag();
        this.getPose();
        this.settings();
        this.getModelDetails();
        this.getLabels();
        this.getTour();
        this.getMattertag();
        this.getZoom();
        this.getIntersection();
        // this.moveMPCamera();

        // ToggleWireframe(this.threeScene, true);
        // ExportScene(this.threeScene);

        this.addGLTFModel();
        this.addFBXModel();
        this.addNavMesh();

        // this.restApiTest()
        //   .then((model: any) => {
        //     console.log('restApiTest');
        //   })
        //   .catch((error: any) => {
        //     console.error(error);
        //   });
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

  private getModelEvent() {
    this.sdk.Model.getData()
      .then((model: any) => {
        this.mpModel = model;
        console.log('Model', model);
      })
      .catch((error: any) => {
        console.error(error);
      });

    const callback = (object: any) => {
      console.log('>>> New model');
      console.log(object);
      console.log('>>> New model was loaded!');
    };

    // Start listening to the event.
    this.sdk.on(this.sdk.Model.Event.MODEL_LOADED, callback);

    // Stop listening to the event.
    //this.sdk.off(this.sdk.Model.Event.MODEL_LOADED, callback);
  }

  private getCameraEvent() {
    const callback = (object: any) => {
      // console.log(object);
      // console.log('Camera moved!');
    };

    this.sdk.on(this.sdk.Camera.Event.MOVE, callback);

    this.sdk.Camera.pose.subscribe((pose: any) => {
      // console.log('Camera', pose.position, pose.rotation, pose.sweep, pose.mode);
    });
  }

  private getFloorEvent() {
    const callback = (object: any) => {
      console.log(object);
      console.log('Floor event!');
    };

    this.sdk.on(this.sdk.Floor.Event.CHANGE_START, callback);
    this.sdk.on(this.sdk.Floor.Event.CHANGE_END, callback);

    //TODO: not getting Flooor data
    // this.sdk.Floor.data.subscribe({
    //   onAdded: (collection: any) => {
    //     console.log('Collection received. There are ', Object.keys(collection).length, 'Floors in the collection');
    //   }
    // });

    this.sdk.Floor.getData()
      .then((floors: any) => {
        this.mpFloors = floors;
        console.log('Floor:', floors.currentFloor);
        console.log('Total floos:', floors.totalFloors);
        console.log('Name of first floor:', floors.floorNames[0]);
      })
      .catch((error: any) => {
        console.error('Floors data retrieval error.');
      });

    this.sdk.Floor.current.subscribe((floor: any) => {
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
        console.log('Floor name:', this.mpFloors.floorNames[floor.sequence]);
      }
    });
  }

  private getSweepEvent() {
    this.sdk.Sweep.current.subscribe((sweep: any) => {
      if (sweep.sid === '') {
        console.log('Not currently stationed at a sweep position');
      } else {
        console.log('Sweep sid:', sweep.sid);
        console.log('Sweep position:', sweep.position);
        console.log('Sweep on floor', sweep.floorInfo);
      }
    });

    this.sdk.Sweep.data.subscribe({
      onAdded: (index: number, item: any, collection: any) => {
        // console.log('Sweep added to the collection', index, item, collection);
      },
      onRemoved: (index: number, item: any, collection: any) => {
        console.log(
          'Sweep removed from the collection',
          index,
          item,
          collection
        );
      },
      onUpdated: (index: number, item: any, collection: any) => {
        console.log(
          'Sweep updated in place in the collection',
          index,
          item,
          collection
        );
      },
      onCollectionUpdated: (collection: any) => {
        // console.log('Sweep entire up-to-date collection', collection);
      },
    });
  }

  private getTourEvent() {
    this.sdk.on(this.sdk.Tour.Event.STARTED, () => {
      console.log('Tour started');
    });
    this.sdk.on(this.sdk.Tour.Event.STEPPED, (index: any) => {
      console.log('Tour index:', index);
    });
    this.sdk.on(this.sdk.Tour.Event.STOPPED, () => {
      console.log('Tour stopped');
    });
    this.sdk.on(this.sdk.Tour.Event.ENDED, () => {
      console.log('Tour ended');
    });

    //TODO: Find a way to test if Tour exits
    if (false) {
      this.sdk.Tour.getData()
        .then((tour: any) => {
          console.log('Tour has:', tour.length, 'stops');
          return this.sdk.Tour.start(0);
        })
        .then(() => {
          // console 'Tour started'
          // console -> 'Tour index 0'
          return this.sdk.Tour.next();
        })
        .then(() => {
          // console -> 'Tour index 1'
          return this.sdk.Tour.step(3);
        })
        .then(() => {
          // console -> 'Tour index 3'
          return this.sdk.Tour.prev();
        })
        .then(() => {
          // console -> 'Tour index 2'
          // console -> 'Tour stopped'
          return this.sdk.Tour.stop();
        });
    }
  }

  private getSensorEvent() {
    //https://matterport.github.io/showcase-sdk/docs/sdk/reference/current/modules/sensor.html
    //TODO: Understand, implement. Looks very useful to set up space regions and anser inside, outside, near questions
  }

  private getRoomEvent() {
    //https://matterport.github.io/showcase-sdk/docs/sdk/reference/current/modules/room.html
    //TODO: tere is no Room in this.sdk. What's showcase
    // showcase.Room.data.subscribe({
    // this.sdk.Room.current.subscribe((room: any) => {
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
    // this.sdk.Room.data.subscribe({
    //   onCollectionUpdated: (collection: any) => {
    //     console.log('Collection received. There are ', Object.keys(collection).length, 'rooms in the collection');
    //   }
    // });
  }

  private keyPressListener(): void {
    this.window.addEventListener('keydown', (e: any) => {
      var keyStr = ['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)
        ? ''
        : e.key + ' ';
      var reportStr =
        'The ' +
        (e.ctrlKey ? 'Control ' : '') +
        (e.shiftKey ? 'Shift ' : '') +
        (e.altKey ? 'Alt ' : '') +
        (e.metaKey ? 'Meta ' : '') +
        keyStr +
        'key was pressed.';
      console.log(reportStr);

      //--- Was a Ctrl-Alt-E combo pressed?
      if (e.ctrlKey && e.altKey && e.key === 'e') {
        // case sensitive
      }

      if (!e.repeat) {
        switch (e.key) {
          case 'e':
            console.log(`Camera.rotate`);
            this.sdk.Camera.rotate(10, 0, { speed: 10 })
              .then(() => {})
              .catch((error: any) => {});
            break;

          case 'q':
            console.log(`Camera.pan`);

            // TODO: did not pan
            this.sdk.Camera.pan({ x: 1, z: 1 })
              .then(() => {})
              .catch((error: any) => {});
            break;

          case 't':
            var sweepId = this.mpModel.sweeps[1].uuid;
            var moveToOptions = {
              rotation: { x: 0, y: 0 }, //x: 30, y: -45
              transition: this.sdk.Sweep.Transition.INSTANT,
              transitionTime: 2000, // in milliseconds
            };

            this.moveToSweep(sweepId, moveToOptions);
            break;

          case 'm':
            console.log(`Camera.lookAtScreenCoords`);
            this.sdk.Camera.lookAtScreenCoords(500, 320)
              .then(() => {})
              .catch((error: any) => {});
            break;

          case 'z':
            console.log(`Camera.zoomBy`);

            this.sdk.Camera.zoomBy(0.1).then((newZoom: any) => {
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
    this.sdk.App.state.subscribe((appState: any) => {
      // app state has changed
      console.log('Application: ', appState.application);
      console.log(
        'Loaded at: ',
        appState.phaseTimes[this.sdk.App.Phase.LOADING]
      );
      console.log(
        'Started at: ',
        appState.phaseTimes[this.sdk.App.Phase.STARTING]
      );

      switch (appState.phase) {
        case this.sdk.App.Phase.LOADING:
          console.log('Phase: ', appState.phase);
          break;

        case this.sdk.App.Phase.STARTING:
          console.log('Phase: ', appState.phase);
          break;

        case this.sdk.App.Phase.PLAYING:
          console.log('Phase: ', appState.phase);
          break;

        case this.sdk.App.Phase.UNINITIALIZED:
          console.log('Phase: ', appState.phase);
          break;

        case this.sdk.App.Phase.WAITING:
          console.log('Phase: ', appState.phase);
          break;

        case this.sdk.App.Phase.ERROR:
          console.log('Phase: ', appState.phase);
          break;
      }
    });
  }

  private settings() {
    this.sdk.Settings.update('labels', true)
      .then((data: any) => {
        console.log('Labels setting: ' + data);
      })
      .catch((error: any) => {});

    this.sdk.Settings.get('labels')
      .then((data: any) => {
        console.log(`Labels setting: ${data}`);
      })
      .catch((error: any) => {});

    this.sdk.Settings.update('param1', 'param 1')
      .then((data: any) => {
        console.log('Labels setting: ' + data);
      })
      .catch((error: any) => {});

    this.sdk.Settings.get('param1')
      .then((data: any) => {
        console.log(`Labels setting: ${data}`);
      })
      .catch((error: any) => {});

    // sdk.Pointer.intersection.subscribe((intersectionData: any) => {
  }

  private getTag() {
    this.sdk.Mattertag.add([
      {
        label: 'tag01',
        description: 'Tag 01',
        anchorPosition: { x: 0, y: 0, z: 0 },
        // make the Mattertag stick straight up and make it 0.30 meters (~1 foot) tall
        stemVector: { x: 0, y: 0.3, z: 0 },
        // blue disc
        color: { r: 0.0, g: 0.0, b: 1.0 },
        floorId: 0, // optional, if not specified the sdk will provide an estimate of the floor id for the anchor position provided.
      },
    ]);
  }

  private getPose() {
    let currentSweep = '';

    this.sdk.Camera.pose.subscribe((pose: any) => {
      // Changes to the Camera pose have occurred.
      this.mpCameraPose = pose;
      if (pose.sweep != currentSweep && pose.sweep != undefined) {
        console.log('Pose :', pose);
      }
      currentSweep = pose.sweep;
    });
  }

  private getLabels(): void {
    this.sdk.Label.getData()
      .then((labels: any) => {
        this.mpLabels = labels;
        console.log('Labels:');
        console.log(labels);
      })
      .catch((error: any) => {
        console.error(error);
      });
  }

  private getMattertag(): void {
    this.sdk.Mattertag.getData()
      .then((mattertags: any) => {
        console.log('Mattertags:');
        console.log(mattertags);
      })
      .catch((error: any) => {
        console.error(error);
      });
  }

  private getModelDetails(): void {
    this.sdk.Model.getDetails()
      .then((modelDetails: any) => {
        this.mpModelDetails = modelDetails;
        console.log('ModelDetails:', modelDetails);
      })
      .catch((error: any) => {
        console.error(error);
      });
  }

  private getTour(): void {
    this.sdk.Tour.getData()
      .then((snapshots: any) => {
        this.mpSnapshots = snapshots;
        console.log('Tour snapshots:', snapshots);
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
    this.sdk.Camera.zoom.subscribe((zoom: any) => {
      // console.log('Zoom: ', zoom.level);
    });
  }

  private getIntersection() {
    this.sdk.Pointer.intersection.subscribe((intersectionData: any) => {
      // console.log('Intersection', intersectionData.position);
      this.intersectPoint = intersectionData.position;
    });
  }

  private moveMPCamera(): void {
    const mode = this.sdk.Mode.Mode.FLOORPLAN;
    const position = { x: 0, y: 0, z: 0 };
    const rotation = { x: -90, y: 0 };
    const transition = this.sdk.Mode.TransitionType.FLY;
    const zoom = 5;

    this.sdk.Mode.moveMPCamera(mode, {
      position: position,
      rotation: rotation,
      transition: transition,
      zoom,
    })
      .then((nextMode: any) => {
        console.log(`View mode: ${nextMode}`);
      })
      .catch((error: any) => {
        console.error(error);
      });
  }

  private moveToSweep(sweepId: any, moveToOptions: any): void {
    this.sdk.Sweep.moveMPCamera(sweepId, moveToOptions)
      .then((sweepId: any) => {
        console.log(`Arrived at sweep ${sweepId}`);
      })
      .catch((error: any) => {
        console.error(error);
      });
  }

  private async configScene() {
    await this.sdk.Scene.configure(
      (renderer: THREE.WebGLRenderer, three: any, effectComposer: any) => {
        this.threeRenderer = renderer;

        // configure PBR
        renderer.physicallyCorrectLights = true;

        // configure shadow mapping
        renderer.shadowMap.enabled = true;
        //renderer.shadowMap.bias = 0.0001;
        renderer.shadowMap.type = three.PCFSoftShadowMap;

        if (effectComposer) {
          // add a custom pass here
        }
      }
    );
  }

  private async addLights() {
    // Setup your scene - https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_models.html#setup-your-scene
    const lights = await this.sdk.Scene.createNode();
    {
      const initial = {
        enabled: true,
        color: { r: 0.85, g: 0.9, b: 0.97 },
        intensity: 1.5,
      };
      lights.addComponent('mp.ambientLight', initial);
    }
    {
      const initial = {
        enabled: true,
        debug: false,
        intensity: 2,
        color: { r: 1, g: 1, b: 1 },
        position: { x: -0.2, y: 1, z: -0.1 },
        target: { x: 0, y: 0, z: 0 },
      };
      lights.addComponent('mp.directionalLight', initial);
    }

    // {
    //   lights.addComponent('mp.lights');
    // }

    lights.start();
  }

  private async addTransformControlToNode(iNode: any) {
    // Transform Control
    // https://matterport.github.io/showcase-sdk/sdkbundle_components_transformcontrols.html
    const node = await this.sdk.Scene.createNode();
    const myControl = node.addComponent('mp.transformControls');
    node.start();

    // Make the transform control visible so that the user can manipulate the control selection.
    myControl.inputs.visible = true;
    // Attach the model to the transform control
    myControl.inputs.selection = iNode;
    // set 'translate' mode to position the selection.
    myControl.inputs.mode = 'translate';
  }

  private async addFBXModel() {
    // Add component to the scene node - https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_models.html#add-your-component-to-the-scene-node
    const modelNode = await this.sdk.Scene.createNode();
    this.playerNode = modelNode;
    // this.addTransformControlToNode(modelNode);

    const initial = {
      url: `http://localhost:${PORT}/assets/models/actor.fbx`,
      visible: true,
      localPosition: { x: 0, y: 0, z: 0 },
      localRotation: { x: 0, y: -90, z: 0 },
      localScale: { x: 1, y: 1, z: 1 },
    };

    // Store the fbx component since we will need to adjust it in the next step.
    const component = modelNode.addComponent('mp.fbxLoader', initial);

    // Scale model - https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_models.html#scale-your-model
    // component.inputs.localScale = { x: 0.00002, y: 0.00002, z: 0.00002 };

    // Position model within view - https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_models.html#position-your-model-within-view
    // modelNode.obj3D.position.set(0, -1.2, 0); // drop ~3 feet

    // TODO: Question: How do I attach standard events to objects created with createNode()?

    // Start it - https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_models.html#start-it
    // Scene Nodes - https://matterport.github.io/showcase-sdk/sdkbundle_architecture.html#scene-nodes
    // modelNode.obj3D.children[0].animations[0].play()

    modelNode.position.set(0, -1.72, 0);
    modelNode.start();

    setTimeout(() => {
      const model = modelNode.obj3D.children[0].children[0]; // TODO: please explain in comment what .children[0].children[0] is and provide links to resources
      const mixer = new THREE.AnimationMixer(model);
      this.threeAnimMixer = mixer;
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
            this.threeAnimMixer.clipAction(animation).stop();
          }

          // Start animation
          const action = this.threeAnimMixer.clipAction(animation);
          action.play();
        });
        animCtrlDiv.appendChild(animButton);
      }

      // Waypoint controller
      const waypointDiv = document.createElement('div');
      waypointDiv.style.position = 'absolute';
      waypointDiv.style.top = '10px';
      waypointDiv.style.right = '10px';
      waypointDiv.style.zIndex = '999';
      waypointDiv.style.display = 'flex';
      waypointDiv.style.flexDirection = 'column';
      document.body.appendChild(waypointDiv);

      const waypoints = [
        new THREE.Vector3(3.37, -1.66, 2.69),
        new THREE.Vector3(6.3, 1.76, 9.87),
        new THREE.Vector3(-1.42, 1.73, 5.61),
      ];

      for (let i in waypoints) {
        const waypoint = waypoints[i];
        const button = document.createElement('button');
        button.style.height = '40px';
        button.innerText = 'Point ' + i;

        function moveToWaypoint() {
          this.intersectPoint = waypoint;
          this.navigationSystem.moveTo(waypoint);
        }

        button.addEventListener('click', moveToWaypoint.bind(this));
        waypointDiv.appendChild(button);
      }
    }, 2000);

    // Animate it - https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_models.html#animate-it
    const tick = () => {
      requestAnimationFrame(tick);
      if (this.threeAnimMixer) {
        this.threeAnimMixer.update(this.threeClock.getDelta());
      }
    };
    tick();
  }

  private async addGLTFModel() {
    // Model
    const node = await this.sdk.Scene.createNode();
    this.addTransformControlToNode(node);

    const initial = {
      url: `http://localhost:${PORT}/assets/models/SheenChair.glb`,
      // visible: true,
      // localScale: { x: 1, y: 1, z: 1 },
      // localPosition: { x: 0, y: 0, z: 0 },
      // localRotation: { x: 0, y: 0, z: 0 }
    };
    const component = node.addComponent('mp.gltfLoader', initial);
    node.position.set(1, -1.5, 0.7);
    node.start();
  }

  private async addNavMesh() {
    // Model
    // const node = await this.sdk.Scene.createNode();
    // const initial = {
    //   url: `http://localhost:${PORT}/assets/models/navMeshes/navMesh.glb`,
    //   visible: true
    // };
    // const component = node.addComponent(this.sdk.Scene.Component.GLTF_LOADER, initial);
    // node.start();
    // setTimeout(() => {
    //   node.obj3D.traverse((child: any) => {
    //     if (child.type === 'Mesh') {
    //       //Create NavigationSystem
    //       child.material.color.set("#ff00ff")
    //       child.material.transparent = true
    //       child.material.opacity = 0.4
    //       child.material.needsUpdate = true
    //       child.position.y = 0.2
    //       const navSystem = new NavigationSystem(this.threeClock, this.intersectPoint, this.threeScene, child, this.playerNode, this.showcaseElement);
    //     }
    //   });
    // }, 2000);

    const loader = new GLTFLoader();
    loader.load(
      `http://localhost:${PORT}/assets/models/navMeshes/navMesh.glb`,
      function (gltf: any) {
        gltf.scene.traverse((child: any) => {
          if (child.type === 'Mesh') {
            //Create NavigationSystem
            this.navigationSystem = new NavigationSystem(
              this.threeClock,
              this.intersectPoint,
              this.threeScene,
              child,
              this.playerNode,
              this.showcaseElement
            );
          }
        });
      }.bind(this)
    );
  }

  private getMeasurements() {
    this.sdk.Measurements.data.subscribe({
      onAdded: (index: any, item: any, collection: any) => {
        console.log('item added to the collection', index, item, collection);
      },
      onRemoved: (index: any, item: any, collection: any) => {
        console.log(
          'item removed from the collection',
          index,
          item,
          collection
        );
      },
      onUpdated: (index: any, item: any, collection: any) => {
        console.log(
          'item updated in place in the collection',
          index,
          item,
          collection
        );
      },
    });

    this.sdk.Measurements.mode.subscribe((measurementModeState: any) => {
      console.log('isActive? ', measurementModeState.active);
    });

    // var screenCoordinate = sdk.Conversion.worldToScreen(mattertag.anchorPosition, cameraPose, showcaseSize)
  }

  private async restApiTest() {
    await restSamples.run();
  }
}

export default new App();
