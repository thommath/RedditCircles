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

/*
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }*/

  {
    var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
    scene.add(light);
  }

  renderer.render(scene, camera);

  const mouseHandler = new MouseHandler(scene, camera);


  return { scene, renderer, camera, canvas, mouseHandler };
}

function main() {

  const { scene, renderer, camera, mouseHandler } = initThree();

  // Mouse listeners
//  const mouseHandler = new MouseHandler(scene, camera);
  const screenWidth = window.innerWidth*0.002;
  const screenHeight = window.innerHeight*0.002;

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
    const dt = (time - lastTime);
    lastTime = time;

    while(lines.length) scene.remove(lines.pop());

    circles.forEach((circle, i) => {

      // Move the circles
      circle.mesh.translateX(circle.vx);
      circle.mesh.translateY(circle.vy);

      // Wrap the screen
      if (circle.mesh.position.y > screenHeight/2) {
        circle.mesh.position.setY(-screenHeight/2);
      }
      if (circle.mesh.position.y < -screenHeight/2) {
        circle.mesh.position.setY(screenHeight/2);
      }
      if (circle.mesh.position.x > screenWidth/2) {
        circle.mesh.position.setX(-screenWidth/2);
      }
      if (circle.mesh.position.x < -screenWidth/2) {
        circle.mesh.position.setX(screenWidth/2);
      }

      // Draw lines between close circles
      circles.forEach((c2, i2) => {
        if (i >= i2) return;

        const dist = circle.mesh.position.distanceTo(c2.mesh.position);

        if (dist < 0.2) {

          if (circle.lines[i2]) {
            while (circle.lines[i2].geometry.vertices.length) circle.lines[i2].geometry.vertices.pop();

            circle.lines[i2].geometry.setFromPoints([circle.mesh.position, c2.mesh.position]);
            circle.lines[i2].geometry.verticesNeedUpdate = true;

          } else {
            const geo = new THREE.Geometry();
            
            geo.vertices.push(circle.mesh.position.clone());
            geo.vertices.push(c2.mesh.position.clone());
  
  
            const line = new THREE.Line(
              geo,
              new THREE.LineBasicMaterial( { color: 0xaaaaaa, linewidth: 5-Math.ceil(dist*20) } )
            )
            scene.add( line );
            
            circle.lines[i2] = line;
          }

        } else {
          if (circle.lines[i2]) {
            scene.remove(circle.lines[i2]);
            delete circle.lines[i2];
          }
        }

      });

      // Affect circle velocity with mouse position
      const mouse = mouseHandler.get3DMousePosition();
      circles.forEach(circle => {

        const nVec = new THREE.Vector3();
        nVec.subVectors(mouse, circle.mesh.position);
        
        if (Math.pow(nVec.x, 2) + Math.pow(nVec.y, 2) < 0.01) {

          circle.vx += (0.01-nVec.x) * 0.0001;
          circle.vy += (0.01-nVec.y) * 0.0001;
  
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