'use strict';

const THREE = require('three');
const { initThree, getScreenHeight, getScreenWidth } = require('./Window');
const { DrawableCircle } = require('./Circles')

import * as Comlink from 'comlink'; 

async function main() {

  // Initialize the canvas and renderer
  const { scene, renderer, camera, mouseHandler } = initThree();

  //Initiate worker class
  const WorkerClass = Comlink.wrap(new Worker('./webworker.js', { type: 'module' }));
  const worker = await new WorkerClass();

  // Add a mouse listener that pipes to the worker
  mouseHandler.listeners.push((pos3d) => worker.updateMousePosition(pos3d));

  // Get a copy of the circles in worker
  const circleList = await 
    worker.initialState(getScreenHeight(), getScreenWidth());
  // Map to drawable circles
  const circles = circleList.map(c => new DrawableCircle(c.pos, c.vel, scene));

  // Update circles with other circles that are close
  let lastTime = 0;
  let workerTimer = 0;
  const updateApprox = async () => {
    const wdt = lastTime - workerTimer;
    workerTimer = lastTime;
    const approx = 
      await worker.calculateCloseCircles(wdt, getScreenHeight(), getScreenWidth());
    
    for (let i = 0; i < approx.length; i += 1) {
      circles[i].approx = approx[i];
    }
    setTimeout(updateApprox, 50);
  }
  updateApprox();
  
  function render(time) {
    const dt = (time - lastTime);
    lastTime = time;

    const height = getScreenHeight();
    const width = getScreenWidth();

    for (let i = 0; i < circles.length; i += 1) {
      circles[i].render(dt, height, width, circles);
    }

    /*
 */
   
    renderer.render(scene, camera);
   
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

}

main();