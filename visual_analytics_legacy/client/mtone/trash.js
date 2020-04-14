// make sure this is not running...
// from mytone/synths.js creation:
      // filter: function () {
      //   let filter = new Tone.Filter({
      //     type : 'bandpass',
      //     Q : 12
      //   }).toMaster();

      //   let noise = new Tone.Noise("brown").connect(filter);
      //   noise.fadeIn = 100;
      //   noise.fadeOut = 100;
      //   filter.fadeIn = 100;
      //   filter.fadeOut = 100;
      //   noise.start();
      //   noise.playbackRate = chooseUnique([
      //     1024, 257, 512, 511, 1013, 254
      //   ], 1)[0]
      //   function triggerSynth(time){
      //     if (Math.random() < 0.2) {
      //       noise.playbackRate = chooseUnique([
      //         1024, 257, 512, 511, 1013, 254
      //       ], 1)[0]
      //     }
      //     filter.frequency.setValueAtTime('C4', time + 0);
      //     filter.frequency.setValueAtTime('E5', time + 0.5);
      //     filter.frequency.setValueAtTime('G7', time + 1);
      //     filter.frequency.setValueAtTime('B2', time + 1.5);
      //     filter.frequency.setValueAtTime('C3', time + 1.9);
      //     noise.volume.setValueAtTime(-140, time + 0);
      //     noise.volume.linearRampToValueAtTime(0, time + 0.5);
      //     noise.volume.linearRampToValueAtTime(-140, time + 1);
      //     noise.volume.linearRampToValueAtTime(20, time + 1.5);
      //     noise.volume.linearRampToValueAtTime(-140, time + 2.1);
      //     // noise.stop(time + 1.95);
      //   }
      //   // Tone.Transport.schedule(triggerSynth, 1);

      //   return [noise, filter];
      // }(),
