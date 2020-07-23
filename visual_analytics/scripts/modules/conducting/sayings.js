/* global wand */
// if not logged in, block and show the guards message:
const guards = `
You stand by the gates of Lycorea.

The wind is strong, but you are confortable in your vestments, you knew that you
would be for some time at ~2,500 meters above the ocean.

Five guards come near you, inspects your clothes, and, with respect the chief says:

"Congratulation on reaching Lycorea, dear sage.
We cannot allow you any further without knowing who you are.
Please identify yourself ('login' using the wand extension).
Thus please visit the 'Gradus ad Parnassum' (and install the chrome extension)
if you cannot identify yourself.
"

`
const deucalion = `
You meet Deucalion at the entrance of Lycorea.

He salutes you. And says:

"Welcome to Mount Parnassus.
Many of our best sages have undertaken this journey.
In fact, this is known as 'Gradus ad Parnassum', which entails a summit entities related to Apollo and Dionysus,
as they say, but not only. It depends on your path of lore.

Your Gradus ad Parnassum is dedicated to acquiring intimacy with your social body,
your social organism. It involves exploring the structures, making audiovisual music,
and exploiting your social self to render results, whatever results you conceive.

I give you community the detection relic, use it until you see all your communities.
Come back to me to talk to Lycorus, he is interested in your alertness and appreciation of your collective existence."

(click the info button again)
`

const lycorus = () => `
Deucalion introduces you to Lycorus.
You have heard of the son of Apollo and the nymph Corycia,
and halts waiting for his reaction while he finishes eating.

He then evaluates the landscape for a minute, and approahes you and Deucalion.

"Dear ${wand.sageInfo.name}, thou art a Sage, and I appreciate you for it.
Deucalion have already given you a relic. I'll give you the subcommunity detection gem,
use it a number of times in some communities.
Visit me again, I'll take you to my mother. She told me about your arival and has a message from the muses of Thytorea."

(click the info button again)
`

const corycia = () => `
Lycorus takes you to Corycia, his mother, a known and wise nymph.

She has animals, and two battalions and musical instruments, all bare-skinned.

She starts a song, from which you hear:

"Oh, ${wand.sageInfo.name}, ${wand.sageInfo.name}, ${wand.sageInfo.name},
thy route is but through knowledge and art,
the Muses, oh the Muses of Thytorea desire your company,
blessed be.
Have this magic lyre, with which you shall exercise to meet them.

(click the info button again)
`

module.exports = { deucalion, corycia, lycorus, guards }
