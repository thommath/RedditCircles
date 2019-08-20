const THREE = require('three');
const { getScreenHeight, getScreenWidth } = require('./Window');

// Config
const maxVel = 0.00015;
const numberOfCircles = 300;

const circles = [];

// Generate all the circles
const initCircles = (scene) => {
  const screenHeight = getScreenHeight();
  const screenWidth = getScreenWidth();
  for(let i = 0; i < numberOfCircles; i += 1) {

    var circle = new THREE.Mesh(
      new THREE.CircleGeometry(0.01),
      new THREE.MeshBasicMaterial({ color: 0xfafafa })
    );
    scene.add( circle );
    
    circles.push({
      mesh: circle,
      vel: { x: (Math.random()-0.5)*maxVel, y: (Math.random()-0.5)*maxVel, z: 0},
      pos: { x: (Math.random()*screenWidth-screenWidth/2), y: (Math.random()*screenHeight-screenHeight/2), z: 0},
      lines: {}
    });
  }
}

const moveCircles = (circles, dt, screenHeight, screenWidth) => {
  // Update positions
  circles.forEach((circle) => {
    // Move the circles
    circle.pos.x += circle.vel.x*dt;
    circle.pos.y += circle.vel.y*dt;

    // Wrap the screen
    // Using translate to maintain the offset over the border in case of serious lagg
    if (circle.pos.y > screenHeight/2) {
      circle.pos.y += -screenHeight;
    }
    if (circle.pos.y < -screenHeight/2) {
      circle.pos.y += screenHeight;
    }
    if (circle.pos.x > screenWidth/2) {
      circle.pos.x += -screenWidth;
    }
    if (circle.pos.x < -screenWidth/2) {
      circle.pos.x += screenWidth;
    }
  });
}

export {maxVel, numberOfCircles, moveCircles, initCircles, circles}