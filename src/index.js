'use strict';

const { initThree, getScreenHeight, getScreenWidth } = require('./Window');
const { DrawableCircle } = require('./Circles')

import * as Comlink from 'comlink'; 
import { Tooltip } from './Tooltip';
import { Overlay } from './Overlay';

async function main() {

  
  function httpGetAsync(theUrl, callback)
  {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function() { 
          if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
              callback(xmlHttp.responseText);
      }
      xmlHttp.open("GET", theUrl, true); // true for asynchronous 
      xmlHttp.send(null);
  }

  function httpGet(theUrl)
  {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
      xmlHttp.send( null );
      return xmlHttp.responseText;
  }

  const httpData = httpGet("https://www.reddit.com/r/programmerhumor.json?limit=100");
  const data = JSON.parse(httpData);
  const content = data.data.children.map(e => e.data);


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


  circles.forEach((c, i) => {
    if (i >= content.length) {
      c.mesh.content = {title: 'Not this one'};
      return;
    }
    c.mesh.content = content[i];
  });

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

  // Update pos and vel from webworker
  const newSync = (diff) => {
    diff.forEach(d => {
      circles[d.id].diff.push({
        dt: d.time - lastTime,
        ...d,
      });
    });
  }
  worker.setSyncCallback(Comlink.proxy(newSync));

  // Add tooltip on hover
  const interactableObjects = [];
  circles.forEach(c => interactableObjects.push(c.mesh));
  const tooltip = new Tooltip(camera, interactableObjects);
  mouseHandler.listeners.push(tooltip.update.bind(tooltip));

  // Add overlay for on click
  const overlay = new Overlay(camera, interactableObjects);
  mouseHandler.clickListeners.push(overlay.update.bind(overlay));
  
  function render(time) {
    const dt = (time - lastTime);
    lastTime = time;

    worker.onTick();

    const height = getScreenHeight();
    const width = getScreenWidth();

    for (let i = 0; i < circles.length; i += 1) {
      circles[i].render(dt, height, width, circles);
    }
   
    renderer.render(scene, camera);
   
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

}

main();