// for clicks etc
export { moveSprite, OnDragStart2, OnDragStart, OnDragEnd, OnDragMove };

function moveSprite (event) {
  console.log('yeyyy');
  this.jumping = true;
  __mtone.daw.synths.speech.play();
  this.perturbation = 0;
  __mpixi.msprite = this;
  __mpixi.mevent = event;
}
function OnDragStart2 (monclick) {
  let afunc = function (event) {
    this.monclick = monclick;
    this.monclick(0);
    this.mtint = this.tint;
    this.tint = 0xffffff;
    setTimeout(() => { this.tint = this.mtint; }, 300);
  }
  return afunc;
}

function OnDragStart (monclick) {
  let afunc = function (event) {
    this.monclick = monclick;
    this.data = event.data;
    this.mtint = this.tint;
    this.tint = 0xffffff;
    this.dragging = 1;
    // this.startPosition = this.data.getLocalPosition(this.parent);
    let p = __mpixi.canvas.app.renderer.plugins.interaction.mouse.global;
    this.startPosition = {x: p.x, y: p.y};
    this.monclick(0);
  }
  return afunc;
}

function OnDragEnd (monclick) {
  let afunc = function () {
    if (this.dragging) {
      let newPosition = __mpixi.canvas.app.renderer.plugins.interaction.mouse.global;
      const heightdiff = (newPosition.y - this.startPosition.y) * __mpixi.canvas.scaleheight;
      this.monclick = monclick;
      this.tint = this.mtint;
      this.dragging = false;
      this.data = null;
      this.monclick(heightdiff);
    }
  }
  return afunc;
}

function OnDragMove (monclick) {
  let afunc = function () {
    if (this.dragging) {
      this.monclick = monclick;
      let newPosition = __mpixi.canvas.app.renderer.plugins.interaction.mouse.global;
      // this.x = newPosition.x;  // to move
      // this.y = newPosition.y;
      const heightdiff = (newPosition.y - this.startPosition.y) * __mpixi.canvas.scaleheight;
      this.monclick(heightdiff);
    }
  }
  return afunc;
}
