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
      this.minElevation = -1.201;
      this.maxElevation = 1.34;
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
    }

    increaseElevation(){
        console.log("####increasing elevation");
        if(this.obj3D.position.y < this.maxElevation){
            this.obj3D.position.y += this.elevetionsteps;
        }
    }

    decreaseElevation(){
        console.log("####decreasing elevation");
        if(this.obj3D.position.y > this.minElevation){
            this.obj3D.position.y -= this.elevetionsteps;
        }
    }

    moveLeft(){
        console.log("moving to the left");
    }

    moveRight(){
        console.log("moving to the right");
    }
}