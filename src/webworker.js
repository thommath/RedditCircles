import * as Comlink from 'comlink';

const { maxVel, numberOfCircles, Circle } = require('./Circles');


// Dist = sqrt(a^2+b^2+c^2)
const dist = (a, b) => Math.sqrt(
  Math.pow(a.pos.x - b.pos.x, 2) +
  Math.pow(a.pos.y - b.pos.y, 2) +
  Math.pow(a.pos.z - b.pos.z, 2));

const length = (a) => Math.sqrt(
  Math.pow(a.x, 2) + 
  Math.pow(a.y, 2) + 
  Math.pow(a.z, 2)
);

const applyToVecs = (a, b, op) => ({
  x: op(a.x, b.x),
  y: op(a.y, b.y),
  z: op(a.z, b.z)
})
const subPos = (a, b) => applyToVecs(a, b, (a, b) => (a - b));



class WorkerClass {
  logSomething() {
    console.log('hello');
  }


  // Apply acceleration from being close to the mouse 

  // Doing it here will increase the response time for the user
  // but it will make the calculations more precise.
  // Not sure what is best


  // Calculate with dx as input
  // What circles will be close to other circles during the next 1000ms 
  // Every 500ms 

  // This will make the work on rendering thread a lot less since 
  // the number of each proximity calculation will not be n log n but n (something smaller depending on the recalculation frequency)
  // While still being n log n on the worker thread


  // First get a clone of the system
  // cloning might take some time
  // But only needs to send velocity and position, UI info is irrelevant
  initialState(windowHeight, windowWidth) {
    this.mouse = {x: 0, y: 0, z: 0};
    this.circles = [];
    this.time = 0;
    this.diff = [];
    this.lastTickTime = 0;

    for (let i = 0; i < numberOfCircles; i+=1) {
      this.circles.push(new Circle(windowHeight, windowWidth));
    }

    return this.circles.map(c => c.getTransferData());
  }

  updateMousePosition(pos3d) {
    this.mouse = pos3d;
  }

  onTick() {
    if (this.lastTickTime === this.time) return;
    this.lastTickTime = this.time;

    
    // Affect circle velocity with mouse position
    this.circles.forEach((circle, i) => {
      
      const subVec = subPos(circle.pos, this.mouse);
      
      const range = 0.1;
      
      if (length(subVec) < range) {
        
        // Accelerate the circles away from the mouse
        circle.vel.x += (subVec.x) * maxVel * range/0.1;
        circle.vel.y += (subVec.y) * maxVel * range/0.1;

        // Limit the top velocity
        circle.vel.x = Math.min(maxVel, circle.vel.x);
        circle.vel.y = Math.min(maxVel, circle.vel.y);
        circle.vel.x = Math.max(-maxVel, circle.vel.x);
        circle.vel.y = Math.max(-maxVel, circle.vel.y);

        this.diff.push({ id: i, ...circle.getTransferData(), time: this.time })
      }
    });
  }

  // Get the difference
  getDiff() {
    const diff = this.diff;
    this.diff = [];
    return diff;
  }

  // Then calculate what circles will be close to each other in the next x ms
  calculateCloseCircles(dt, screenHeight, screenWidth) {


    this.circles.forEach(c => c.move(dt, screenHeight, screenWidth));

    this.time += dt;
    
    const matrix = [];
    
    for (let i = 0; i < this.circles.length; i += 1) {
      const row = [];
      for (let o = i+1; o < this.circles.length; o += 1) {
        /**
         * Time for some math
         * pos + vel * t = pos2 + vel2 * t
         * t(vel - vel2) = pos2 - pos
         * t = (pos2 - pos) / (vel - vel2)
         */
        /**
         * Outcomes:
         * a: 0/x: same position
         * b: x/0: identical vel
         * c: x/y: will crash or has crashed
         */

         /**
          * Problem, this is too accurate, they probably will never crash
          * Solution: We make the calculations less accurate by rounding the numbers
          */
/*
          const addPos = (pos1, pos2) => ({x: pos1.x + pos2.x, y: pos1.y + pos2.y, z: pos1.z + pos2.z});
          const subVel = (vel1, vel2) => ({x: vel1.x - vel2.x, y: vel1.y - vel2.y, z: vel1.z - vel2.z});

          const divVecs = (vec1, vec2) => {

            const div = (a, b) => {
              if (b === 0) return 9999;
              if (a === 0) return 0;
              return a / b;
            }

            const acc = 1000;
            const round = a => Math.round(a * acc) / acc;

            const x = div(round(vec1.x), round(vec2.x));
            const y = div(round(vec1.y), round(vec2.y));
            const z = div(round(vec1.z), round(vec2.z));
            

            // x, y, z has minimum time to collision

            return Math.min(x, y, z);
          }

          // Preform calculations
          const a = addPos(this.circles[o].pos, this.circles[i].pos);
          const b = subVel(this.circles[i].vel, this.circles[o].vel);
          const t = divVecs(a, b);

          matrix[`${i}${o}`] = t;
          console.log(t);
*/

          // So math is difficult, let's do it the easy way
          // Who can we prove are not close to each other?
          
          const d = dist(this.circles[i], this.circles[o]);
          
          // d = v*t
          // t = d/v
          const minT = d / (Math.sqrt(Math.pow(maxVel, 2) * 2));

          if (minT < 1000)
            row.push(o);
          
      }

      matrix.push(row);
    }
    //console.log(matrix)
    return matrix;

  }


}

Comlink.expose(WorkerClass);