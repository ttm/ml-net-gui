import { MPIXIE, PIXI } from './extended.js';
import { chooseUnique } from '../utils.js';

import { moveSprite } from './helpers.js';

export { MPIXIBDancers, PIXI }; // to be user by pixitone.js

class MPIXIBg extends MPIXIE {
  constructor () {
    super();
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
    this.frame1.bg = [];
    this.frame1.bg.push( { landsScape , desc: 'wallpaper'});
  }
}

class MPIXIBgSprites extends MPIXIBg {
  constructor () {
    super();
    let app = this.canvas.app;
    let sprites = new PIXI.ParticleContainer(10000, {
      scale: true,
      position: true,
      rotation: true,
      uvs: true,
      alpha: true
    });
    this.canvas.app.stage.addChild(sprites);
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
    let dudeBoundsPadding = 100;
    let dudeBounds = new PIXI.Rectangle(
      -dudeBoundsPadding,
      -dudeBoundsPadding,
      app.screen.width + dudeBoundsPadding * 2,
      app.screen.height + dudeBoundsPadding * 2
    );

    let tick = 0;
    let self = this;
    this.frame0.videoloops.push( (delta) => {
      for (let i = 0; i < maggots.length; i++) {
        let dude = maggots[i];
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
      app.renderer.render(app.stage);
    });
    let crowler = this.crowler;
    this.frame1.bg.push({
      maggots, // the individual sprites
      sprites, // the particle container
      totalSprites, // number of sprites
      crowler, // file that is being loaded at each sprite/particle
      desc: 'particles on wallpaper',
    });
  }
}

class MPIXIBPanels extends MPIXIBgSprites {
  constructor () {
    super();
    let pp = this.mkPanelPoints();
    Meteor.apply("getBackfiles", [], (e, r) => {
      let els = this.initBackgroundPanels(r, pp);
      this.frame1.bg.push({
        pp: pp,
        container: els[0],
        sprites: els[1],
        desc: '3d panels',
      });
    });
  }
  mkPanelPoints () {
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
    return [p1, p2, p3, p4].map( proj => {
      return proj.map( point => {
        let pp_ = new PIXI.Point;
        pp_.set(point[0], point[1]);
        return pp_;
      });
    });
  }
  initBackgroundPanels (r, pp) {
    let backsprites = [];
    r.forEach( filename => {
      const containerSprite = new PIXI.projection.Sprite2d(
        PIXI.Texture.from('images/ets/' + filename)
      ); 
      containerSprite.mfilename = filename;
      containerSprite
        .on('pointerdown', function () {
          console.log('banana', this.mfilename); 
          // say something! TTM
        });
      containerSprite.interactive = true;
      backsprites.push(containerSprite);
    });
    let backsprites_ = chooseUnique(backsprites).slice(
      backsprites.length - 5, backsprites.length
    );
    let backcontainer = new PIXI.Container();
    for (let bi = 0; bi < backsprites_.length; bi++) {
      let b = backsprites_[bi]
      backcontainer.addChild(b);
    }
    const app = this.canvas.app;
    app.stage.addChild(backcontainer);
    this.frame0.videoloops.push( (delta) => {
      for (let bi = 0; bi < backsprites_.length; bi++) {
        let b = backsprites_[bi];
        b.proj.mapSprite(b, pp[bi]);
      }
    });
    return [backcontainer, backsprites_]
  }
}

class MPIXIBDancers extends MPIXIBPanels {
  constructor () {
    super();
    Meteor.apply("getBackdancers", [], (e, r) => {
      let els = this.initCanvasDancers(r);
      this.frame1.bg.push({
        isoScalingContainer: els[0],
        isometryPlane: els[1],
        fire: els[2],
        sprites: els[3],
        desc: 'circular dancers',
      });
    });
  }
  initCanvasDancers (r) {

    const app = this.canvas.app;
    const isoScalingContainer = new PIXI.Container();
    isoScalingContainer.scale.y = 0.5;
    isoScalingContainer.position.set(app.screen.width * 0.505, app.screen.height * 0.865);
    app.stage.addChild(isoScalingContainer);

    const isometryPlane = new PIXI.Graphics();
    isometryPlane.sortableChildren = true;
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

    let mscale = 0.4;
    let fire = new PIXI.Graphics();
    fire.beginFill(0xFFFFFF);
    fire.drawCircle(0, 0, 170);
    fire.endFill()
    fire.scale.set(0.5 * mscale, 0.7 * mscale);
    fire.x = isometryPlane.x / 2;
    fire.y = isometryPlane.y / 2;
    isometryPlane.addChild(fire);

    let backdancers = [];
    r.forEach( filename => {
      const containerSprite = new PIXI.projection.Sprite2d(
        PIXI.Texture.from('images/sprites/' + filename)
      ); 
      containerSprite.mfilename = filename;
      containerSprite.anchor.set(0.5, 1.0);
      containerSprite.proj.affine = PIXI.projection.AFFINE.AXIS_X;

      containerSprite.scale.set(0.3 * mscale, 0.5 * mscale);
      backdancers.push(containerSprite);
    });
    let backdancers_ = chooseUnique(backdancers).slice(
      backdancers.length - 6, backdancers.length
    );
    backdancers_.forEach( d => {
      isometryPlane.addChild(d);
      d.interactive = true;
      d.on('pointerdown', moveSprite);
    });

    let step = 0;
    let sep = 2 * Math.PI / 5;
    let mark1 = 3 * Math.PI / 4;
    let mark2 = 7 * Math.PI / 4;
    this.frame0.videoloops.push( (delta) => {
      step += delta;
      for (let i = 0; i < backdancers_.length; i++) {
        let sprite = backdancers_[i];
        const speed = 0.005;
        const angle = ( step * speed + sep * i ) % ( 2 * Math.PI );
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
        sprite.zIndex = py;
        sprite.position.set(
          Math.cos(angle) * radius,
          py
        );
      }
    });
    return [ isoScalingContainer, isometryPlane, fire, backdancers_ ];
  }
}
