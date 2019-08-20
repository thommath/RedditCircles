const THREE = require('three');
const { MouseHandler } = require('./MouseHandler');

const initThree = () => {

    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
  
    document.body.style.margin = 0;
    canvas.style.display = 'block';
  
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  
  
    const renderer = new THREE.WebGLRenderer({canvas});
  
    const fov = 75;
    const aspect = canvas.width/canvas.height;  // the canvas default
    const near = 0.1;
    const far = 20;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  
    camera.position.z = 2;
  
    const scene = new THREE.Scene();
  
    {
      var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
      scene.add(light);
    }
  
    renderer.render(scene, camera);
  
    // Mouse listeners
    const mouseHandler = new MouseHandler(scene, camera, getScreenHeight, getScreenWidth);
  
    // Calculate relative screen height and width
    const computeRelativeScreenHeightAndWidth = (z=0) => {
      // https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z
      var vec = new THREE.Vector3(); // create once and reuse
      var pos = new THREE.Vector3(); // create once and reuse
      
      vec.set(
          1,
          -1,
          0);
  
      vec.unproject( camera );
      
      vec.sub( camera.position ).normalize();
      
      var distance = - camera.position.z / vec.z;
  
      pos.copy( camera.position ).add( vec.multiplyScalar( distance ) );
  
      return { height: Math.abs(pos.y) * 2, width: Math.abs(pos.x) * 2 };
    }
  
  
    // Window resize
    window.addEventListener( 'resize', () => {
  
      camera.aspect = window.innerWidth / window.innerHeight;
      
      camera.updateProjectionMatrix();
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      renderer.setSize( window.innerWidth, window.innerHeight );
  
      // Set the screenWidth and height on the z=0 plane
      const {height, width} = computeRelativeScreenHeightAndWidth();
  
      screenWidth = width;
      screenHeight = height;
  
    }, false);
  
    // Set the default screenWidth and height on the z=0 plane
    const {height, width} = computeRelativeScreenHeightAndWidth();
    screenWidth = width;
    screenHeight = height;
  
  
    return { scene, renderer, camera, canvas, mouseHandler };
  }
  
  let screenWidth = 1;
  let screenHeight = 1;

  const getScreenHeight = () => screenHeight;
  const getScreenWidth = () => screenWidth;

  export { initThree, getScreenWidth, getScreenHeight }