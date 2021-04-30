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
      this.obj3D;
      this.eventType = 'INTERACTION.KEY';
      this.downKey = 71;//g key
      this.upKey = 89;//ykey
      this.rightKey = 72;//h key
      this.leftKey = 70;//f key
      this.sideSteps = 0.008;
      this.elevetionsteps = 0.008;
      this.minElevation = 0;
      this.maxElevation = 1;
    } 

    onEvent(evt) {
        console.log('HERE!!!!!received', evt.key);
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
        console.log("increasing elevation");
    }

    decreaseElevation(){
        console.log("decreasing elevation");
    }

    moveLeft(){
        console.log("moving to the left");
    }

    moveRight(){
        console.log("moving to the right");
    }
}