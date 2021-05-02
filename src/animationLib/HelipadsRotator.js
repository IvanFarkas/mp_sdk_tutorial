export default class HelipadsRotator { 
    
    constructor(obj3D) { 
      this.obj3D = obj3D;
      this.rotationSpeed = 1.12;
    }

    rotateHelipads(){
        
      if(typeof this.obj3D != "undefined"){
 //console.log("THE OBJECT GOT DEFINED ...")       
        //HelipadsBackRight
      this.obj3D.children[0].children[0].children[1].children[4].children[0].rotation.y += this.rotationSpeed;
      //HelipadsBackLeft
      this.obj3D.children[0].children[0].children[1].children[4].children[1].rotation.y += this.rotationSpeed;
      //HelipadsFrontRight
        this.obj3D.children[0].children[0].children[1].children[6].children[0].rotation.y += this.rotationSpeed;
      //HelipadsFrontLeft
      this.obj3D.children[0].children[0].children[1].children[6].children[1].rotation.y += this.rotationSpeed;
      }
    }

    ticker(){
        this.rotateHelipads();
    }
}