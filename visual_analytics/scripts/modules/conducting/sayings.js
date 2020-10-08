/* global wand */
// if not logged in, block and show the guards message:
const guards = `
You stand by the gates of Lycorea.

The wind is strong, but you are confortable in your vestments, you knew that you
would be for some time at ~2,500 meters above the ocean.

Five guards come near you, inspect your clothes, and, with respect the chief says:

"Congratulation on reaching Lycorea, dear sage.
We cannot allow you any further without knowing who you are.
Please identify yourself ('login or pray' using the wand extension).
Thus visit the 'Gradus ad Parnassum' (and install the chrome extension)
if you cannot identify yourself."

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

I give you the community detection relic, use it until you see all your communities.
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

const andromedans0 = `
You are now seeing andromedas.

The smallest of them are like building-sized butterflies.
Their wings move very gently while they glide through space,
healing every body and soul which are near or within.

Their energy (or material support) is spread and subtle.
In fact, their body goes through humans and human constructions.
You can sometimes feel their presence through emotions, intuitions,
or very suble perception cues, such as though the skin and body hair.

Please be attentive to your synchronization because later on
you will meet Sananda to synchronize the Universe.

Don't fear the reptilians, or as you name/conceive, or any other challenge.
These palpations of your social structures will cast pure healing light on all.

(Pray using the wand to load your network).
`

// https://en.wikipedia.org/wiki/Bahamut
const arcturians0 = `
This is a call from and visit by al-Rayan and Balhu.
They are our mammal-like and fish-like ancestors in the multiverse.

The Angel invites to the riches from the ruby.

Hope you meet Sananda, he can synchronize your social structures
to further well being and abuncancy for all in your inner and social selves and beyond.
Humanity will suffer sorely if we do not succeed.

First, you need to massage your social structures.
A social do-in, acumputure or shiatsu.

You now receive the Ankh, the key to immortality.
Use it well. You can use it at any time, and thorough deeds
lie ahead of you.

When you hit the info button above,
keep track of the instructions (tips) and
the features achieved.
For now, you will thrive among the Arcturians,
and will heal your social structures using their music
and dances.

Welcome. """

Says the Arcturian Council representative to you.
`

const arcturians1 = `
You can interact with your networks by exploration:
  . with analyzis; or with
  . midia generation / absorption,
or by synergy:
  . by diffusion; or by
  . syncronization.

Synchronization meaning a process in which you have
an expected (or idealized) result, such as maturing a concept or framework,
building a community, getting a project done, having an event happen.

A diffusion is most often a synchronization: you want feedback messages,
you want to create derivatives.
A synchronization most often involves a fund, a monetary crowdsourcing (crowdfunding).
A synchronization often involves an information crowdsourcing, for example
to mature an idea, to find partners or sponsors, to understand how a proposal is accepted.

The diffusion of goods may be essentially a diffusion (e.g. selling a product),
although it most often is a synchronization (e.g. a community of buyers, art, or research).

:::
`

module.exports = { deucalion, corycia, lycorus, guards, andromedans0, arcturians0, arcturians1 }
