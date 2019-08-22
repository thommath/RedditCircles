const THREE = require('three');

class Tooltip {

  constructor(camera, interactableObjects) {

    this.raycaster = new THREE.Raycaster();

    this.camera = camera;
    this.interactableObjects = interactableObjects;

    const div = document.createElement('div');

    div.style.cssText = 
    `
      position: absolute;
      background-color: #333;
      color: #eee;
      padding: 10px;
      display: none;
    `;

    const p = document.createElement('p');
    p.innerHTML = "";
    div.appendChild(p);
    document.body.appendChild(div);

    this.div = div;

  }

  update(_, relativeMouse, absoluteMouse) {
    // update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera( relativeMouse, this.camera );
  
    // calculate objects intersecting the picking ray
    var intersects = this.raycaster.intersectObjects( this.interactableObjects );

    if (!intersects.length || !intersects[ 0 ].object.content) {

      if (this.isShown()) {
        this.hide();
      }

    } else {

      if (!this.isShown()) {
        this.setText(intersects[ 0 ].object.content.title);
        this.setPosition(absoluteMouse);
        this.show();
      } else {
        this.setText(intersects[ 0 ].object.content.title);
        this.setPosition(absoluteMouse);
      }

    }
  }

  setText(text) {
    this.div.children[0].innerHTML = text;
  }

  isShown() {
    return this.div.style.display === "block";
  }

  show() {
    this.div.style.display = "block";
  }

  hide() {
    this.div.style.display = "none";
  }

  setPosition(mouse) {
    this.div.style.left = (mouse.x - this.div.clientWidth/2) + 'px';
    this.div.style.top = (mouse.y - this.div.clientHeight - 5) + 'px';
  }
}

export { Tooltip };