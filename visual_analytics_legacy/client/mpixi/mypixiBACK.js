// player sprite tint text by proximity.
// distant are blue. Near red.
// Nearest is white.
// (almost) every graphical element has a text attached.
//
  // * health bar: https://github.com/kittykatattack/learningPixi
//     that gets time and uses cycles to give points to the user.
  //     Periods:
  //      10s: opens search string widget.
//        10s: opens key strokes followed when user sprite is active.
//        1m: global mynsa-losd ecosystem overview.
  //      2-10m: documentation files.
//        11-30m: report of usage activity in this session.
//        30m-1h: browser figerprint, history of usages, analytics.
  //      1-2h: audiovisual gadgets, code snippets.
//        1sem (7 days + 24h usage): access to source code.
//        1mes/~max: core user entitlements and accesses.
//        etc.
//
//  containing (restricting) movement in a container for the sprites:
//    https://github.com/kittykatattack/learningPixi
//
//  nice backgrounds, at least:
//  heaven, space, sea surface, deep sea.
//  more: black hole, geometric space, human face, human gathering (show, shopping/feira), ET faces (arcturian, etc etc).
//  keep switching. chose one to stop.
//
//  And effects!
//    explosions, when mouse enter canvas or arrow keys are used,
//    the user sprite is made active and state will be evaluated.
//    Bump: https://github.com/kittykatattack/bump , 2017.
//    tweening: https://github.com/kittykatattack/charm
//    use particle container to draw the networks: https://pixijs.download/dev/docs/PIXI.ParticleContainer.html
//    https://pixijs.io/pixi-particles-editor/#
//    https://www.npmjs.com/package/pixi-particles
//
//    optimized button, to that the sprites are simple triangles and lines.
//
//
//  frame in up-right. Run container is the big rec in left bot
//     
//   A  ----  B
//   C  ----  D
//
//
//   B =  info (bpm, fps, n sprites, user info (points, lifetime bar, unlocked, etc)
//   A is play/pause audio and image update. Image freezes until user interacts. Audio stops to output.
//  
//   
//
// nice widgets: https://vipkid-edu.github.io/pixi-vfui-docs/0.1.0/
// nice helpers: https://ptsjs.org
//
// viewport: https://davidfig.github.io/pixi-viewport/jsdoc/Viewport.html#zoom

// use smoothie: https://github.com/kittykatattack/smoothie
// 2-3D projections? https://github.com/pixijs/pixi-projection/
// glMatrix? (2-4D matrices) https://github.com/toji/gl-matrix
//
//
// meteor npm install -s pixi.js, v5.1.5
import PIXI from 'pixi.js';
import Tone from 'tone'
import { Backimages } from '../imports/api/backimages/backimages.js';
import { chooseUnique } from './utils.js';

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
      this.monclick(heightdiff)
    }
  }
  return afunc;
}


class MPixi {
  constructor () {
    window.__mpixi = this;
    this.PIXI = PIXI;
  }
  theInit () {
    this.frame0 = { // initial data
      videoloops: [],
      taps: [0],
      refwidth: 1360,
      refheight: 409,
      aux: {}, // for variables defined afterwards
    };
    let self = this;
    this.canvas = function () {
      let a = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      $('#canvascontainer').append(a.view);
      return {
        app: a,
        width: a.view.width,
        height: a.view.height,
        scalewidth: a.view.width / self.frame0.refwidth,
        scaleheight: a.view.height / self.frame0.refheight,
      };
    }();
    this.canvas.app.ticker.add( (delta) => {
      self.animationLoop(delta)
    });
    this.frame1 = function () { // first audio and visual elements in Tone and pixi
        // self.initCanvasText()
        self.initCanvasWidgets()
        return 'ok'
    }();
    this.download = this.downloadInitialData() // continues when receiving the answer
  }
  animationLoop (delta) {
    __mpixi.frame0.aux.delta = delta;
    for (let i=0; i < this.frame0.videoloops.length; i++) {
      this.frame0.videoloops[i]()
    }
  }
  downloadInitialData () {
    let nodes = ['asd', 4, [33.4, 'tyu']];
    let links = [1,2,3,4];
    // ajax call or sparql TTM
    let data = {
      layout: 'spring',
      dim: 2,
      nodes: nodes,
      links: links,
      first: true,
      l0: [],
    };
    let af = (err, res) => {
      this.__mdata = res;
    }
    this.mkAjax('/mGadget/', data, af)
  }
  mkAjax (path, dataobj, afunc) {
    let turl = 'http://localhost:5000' + path
    HTTP.post(
      turl,
      { data: dataobj } ,
      afunc
    )
  }
  initCanvasText (texts) {
    console.log('in texts');

    this.texts = texts;
    let [x, y] = [900, 20];
    let dy = 20;
    this.textobjs = [];
    for (let i = 0; i < this.texts.length; i++) {
      let t = this.texts[i]
      let to = new PIXI.Text(t.mkline(),{fontFamily : 'Arial', fontSize: 18 * this.canvas.scaleheight, fill: 0xffffff, align : 'center'});
      to.tint = t.color;
      to.x = x * this.canvas.scalewidth;
      to.y = (y + dy * i) * this.canvas.scaleheight;
      to.interactive = true;
      to.buttonMode = true;
      if (!t.clicking) {
        to
          .on('pointerdown', OnDragStart(t.monclick))
          .on('pointerup', OnDragEnd(t.monclick))
          .on('pointerupoutside', OnDragEnd(t.monclick))
          .on('pointermove', OnDragMove(t.monclick));
      } else {
        to.on('pointerdown', OnDragStart2(t.monclick));
      }
      this.textobjs.push(to);
      this.canvas.app.stage.addChild(to);
    }
    
    this.frame0.videoloops.push(() => {
      for (let i = 0; i < this.texts.length; i++) {
        this.textobjs[i].text = this.texts[i].mkline()
      }
    })
  }
  initCanvasWidgets () {
    // a triangle toggles to square for play-stop
    // a loop button
    // a timeline where:
    // audiocursor, loop start and end, if looping.
  }
}

class MPixiBackground extends MPixi {
  constructor () {
    super();
  }
  initCanvasElements () {
    this.initCanvasBackground4();
    this.initCanvasBackground();
    this.initCanvasWidgets();
  }
  initCanvasBackground2 () {  // particles
    let app = this.canvas.app;
    let sprites = new PIXI.ParticleContainer(10000, {
      scale: true,
      position: true,
      rotation: true,
      uvs: true,
      alpha: true
    });
    let maggots = []; // all the sprites
    let totalSprites = 10;
    if (app.renderer.type == PIXI.RENDERER_TYPE.WEBGL) {
      totalSprites = 20;
    }
    for (let i = 0; i < totalSprites; i++) {
      // let dude = PIXI.Sprite.from('images/back2/Make_a_Star.jpg');
      // let dude = PIXI.Sprite.from('images/back2/maggot_tiny.png');
      if (typeof this.crowler === 'undefined') {
        if (Math.random() < 0.5) {
          this.crowler = 'images/back2/jesus2.jpg';
        } else {
          this.crowler = 'images/back2/jesus.jpg';
        }
      }
      let dude = PIXI.Sprite.from(this.crowler);
      dude.tint = Math.random() * 0xE8D4CD;
      window.dude = dude;
      dude.anchor.set(0.5);
      dude.scale.set((0.8 + Math.random() * 0.3) * 0.15);
      dude.x = Math.random() * app.screen.width;
      dude.y = Math.random() * app.screen.height;
      dude.tint = Math.random() * 0x808080;
      dude.direction = Math.random() * Math.PI * 2;
      dude.turningSpeed = Math.random() - 0.8;
      dude.speed = (2 + Math.random() * 2) * 0.2;
      dude.offset = Math.random() * 100;
      maggots.push(dude);
      sprites.addChild(dude);
    }
    this.maggots = maggots;

    // create a bounding box box for the little maggots
    var dudeBoundsPadding = 100;
    var dudeBounds = new PIXI.Rectangle(
      -dudeBoundsPadding,
      -dudeBoundsPadding,
      app.screen.width + dudeBoundsPadding * 2,
      app.screen.height + dudeBoundsPadding * 2
    );

    var tick = 0;

    app.ticker.add(function(delta) {
      for (var i = 0; i < maggots.length; i++) {
        var dude = maggots[i];
        dude.scale.y = (0.95 + Math.sin((tick + dude.offset) ) * 0.5 ) * 0.15;
        dude.direction += dude.turningSpeed * 0.01;
        dude.x += Math.sin(dude.direction) * 16 * (dude.speed * dude.scale.y);
        dude.y += Math.cos(dude.direction) * 16 * (dude.speed * dude.scale.y);
        dude.rotation = -dude.direction + Math.PI;
        // wrap the maggots
        if (dude.x < dudeBounds.x) {
          dude.x += dudeBounds.width;
        } else if (dude.x > dudeBounds.x + dudeBounds.width) {
          dude.x -= dudeBounds.width;
        }

        if (dude.y < dudeBounds.y) {
          dude.y += dudeBounds.height;
        } else if (dude.y > dudeBounds.y + dudeBounds.height) {
          dude.y -= dudeBounds.height;
        }
      }
      tick += 0.1;
      __mpixi.canvas.app.renderer.render(__mpixi.canvas.app.stage);
    });
    return sprites;
  }
  initCanvasBackground () {
    const app = this.canvas.app;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const p = [
      [ 0, 0 ],
      [ cw, 0 ],
      [ cw * 0.8, ch * 0.7 ],
      [ cw * 0.2, ch * 0.7 ],
    ];
    const pnew = [
      [ cw * 0.1, 0 ],
      [ cw * 0.9, 0 ],
      [ cw * 0.7, ch * 0.7 ],
      [ cw * 0.3, ch * 0.7 ],
    ];
    const cw0 = cw * 0.1;
    const cw1 = cw * 0.9;
    const p1 = pnew;
    const p2 = [
      [0, p[2][1] * 0.75],
      [(p[3][0] - cw0) * 2.3, p[2][1] - (ch - p[3][1]) * 1.5],
      p[3],
      [cw0, ch]
    ];
    let p3 = [
      pnew[3],
      pnew[2],
      [cw1 - cw0 * 0.95, ch],
      [cw0 * 1.95, ch] 
    ];
    let p4 = [
      [cw - (p[3][0] - cw0) * 2.3, p[2][1] - (ch - p[3][1]) * 1.5],
      [cw, p[2][1] * 0.75],
      [cw1, ch],
      [cw - p[3][0], p[3][1]]
    ];
    let pp = [p1, p2, p3, p4].map( proj => {
      return proj.map( point => {
        let pp_ = new PIXI.Point;
        pp_.set(point[0], point[1]);
        return pp_;
      });
    });
    let fnames = Backimages.find();
    let particlesprites = this.initCanvasBackground2();
    Meteor.apply("getBackfiles", [], (e, r) => {
      let backsprites = [];
      r.forEach( filename => {
        const containerSprite = new PIXI.projection.Sprite2d(
          PIXI.Texture.from('images/ets/' + filename)
        ); 
        containerSprite.mfilename = filename;
        containerSprite
          .on('pointerdown', function () {
            console.log('banana', this.mfilename); 
          });
        containerSprite.interactive = true;
        backsprites.push(containerSprite);
      })
      let backsprites_ = chooseUnique(backsprites).slice(
        backsprites.length - 5, backsprites.length
      );
      let backcontainer = new PIXI.Container();
      backcontainer.addChild(particlesprites);
      for (let bi = 0; bi < backsprites_.length; bi++) {
        let b = backsprites_[bi]
        backcontainer.addChild(b);
      }
      this.canvas.app.stage.addChild(backcontainer);
      app.ticker.add((delta) => {
        for (let bi = 0; bi < backsprites_.length; bi++) {
          let b = backsprites_[bi]
          b.proj.mapSprite(b, pp[bi]);
        }
      });
      this.initCanvasBackground3()
      this.initCanvasText(texts);
    });
    // containerSprite.proj.mapSprite(containerSprite, quad);
  }
  initCanvasBackground3 () {
    Meteor.apply("getBackdancers", [], (e, r) => {
      let backdancers = [];
      let mscale = 0.4;
      r.forEach( filename => {
        const containerSprite = new PIXI.projection.Sprite2d(
          PIXI.Texture.from('images/sprites/' + filename)
        ); 
        containerSprite.mfilename = filename;
        containerSprite.anchor.set(0.5, 1.0);
        containerSprite.proj.affine = PIXI.projection.AFFINE.AXIS_X;

        containerSprite.scale.set(0.3 * mscale, 0.5 * mscale);
        backdancers.push(containerSprite);
      })

      const app = this.canvas.app;
      const isoScalingContainer = new PIXI.Container();
      isoScalingContainer.scale.y = 0.5;
      isoScalingContainer.position.set(app.screen.width * 0.505, app.screen.height * 0.865);
      app.stage.addChild(isoScalingContainer);

      const isometryPlane = new PIXI.Graphics();
      isometryPlane.rotation = Math.PI / 4;
      isoScalingContainer.addChild(isometryPlane);

      isometryPlane.lineStyle(2, 0xff00ff);
      for (let i = 0; i < 100; i += 100) {
        isometryPlane.moveTo(-150, i);
        isometryPlane.lineTo(150, i);
        isometryPlane.moveTo(i, -150);
        isometryPlane.lineTo(i, 150);
      }
      isometryPlane.drawCircle(0, 0, 100);

      let fire = new PIXI.Graphics();
      fire.beginFill(0xFFFFFF);
      fire.drawCircle(0, 0, 170);
      fire.endFill()
      fire.scale.set(0.5 * mscale, 0.7 * mscale);
      fire.x = isometryPlane.x / 2;
      fire.y = isometryPlane.y / 2;
      isometryPlane.addChild(fire);

      let backdancers_ = chooseUnique(backdancers).slice(
        backdancers.length - 6, backdancers.length
      );
      backdancers_.forEach( d => {
        isometryPlane.addChild(d);
        d.interactive = true;
        d.on('pointerdown', moveSprite);
      });
      // put fire

      let step = 0;
      let sep = 2 * Math.PI / 5
      app.ticker.add((delta) => {
        step += delta;
        for (let i = 0; i < backdancers_.length; i++) {
          let sprite = backdancers_[i];
          const speed = 0.005;
          const angle = step * speed + sep * i;
          let aval = Math.sin(angle);
          fire.tint = 0xFF0000 + Math.floor(aval * (0x009999));
          sprite.rotation = step * 0.05;
          const radius = 100;
          let py = Math.sin(angle) * radius;
          if (sprite.jumping) {
            py -=  60 * Math.sin(Math.PI * sprite.perturbation++ / 200);
            if (sprite.perturbation == 200) {
              sprite.jumping = false;
              delete sprite.perturbation;
            }
          }

          sprite.position.set(
            Math.cos(angle) * radius,
            py
          );
        }
      });
    });
    // const sprite3 = new PIXI.projection.Sprite2d(PIXI.Texture.from('images/sprites/queen.png'));
    // sprite3.anchor.set(0.5, 1.0);
    // sprite3.proj.affine = PIXI.projection.AFFINE.AXIS_X;
    // sprite3.scale.set(0.3, 0.5);
  }
  initCanvasBackground4 () {
    const landsScape = new PIXI.Sprite(
      PIXI.Texture.from(
        'images/back0/' + chooseUnique([
          'business.jpg',
          'alieneye.jpg',
          'cows3.jpg',
          'cows3.jpg',
          'cows.jpg',
          'extasy.jpg',
          'indu.jpg',
          'jumbo.jpg',
          'saints.jpg',
          'saints2.jpg',
          'saints3.jpg',
          'sheep.jpg',
          ], 1
        )[0]
      )
    ); 
    landsScape.width = this.canvas.width;
    landsScape.height = this.canvas.height;
    landsScape.tint = 0xaaaaaa;
    this.canvas.app.stage.addChild(landsScape);
  }
  initCanvasWidgets () {
  }
}


let mpixi = new MPixi();
let mpixib = new MPixiBackground();


export { PIXI, mpixi, mpixib };
