
/**
 * turns object rotationSteps clockwise or anticlockwise
 */
 export default class HorizontalRotator { 
    constructor(obj3D) { 
        this.obj3D = obj3D;
        this.rotationSteps = 0.02;
        this.isClockWise = true; 
        this.isStarted = true;
    } 

    start(){
        this.isStarted = true;
    }

    stop(){
        this.isStarted = false;
    }

    setRotationSide(sideBool = true){
        this.isClockWise = sideBool;
    }

    ticker(){
        if(this.isStarted){
            if(this.isClockWise){
                this.obj3D.rotation.y += this.rotationSteps;
            } else {
                this.obj3D.rotation.y -= this.rotationSteps;
            }
        }
    }
 }