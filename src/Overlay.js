const THREE = require('three');


class Overlay {

  constructor(camera, interactableObjects) {

    this.camera = camera;
    this.interactableObjects = interactableObjects;
    this.raycaster = new THREE.Raycaster();

    this.overlay = document.createElement('div');

    this.overlay.style.cssText = 
    `
      position: fixed;
      display: none;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.5);
      z-index: 2;
      cursor: pointer;
    `;

    this.innerDiv = document.createElement('div');

    this.innerDiv.style.cssText = 
    `
      padding: 10px;
      border-radius: 4px;
      position: absolute;
      top: 50%;
      left: 50%;
      background-color: #fafafa;
      transform: translate(-50%,-50%);
      -ms-transform: translate(-50%,-50%);
      max-height: 80%;
      max-width: 80%;
      overflow: auto;
    `;

    this.innerDiv.innerHTML = "Hello World!";

    this.overlay.appendChild(this.innerDiv);

    document.body.appendChild(this.overlay);

    this.overlay.onclick = this.hide.bind(this);

  }

  show() {
    this.overlay.style.display = "block";
  }
  hide() {
    this.overlay.style.display = "none";
  }
  isShown() {
    return this.overlay.style.display === "block";
  }

  setContent(content) {
    this.innerDiv.innerHTML = 
    `
    <h1>${content.title}</h1>
    <p>${content.selftext_html || ''}</p>
    <img src="${content.preview && content.preview.images.length ? content.preview.images[0].source.url : ''}" style="max-height: 100%; max-width: 100%"/>
    `;
  }

  setText(text) {
    this.innerDiv.innerHTML = text;
  }


  update(_, relativeMouse, absoluteMouse) {
    // update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera( relativeMouse, this.camera );
  
    // calculate objects intersecting the picking ray
    var intersects = this.raycaster.intersectObjects( this.interactableObjects );

    if (!intersects.length) {

      if (this.isShown()) {
        this.hide();
      }

    } else {

      if (!this.isShown()) {
        this.setContent(intersects[ 0 ].object.content)
        this.show();
      } else {
        this.setContent(intersects[ 0 ].object.content)
      }

    }
  }


}

export { Overlay };