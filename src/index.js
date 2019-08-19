'use strict';

const THREE = require('three');

const { MouseHandler } = require('./MouseHandler');

function initThree() {

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
  const mouseHandler = new MouseHandler(scene, camera);


  // Window resize
  window.addEventListener( 'resize', () => {

    camera.aspect = window.innerWidth / window.innerHeight;
    
    camera.updateProjectionMatrix();
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    renderer.setSize( window.innerWidth, window.innerHeight );
  }, false);


  return { scene, renderer, camera, canvas, mouseHandler };
}



function main() {

  // Temp variables
  const tempVec = new THREE.Vector3();


  const { scene, renderer, camera, mouseHandler } = initThree();

  const screenWidth = window.innerWidth*0.002;
  const screenHeight = window.innerHeight*0.002;


  // Generate all the circles
  const circles = [];

  for(let i = 0; i < 50; i += 1) {

    var circle = new THREE.Mesh(
      new THREE.CircleGeometry(0.01),
      new THREE.MeshBasicMaterial({ color: 0xfafafa })
    );
    scene.add( circle );
    
    circle.position.set((Math.random()*screenWidth-screenWidth/2), (Math.random()*screenHeight-screenHeight/2), 0);
    
    circles.push({
      mesh: circle,
      vx: (Math.random()-0.5)*0.003,
      vy: (Math.random()-0.5)*0.003,
      lines: {}
    });
    
  }


  const lines = [];
  
  let lastTime = 0;
  function render(time) {
    const dt = (time - lastTime)*0.05;
    lastTime = time;

    while(lines.length) scene.remove(lines.pop());

    circles.forEach((circle, i) => {

      // Move the circles
      circle.mesh.translateX(circle.vx*dt);
      circle.mesh.translateY(circle.vy*dt);

      // Wrap the screen
      // Using translate to maintain the offset over the border in case of serious lagg
      if (circle.mesh.position.y > screenHeight/2) {
        circle.mesh.translateY(-screenHeight);
      }
      if (circle.mesh.position.y < -screenHeight/2) {
        circle.mesh.translateY(screenHeight);
      }
      if (circle.mesh.position.x > screenWidth/2) {
        circle.mesh.translateX(-screenWidth);
      }
      if (circle.mesh.position.x < -screenWidth/2) {
        circle.mesh.translateX(screenWidth);
      }

      // Draw lines between close circles
      for (let i2 = i+1; i2 < circles.length; i2 += 1) {
        const c2 = circles[i2];

        const dist = circle.mesh.position.distanceTo(c2.mesh.position);

        if (dist < 0.2) {

          let geo;
          let material;
          // If line exists update points and line width
          if (circle.lines[i2]) {
            
            geo = circle.lines[i2].geometry;
            material = circle.lines[i2].material;
            geo.verticesNeedUpdate = true;
            
          } else {

            geo = new THREE.Geometry();
            material = new THREE.LineBasicMaterial( { color: 0xaaaaaa } );
            const line = new THREE.Line(
              geo,
              material
            );
            
            scene.add( line );   
            circle.lines[i2] = line;
          }

          geo.setFromPoints([circle.mesh.position, c2.mesh.position]);
          material.linewidth = 5-Math.ceil(dist*20);

        } else {
          if (circle.lines[i2]) {
            scene.remove(circle.lines[i2]);
            circle.lines[i2] = null;
          }
        }

      };

      // Affect circle velocity with mouse position
      const mouse = mouseHandler.get3DMousePosition();
      circles.forEach(circle => {

        tempVec.subVectors(mouse, circle.mesh.position);
        
        if (Math.pow(tempVec.x, 2) + Math.pow(tempVec.y, 2) < 0.01) {

          // Accelerate the circles away from the mouse
          circle.vx += (0.01-tempVec.x) * 0.0001;
          circle.vy += (0.01-tempVec.y) * 0.0001;
  
          // Limit the top velocity
          circle.vx = Math.min(0.003, circle.vx);
          circle.vy = Math.min(0.003, circle.vy);
          circle.vx = Math.max(-0.003, circle.vx);
          circle.vy = Math.max(-0.003, circle.vy);
        }
      });
      
    });

   
    renderer.render(scene, camera);
   
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

}

main();