const THREE = require('three');

class MouseHandler {
  constructor(scene, camera, getScreenHeight, getScreenWidth) {

    this.camera = camera;
    this.relativeMouse = {x: 0, y:0};
    this.absoluteMouse = {x: 0, y: 0};
    this.scene = scene;

    this.mouseIsPressed = false;

    this.listeners = [];

    const onMouseMove = ( event ) => {
      
      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components
      this.relativeMouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      this.relativeMouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

      this.absoluteMouse = {x: event.clientX, y: event.clientY};

      const pos3d = this.get3DMousePosition();
      this.listeners.forEach(f => f({x: pos3d.x, y: pos3d.y, z: pos3d.z}, this.absoluteMouse));
    
    }

    window.addEventListener('mousedown', () => (this.mouseIsPressed = true));
    window.addEventListener('mouseup', () => (this.mouseIsPressed = false));
    window.addEventListener('mousemove', onMouseMove)
    
  }

  getMousePosition() {
    return this.relativeMouse;
  }

  // Doesn't work if camera is at z position 0
  get3DMousePosition(z=0) {
    // https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z
    
    vec.set(
      this.relativeMouse.x,
      this.relativeMouse.y,
      z);

    vec.unproject( this.camera );
    
    vec.sub( this.camera.position ).normalize();
    
    var distance = - this.camera.position.z / vec.z;
    
    pos.copy( this.camera.position ).add( vec.multiplyScalar( distance ) );

    return pos;
  }
    
}
var vec = new THREE.Vector3(); // create once and reuse
var pos = new THREE.Vector3(); // create once and reuse

export { MouseHandler };