export function chooseUnique (marray, nelements) {
  let i = marray.length;
  if ( i == 0 )
    return false;
  let c = 0;
  let choice = []
  while ( --i ) {
   let j = Math.floor( Math.random() * ( i + 1 ) );
   let tempi = marray[i];
   let tempj = marray[j];
   choice.push(tempj);
   marray[i] = tempj;
   marray[j] = tempi;
   c++;
   if (c == nelements)
    return choice;
   }
  return choice
}

class Sayings {
  constructor () {
    this.sayings = {
      tempo: {}, // for sayings without classification
      right: {},
      left: {},
      up: {},
      down: {},
      balance: {},
    };
  }
  mkTxtObjs () {
    this.addSaying( // channel, text, class, [more] );
      'Wallace Delois Wattles, 1910',
      'The pendulum of the clock swings a certain distance to the right, and then an equal distance to the left. The seasons balance each other in the same way. The tides follow the same Law. And the same Law is manifested in all the phenomena of Rhythm.',
      'balance',
    )
    this.addSaying(
      'Three Initiates, 1912',
      'The pendulum of the clock swings a certain distance to the right, and then an equal distance to the left. The seasons balance each other in the same way. The tides follow the same Law. And the same Law is manifested in all the phenomena of Rhythm.',
      'right',
    )
    this.addSaying(
      'The Pleiadian-Sirian-Arcturian Council of Light',
      'We are here to insure that all technologies received from us are in the right hands, to move humanity forward in the areas o Peace, Purity of air, water and earth, food supplies, health, prosperity and reverence for all and quality of life.',
      'right',
    )
    this.addSaying(
      'The Arcturians',
      [
        'Now, look at your future, fifth-dimensional self on the right screen.',
        'It is difficult to talk about measuring thought power on Earth right now because there are no accurate tools to measure thought',
      ],
      'right',
    )
    this.addSaying(
      'The Arcturians',
      [
        'When he was on the cross, he left his physical body, and when that physical body died, he continued to live on Earth in his multidimensional body.',
        'You have no ego attachments left on Earth, and you have completed all Earth lessons to the best of your ability.',
        'divide the screen again, this time with your present self projected on the left.',
      ],
      'left',
    )
  }
  addSaying (channel, text, kin = 'tempo', more = []) {
  }
}
