/**
 *  
 * ___.___
 *  c[_]`=--/     
 *    |                    ___.___
 *    |                 \--='[_]b
 *    |           /\          |
 *    &\         /  \         |
 *          `.` / , / .,'     &
 *~~~&~~~&~~~``'"'"'"'"~~~~~~~~~`&~~~~~~~~~~~~~~~sl
 *          
 * Key listeners and default quadcopter controls Matterport mp.input
 * 
 * @author Rolando <rgarro@gmail.com>
 */
 export default class DroneControls { 
    
    constructor(obj3D) { 
      this.obj3D = obj3D;
      this.eventType = 'INTERACTION.KEY';
      this.downKey = 71;//g key
      this.upKey = 89;//ykey
      this.rightKey = 72;//h key
      this.leftKey = 70;//f key
      this.sideSteps = 0.018;
      this.elevetionsteps = 0.018;
      this.minElevation = 0;//-1.201;
      this.maxElevation = 0;//1.34;
      this.maxX = 0;//1.512;
      this.minX = 0;//-0.216;
      this.sideAmplitude = 1.512;
      this.Boomerang = null;
      this.boomerangIsSetUp = false;
      this.accelerateBoomerangKey =53;//key 5
      this.deaccelerateBoomerangKey =52;//key 4
      this.forwardKey = 67;//key c
      this.backwardKey = 88;//key x
      this.deepSteps = 0.018;
      this.initialYPos = 0.08;
      this.elevationRange = 1.26;
      this.calculateElevationLimits();
      this.calculateSideLimits();
      this.horizontalRotator = null;
      this.horizontalRotatorIsSet = false;
      this.startStopRotatorKey =86;//v
      this.changeRotatorSideKey = 66;//b
    } 

    setHorizontalRotator(rotatorObj){
        this.horizontalRotator = rotatorObj;
        this.horizontalRotatorIsSet = true;
    }

    calculateElevationLimits(){
        this.maxElevation = this.obj3D.position.y + this.elevationRange;
        this.minElevation = this.obj3D.position.y - this.elevationRange;
    }

    calculateSideLimits(){
        this.maxX = this.obj3D.position.x + this.sideAmplitude;
        this.minX = this.obj3D.position.x - this.sideAmplitude;
    }

    setBoomerang(boomerang){
        //console.log('HERE!! setting boomerang', typeof boomerang);
        this.Boomerang = boomerang;
        this.boomerangIsSetUp = true;
    }

    onEvent(evt) {
        //console.log('HERE!!!!! key received', evt.key);
        if(evt.key == this.upKey){
            this.increaseElevation();
        }
        if(evt.key == this.downKey){
            this.decreaseElevation();
        }
        if(evt.key == this.leftKey){
            this.moveLeft();
        }
        if(evt.key == this.rightKey){
            this.moveRight();
        }
        if(evt.key == this.forwardKey){
            this.moveForward();
        } 
        if(evt.key == this.backwardKey){
            this.moveBackward();
        }
        if(this.boomerangIsSetUp){
            if(evt.key == this.accelerateBoomerangKey){
                this.Boomerang.increaseSpeed();
            }
            if(evt.key == this.deaccelerateBoomerangKey){
                this.Boomerang.decreaseSpeed();
            }
        }
        if(this.horizontalRotatorIsSet){
            //Start Stops rotator
            if(evt.key == this.startStopRotatorKey){
                if(this.horizontalRotator.isStarted){
                    this.horizontalRotator.stop()
                } else {
                    this.horizontalRotator.start();
                }
            }
            //changes rotation side 
            if(evt.key == this.changeRotatorSideKey){
                if(this.horizontalRotator.isClockWise){
                    this.horizontalRotator.setRotationSide(false);
                }else{
                    this.horizontalRotator.setRotationSide(true);
                }
            }
        }
    }

    increaseElevation(){
        //console.log("####increasing elevation");
        if(this.obj3D.position.y < this.maxElevation){
            this.obj3D.position.y += this.elevetionsteps;
        }
    }

    decreaseElevation(){
        //console.log("####decreasing elevation");
        if(this.obj3D.position.y > this.minElevation){
            this.obj3D.position.y -= this.elevetionsteps;
        }
    }

    moveLeft(){
        //console.log("moving to the left");
        if(this.obj3D.position.x > this.minX){
            this.obj3D.position.x -= this.sideSteps;
        }
    }

    moveRight(){
        //console.log("moving to the right");
        if(this.obj3D.position.x < this.maxX){
            this.obj3D.position.x += this.sideSteps;
        }
    }

    moveForward(){
        console.log("moving forward");
            this.obj3D.position.z += this.deepSteps;
        
    }

    moveBackward(){
        console.log("moving backward");
            this.obj3D.position.z -= this.deepSteps;
        
    }
}