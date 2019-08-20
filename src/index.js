'use strict';

const THREE = require('three');
const { initThree, getScreenHeight, getScreenWidth } = require('./Window');
const { initCircles, circles, moveCircles, maxVel } = require('./Circles')

import * as Comlink from 'comlink'; 

async function main() {

  // Temp variables
  const tempVec = new THREE.Vector3();

  const { scene, renderer, camera, mouseHandler } = initThree();

  //Initiate worker class
  const WorkerClass = Comlink.wrap(new Worker('./webworker.js', { type: 'module' }));
  const worker = await new WorkerClass();

  initCircles(scene);


  await worker.initialState(circles.map(c => ({
    pos: c.pos,
    vel: c.vel,
  })));
  
  let close = null;
  let lcalcTime = 0;
  let lastTime = 0;

  const calculationLoop = async () => {
    
    let ldt = lastTime - lcalcTime;
    lcalcTime = lastTime;

    const matrix = await worker.calculateCloseCircles(ldt, getScreenHeight(), getScreenWidth());
    close = matrix;

    setTimeout(
      calculationLoop,
      200
    );
  };
  calculationLoop();



  let stats = {a: 0, b: 0, time: 0, nr: 0};
  setInterval(
    () => console.log('Percent avoided: ', stats.a/(stats.a+stats.b), 'Avg time: ', stats.time/stats.nr),
    1000
  )
 
  function render(time) {
    const dt = (time - lastTime);
    lastTime = time;

    moveCircles(circles, dt, getScreenHeight(), getScreenWidth());

    circles.forEach((circle, i) => {
      // Move the circles
      circle.mesh.position.set(circle.pos.x, circle.pos.y, circle.pos.z);


      const t0 = performance.now();
      // Draw lines between close circles
      const maxDist = 0.25;
      const maxTime = time - lcalcTime + (maxDist/ Math.sqrt(Math.pow(maxVel, 2) * 2));
      for (let o = 0; o < circles.length - i -1; o += 1) {
        //if (close)
//        console.log(close[i][o], maxTime, close[i][o] < maxTime)
        if (!close || close[i][o] >= maxTime) {stats.a += 1;continue};

        const c2 = circles[i+o+1];
      /*}

      for (let o = i+1; o < circles.length; o += 1) {
        // Ignoring those calculated far away
        // 100 because that is approx the max range of the dist < 0.2
        if (close[i + '' + o] >  maxTime) {stats.a += 1;continue};
        
        
        const c2 = circles[o];
        */

        stats.b += 1;
        const dist = circle.mesh.position.distanceTo(c2.mesh.position);

        if (dist < 0.25) {

          let geo;
          let material;
          // If line exists update points and line width
          if (circle.lines[o]) {
            
            geo = circle.lines[o].geometry;
            material = circle.lines[o].material;
            geo.verticesNeedUpdate = true;
            
          } else {

            geo = new THREE.Geometry();
            material = new THREE.LineBasicMaterial( { color: 0xaaaaaa } );
            const line = new THREE.Line(
              geo,
              material
            );
            
            scene.add( line );   
            circle.lines[o] = line;
          }

          geo.setFromPoints([circle.mesh.position, c2.mesh.position]);
          material.linewidth = 3-Math.ceil(dist*20);

        } else {
          if (circle.lines[o]) {
            scene.remove(circle.lines[o]);
            circle.lines[o].geometry.dispose();
            circle.lines[o].material.dispose();
            //renderer.deallocateTexture( circle.lines[o] );
            circle.lines[o] = null;
          }
        }
      };

      const t1 = performance.now();
      stats.time += t1-t0;
      stats.nr += 1;
      /*
      // Affect circle velocity with mouse position
      const mouse = mouseHandler.get3DMousePosition();
      circles.forEach(circle => {

        tempVec.subVectors(mouse, circle.mesh.position);
        
        if (Math.pow(tempVec.x, 2) + Math.pow(tempVec.y, 2) < 0.01) {

          // Accelerate the circles away from the mouse
          circle.vx += (0.01-tempVec.x) * 0.005 * maxVel;
          circle.vy += (0.01-tempVec.y) * 0.005 * maxVel;
  
          // Limit the top velocity
          circle.vx = Math.min(maxVel, circle.vx);
          circle.vy = Math.min(maxVel, circle.vy);
          circle.vx = Math.max(-maxVel, circle.vx);
          circle.vy = Math.max(-maxVel, circle.vy);
        }
      }); */
      
    });

   
    renderer.render(scene, camera);
   
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

}

main();