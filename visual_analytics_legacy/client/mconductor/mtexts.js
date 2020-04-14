import Tone from 'tone';
import { mean } from 'mathjs';
export { texts };

let texts = [
  // TODO: make lines reactive: click and drag.
  {
    color: 0xff00ff,
    monclick (adif) {
    },
    mkline: function () {
      let p = __mc.mpixi.canvas.app.renderer.plugins.interaction.mouse.global;
      return `x: ${Math.floor(p.x)} y: ${Math.floor(p.y)}`;
    },
  },
  {
    color: 0xffff00,
    clicking: true,
    monclick (adif) {
      Tone.Transport.toggle();
    },
    mkline: () => {
      let t = Tone.Transport.seconds;
      let t2 = Tone.Transport.seconds / 60;
      return `Transport: ${t.toFixed(2)} secs (${t2.toFixed(2)} mins)`;
    }
  },
  {
    color: 0xffff00,
    monclick (adif) {
      Tone.Transport.toggle();
    },
    mkline: () => {
      let t = Tone.now();
      return `Session: ${t.toFixed(2)}`;
    }
  },
  {
    color: 0x0ffff0,
    clicking: true,
    monclick (adif) {
      let lats = __mc.mtone.frame0.islatency;
      let i = lats.indexOf( Tone.context.latencyHint ) + 1;
      let i_ = i % lats.length;
      let newlat = lats[ i_ ];
      Tone.context.latencyHint = newlat;
    },
    mkline: () => {
      let i_ = {
        interactive: 'low latency',
        playback: 'sustained playback',
        balanced: 'balanced',
        fastest: 'lowest latency'
      }[Tone.context.latencyHint];
      return `Latency: ${i_}`;
    }
  },
  {
    color: 0x0ffff0,
    clicking: true,
    monclick (adif) {
      let lats = __mc.mtone.frame0.islatency;
      let i = lats.indexOf( Tone.context.latencyHint ) + 1;
      let i_ = i % lats.length;
      let newlat = lats[ i_ ];
      Tone.context.latencyHint = newlat;
    },
    mkline: () => {
      let look = Tone.context.lookAhead;
      return `     ( Look ahead: ${look} sec )`;
    }
  },
  {
    color: 0xff000f,
    monclick (adif) {
      if (!window.timesigref) {
        window.timesigref = Tone.Transport.timeSignature;
      }
      let inc = Math.floor(adif / 20)
      Tone.Transport.timeSignature = window.timesigref + inc * 0.5;
      if (!this.dragging) {
        window.timesigref = null;
      }
    },
    mkline: () => {
      let s = Tone.Transport.timeSignature;
      return `time signature: ~ ${s} ( / 4 )`;
    }
  },
  {
    color: 0xff000f,
    monclick (adif) {
      if (!window.swingref) {
        window.swingref = Tone.Transport.swing;
      }
      let inc = Math.floor(adif / 20)
      Tone.Transport.swing = window.swingref + inc * 0.1;
      if (!this.dragging) {
        window.swingref = null;
      }
    },
    mkline: () => {
      let s = Tone.Transport.swing;
      let s2 = Tone.Transport.swingSubdivision;
      return `swing: ${s.toFixed(2)}  (subdivision: ${s2})`;
    }
  },
  {
    color: 0xff000f,
    monclick (adif) {
      if (!window.bpmref) {
        window.bpmref = Tone.Transport.bpm.get().value;
      }
      let inc = Math.floor(adif / 5);
      Tone.Transport.bpm.value = window.bpmref + inc;
      if (!this.dragging) {
        window.bpmref = null;
      }
    },
    mkline: () => {
      return 'BPM: ' + Tone.Transport.bpm.value.toFixed(2);
    }
  },
  {
    color: 0xbbbbbb,
    monclick (adif) {
    },
    mkline: () => {
      return '  ---- * ----'
    }
  },
  {
    color: 0xbf500f,
    monclick (adif) {
    },
    mkline: () => {
      if (!window.deltas) {
        window.deltas = Array(100).fill(Number(__mpixi.frame0.aux.delta));
        window.deltai = 0;
      } else {
        window.deltas[window.deltai] = __mpixi.frame0.aux.delta;
        window.deltai = (window.deltai + 1) % window.deltas.length;
      }
      let mean_ = mean(window.deltas);
      return 'delta: ' + mean_.toFixed(2);
    }
  },
];


