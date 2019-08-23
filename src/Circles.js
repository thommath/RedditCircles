const THREE = require('three');

// Config
const maxVel = 0.00015;
const numberOfCircles = 50;

class Circle {

  constructor (screenHeight, screenWidth) {
    if (screenHeight && screenWidth) {
      this.vel = { x: (Math.random()-0.5)*maxVel, y: (Math.random()-0.5)*maxVel, z: 0};
      this.pos = { x: (Math.random()*screenWidth-screenWidth/2), y: (Math.random()*screenHeight-screenHeight/2), z: 0};
    }
  }

  move (dt, screenHeight, screenWidth) {
    // Move the circle
    this.pos.x += this.vel.x*dt;
    this.pos.y += this.vel.y*dt;

    // Wrap the screen
    // Using translate to maintain the offset over the border in case of serious lagg
    if (this.pos.y > screenHeight/2) {
      this.pos.y += -screenHeight;
    }
    if (this.pos.y < -screenHeight/2) {
      this.pos.y += screenHeight;
    }
    if (this.pos.x > screenWidth/2) {
      this.pos.x += -screenWidth;
    }
    if (this.pos.x < -screenWidth/2) {
      this.pos.x += screenWidth;
    }
  }

  getTransferData() {
    return {
      pos: this.pos,
      vel: this.vel,
    }
  }
}

const lineMaterial = new THREE.ShaderMaterial( {
  uniforms: {
    length: {value: 1},
  },
  vertexShader: 
  `
  attribute float vLength;

  varying vec4 color;

  void main() {

    float sin_value = position[0] * 2.0;
    float val_a = (1.0+sin(0.0 + position[1] + sin_value))/2.0;
    float val_b = (1.0+sin(1.5 + position[1] + sin_value))/2.0;
    float val_c = (1.0+sin(3.0 + position[1] + sin_value))/2.0;

    color = vec4(val_a, val_b, val_c, 1.0-4.0*vLength*vLength);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  fragmentShader: 
  `
  varying vec4 color;
  
  void main() {
    gl_FragColor = color;
  }
  `,
  linewidth: 10,
  transparent: true,
} );

class DrawableCircle extends Circle{

  constructor(pos, vel, scene) {
    super();

    this.scene = scene;
    this.pos = pos;
    this.vel = vel;
    this.diff = [];

    this.mesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 10),
      new THREE.MeshBasicMaterial({ color: 0xdddddd })
    );
    scene.add(this.mesh);
    this.approx = [];
    this.lines = [];
  }


  render (dt, screenHeight, screenWidth, circles) {

    if (this.diff.length) {
      this.diff.forEach(d => {
        // Move back in time
        this.move(d.dt, screenHeight, screenWidth);
        // Update object
        this.pos = d.pos;
        this.vel = d.vel;
        // Move forward in time
        this.move(-d.dt, screenHeight, screenWidth);
      });

      this.diff = [];

    }

    this.move(dt, screenHeight, screenWidth);

    this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);

    for (let i = 0; i < this.approx.length; i += 1) {

      const d = this.mesh.position.distanceTo(circles[this.approx[i]].mesh.position);
      if (d > 1) {
        this.approx.splice(i);
        i -= 1;
        continue;
      }

      let geo;
      if (this.lines[i]) {
        geo = this.lines[i].geometry;
        geo.verticesNeedUpdate = true;
      } else {
        geo = new THREE.BufferGeometry();
        const line = new THREE.Line(
          geo,
          lineMaterial,
        );
        
        this.scene.add( line );
        this.lines[i] = line;
      }

      /*
      const value = Math.round(9*((1 + Math.sin(2*this.pos.y + this.pos.x * 3))/2 ));
      const value2 = Math.round(9*((1 + Math.sin(1.5+2*this.pos.y + this.pos.x * 3))/2 ));
      const value3 = Math.round(9*((1 + Math.sin(3+2*this.pos.y + this.pos.x * 3))/2 ));
      material.color = new THREE.Color("#" + value3 + value + value2);
      */
     geo.setFromPoints([{...this.mesh.position, z: -0.01}, {...circles[this.approx[i]].mesh.position, z: -0.01}]);

      const vLength = new Float32Array(geo.attributes.position.count);
      const length = this.mesh.position.distanceTo(circles[this.approx[i]].mesh.position);

      for (let i = 0; i < vLength.length; i += 1) {
        vLength[i] = length;
      }

      geo.addAttribute( "vLength",  new THREE.BufferAttribute(vLength, 1));
      geo.attributes.vLength.needsUpdate = true;


    }

    if (this.lines.length > this.approx.length) {
      for (let i = 0; i < this.lines.length - this.approx.length; i += 1) {
        const line = this.lines.pop();
        this.scene.remove(line);
        line.geometry.dispose();
      //  line.material.dispose();
      }
    }

    /*
    // Draw lines between close circles
    const maxDist = 0.25;
    const maxTime = time - lcalcTime + (maxDist/ Math.sqrt(Math.pow(maxVel, 2) * 2));

    for (let o = 0; o < close.length - i - 1; o += 1) {
      if (!close || close[i][o] >= maxTime) {stats.a += 1;continue};

      const c2 = circles[i+o+1];

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
          circle.lines[o] = null;
        }
      }
    
    }*/
  }

}

export {
  maxVel, 
  numberOfCircles,
  Circle,
  DrawableCircle,
}