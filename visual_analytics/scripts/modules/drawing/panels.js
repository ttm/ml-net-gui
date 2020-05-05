let chooseUnique = require('./utils').chooseUnique

let mkPanelPoints = function (app) {
    // todo: make this function parametrizable, maybe as a class with initBackgroundPanels()
    const cw = app.view.width;
    const ch = app.view.height;
    console.log('HEEEYYY', cw, ch)
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

let initBackgroundPanels = function (app) {
    let pp = mkPanelPoints(app)
    console.log('tpp:', pp)
    // todo: make other sets of images, to be used as themes or skins.
    let filenames = ['01_arcturian.jpg', '07_pleiadian-souls.jpg', '02_arcturian2.jpg', '08_Sirian-Pleiadian2.jpg', '03_arcturians.jpeg', '09_someet.jpg', '04_arcturians2.jpg', 'arcturianhelp.jpg', '05_med.jpg', 'pleiadians-and-arcturiansD.jpg', '06_pleiadian-arcturians.jpg']
    let backsprites = [];
    filenames.forEach( filename => {
      const containerSprite = new PIXI.projection.Sprite2d(
        PIXI.Texture.from('assets/images/ets/' + filename)
      ); 
      containerSprite.mfilename = filename;
      containerSprite
        .on('pointerdown', function () {
          console.log('banana', this.mfilename); 
          // fixme: say something! (or do something)
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
    app.stage.addChild(backcontainer);
    app.ticker.add( (delta) => {
      for (let bi = 0; bi < backsprites_.length; bi++) {
        let b = backsprites_[bi];
        b.proj.mapSprite(b, pp[bi]);
      }
    });
    return [backcontainer, backsprites_]
}
exports.use = { initBackgroundPanels }
exports.share = { chooseUnique }
