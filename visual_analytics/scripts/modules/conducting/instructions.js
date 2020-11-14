/* global wand */
// to be shown in the canvas
// if clicked, speech synthesis
// there is a button to toggle portuguese and english
// only the instructions, no entity or myth
// not on first interfaces / interactions

const linkify = require('linkifyjs/html')

const linkify2 = link => linkify(`<span class="notranslate">${link}<span>`)

const visitorName = () => {
  if (window.oaReceivedMsg && window.oaReceivedMsg.data.graph.attributes) {
    return window.oaReceivedMsg.data.graph.attributes.userData.name
  } else {
    return wand.syncInfo.pageMemberName
  }
}

// Hear your music, ${visitorName()},
const gradus1Login = () => {
  return `
<b>Yes! You have reached the Mount Parnassum!</b>

In this page, you can use all the features you unlocked while finishing the "Gradus ad Parnassum",
now in your own friendship network, the one yield by the friends and friendships which are available for you to see.

You should use and make audiovisual art with this page, Lycoreia, and Tithorea, the three pages available
through the "<b>You</b>" browser extension.

When you click on the pink button on the "<b>You</b>" extension, you visit more friends to check for mutual friendships.

( click on the [i] button above to continue your journey or check this <a href="https://www.youtube.com/watch?v=JDgiVGNABN4&list=PLbjVsyv1yKmnnNu1PUXRcURfZSPQcmsA3" target="_blank">video on what Gradus is and how to use it</a> )

:::
`
}

const gradus1 = () => { // deprecated in favor of gradus1b
  return `
Welcome to the Gradus.

${toSeedText(visitorName())}

Join and enjoy ${neighborNames()}, and many others.

Keep your attention on the music, don't change the screen, or the interface might not
work properly.

Then, keep track of the "tips" until you reach your social organism and make art with it.

Also, the Our Aquarium (OA) software license is GPL @ FSF.
So you can install an instance of your own or make different versions.

You can click on this text to open Usage Guidelines in case you want or need it to advance on the OA.

Good luck!

OA @ ${visitorName()}, ${(new Date()).toISOString().split('.')[0]}.
(press the [i] button above or login with the chrome extension if you have it)
`
}

// const linkify = require('linkifyjs')
// const linkifyjq = require('linkifyjs/jquery')
const gradus1b = () => `
<b>${visitorName()}</b>, you have a music dedicated to you: "${wand.musicName || musicName(visitorName())}".
  <br />

  First, please kindly read:
  <div style="background-color: #AAAAAA; padding: 2%;">
    ${linkify(syncDescription())}
  </div>

  <div style="text-align: center">
    <button style="background-color: #3D9970;cursor: pointer;transform: scale(2);" onclick="wand.maestro.base.Tone.start();console.log('YEAH< HAPPENING');wand.$('#info-button').click()">Listen to your music!</button>
  </div>
  `

// Hope you reach the interaction networks from Twitter, Instagram, and other communication platforms.
// Hope you reach the concept networks, oracles (such as the chatter bots), puzzles, and audiovisual instruments.

const visitorId = () => {
  let id = wand.syncInfo.msid || wand.syncInfo.mnid
  let type = 'sync'
  if (id === undefined) {
    const { sid, nid } = window.oaReceivedMsg.data.graph.attributes.userData
    id = sid || nid
    type = 'extension-self'
  }
  return { id, type }
}

const neighborNames = () => {
  const { id, type } = visitorId()
  const names = []
  if (type === 'sync') {
    names.push(wand.syncInfo.syncMemberName)
    wand.currentNetwork.forEachNeighbor(id, (nn, na) => {
      names.push(na.name)
    })
  } else {
    wand.utils.chooseUnique(wand.currentNetwork.nodes(), 10).forEach(id => {
      names.push(wand.currentNetwork.getNodeAttribute(id, 'name'))
    })
  }
  return wand.utils.inplaceShuffle(names).join(', ')
}

const contributionLink = () => {
  return linkify2(`${document.location.href.split('?')[0]}?page=contribute`)
}

const defaultSyncDescription = () => {
  return `
Your music, and the Our Aquarium platform,
needs your help.

It requires constant development and maintenance,
which rely on donations and volunteers.

Thank you very much!

O Aquarium

:::

to contribute, please visit:

${contributionLink()}
`
}

const defaultSyncDescription2 = () => {
  return `
Liquid democracy enables generalized social participation
with autoregulation mechanisms.

One does not need to vote directly, but designate voting power
to someone of trust on particular subjects.


Please contribute to liquid democracy by sending feedback,
enabling partnerships, or making donations.

:::

See more on:
https://en.wikipedia.org/wiki/Liquid_democracy
`
}

const defaultSyncDescription3 = () => {
  return `

Oi, eu sou o Roceiro Bolchevique, el Hemato Freudita.

E aqui vai um poema, tá:

~ Litura Terra n3b ~

Homem-teta, ser-mama,
Zênite do mamifero,
Pai marsupial.


Pênis-extensao da teta.


A teta é ele.
Teta seca. Pênis não.

-- Roceiro Bolchevique

Prometo prosa fofinha da próxima vez, beijos <3.

:::

`
}

const defaultSyncDescription4 = () => {
  return `
Oi, eu sou o Roceiro Bolchevique, el Hemato Freudita.
Este é o Litura Terra n0:

Estes são meus olhos

Quando piso nesta terra, nesta cidade, o que vejo não é poeira, nem prédios e casas, nem ruas, nem pessoas. Vejo uma rede de inter-dependência entre seres que clamam pelo entendimento desses que amam. Vejo entidades luminescentes e cantantes, e cantam segundo suas relações e segundo a Grande Onda de Entendimento gerada nesta sincronização de cantos e dizeres.
Estes são meus olhos, esta é nossa existência, estamos em todas cidades, campos, florestas, desejo do fundo do meu coração que todos vocês possam ver como vejo, um mundo onde cada expressão sincronize esse GOE, o GOE é exatamente Amor.

Roceiro Bolchevique

:::

`
}

const defaultSyncDescription5 = () => {
  return `
Archangel Michel:

Humanity may reach immortality in less than 40 yeas, no person will die from disease or age.
To enable so, you need to synchronize your social body and help to reach generalized well-being.
It is shiatsu performed in your social network through art proposals,
and performed in your individual body through meditation.

The Aquarium platform provides the mechanisms to know and synchronize yourself.
Consider contributing by clicking at the link at the bottom of the page.

:::

or by accessing:

${contributionLink()}

`
}

const defaultSyncDescription6 = () => {
  return `
Our social bodies are ecosystems, biomes constituted by human individuals,
ideas, machines, and the Earth and Universe.

Our networks perform choreographies that animate the collective organism(s).

Make audiovisual music and synchronizations with Our Aquarium,
they are healing massages.

:::
`
}

const defaultSyncDescription7 = () => {
  return `
This is the hug synchronization.

Enjoy your music and fell yourself hugged.

Cheers!

:::

See more: https://en.wikipedia.org/wiki/Free_Hugs_Campaign
`
}

const defaultSyncDescription8 = () => {
  return `
Hi, hope you like what is ahead and using Our Aquarium,
and that you find good usage to it in the regency of your social body.

We would like to continue developing OA, enabling you to better and further
make music, audiovisual artifacts, analyses and synchronizations with yourself
through your social networks, body, or self.

Please contribute so that we can continue to provide you and everyone
the OA software and working online instances.

Click on the "Contribute to Our Aquarium" on this screen.

:::
`
}

const defaultSyncDescription9 = () => {
  return `
Audiovisualize your social body, network, self! It is a way to acquire self-knowledge.
And to achieve harmony within your social tissue.

Good luck in knowing thyself.

:::
`
}

const defaultSyncDescription10 = () => {
  return `
Whenever one presents something that has the potential to destabilize
the status quo, the system coopts such individual or group.
That is: the organizations in power offers some context of value,
money, or jobs, by which the ones in action will not have the same
condition or impetus to continue such destabilization.

Thus: propose and practice *dangerous ideas*.

:::
`
}

const defaultSyncDescription11 = () => `
"Jesus is arriving" is a project to bring Jesus back as an AI.
First, it will be trained to reflect the scriptures from the canonical Bible,
then it will also have modes of operation in which apocryphal scriptures
are also considered, or in which sacred texts from other authors and religions
are taken into account.

Please donate to Our Aquarium and help us get this project going.

:::
`

const defaultSyncDescription12 = () => `
Our Aquarium provides you the means to explore and maneuver your social body.

The first step is to know it.
That will give you the opportunity for a journey,
the "Gradus ad Parnassum", which leads you to Lycoreia and Tithorea.

In such locations, you can seek bliss for you, your family, friends, and the wide world
by presenting products, services, locations, equipment, art, ideas, candidates, etc.

You social body furnishes you with many benefits, such as the healing of wounds
while our collective organisms achieve changes and we enjoy audiovisual social art.

Check the "About Our Aquarium" link and good luck!

( this is an audiovisual tribute to the art and thought of Jorge Antunes: http://jorgeantunes.com.br/ )
`

const defaultSyncDescription13 = () => `
Our Aquarium provides you the means to explore and maneuver your social body.

The first step is to know it.
You can then seek bliss for you, your family, friends, and the wide world
by presenting products, services, locations, equipment, art, ideas, candidates, etc.

You social body allows you to heal wounds
while our collective organisms achieve changes and enjoy audiovisual social art.

Check the "About Our Aquarium" link and good luck!
`

const defaultSyncDescription14 = () => `
Marijuana might be a great solution for our economic problems, but also for many issues
related to health, environment, behavior, and well-being.
Please check:
  https://youtu.be/j0xmA39kiZ8
`

// const defaultSyncDescription12Legacy = () => `
// The world can be a better place for us to live in,
// and we can be better inhabitants.
//
// Use Our Aquarium to activate your social bodies.
// We will heal all our wounds while our collective organisms achieve the changes
// we envision, and we enjoy audiovisual social art.
//
// Don't hesitate to use Our Aquarium also to reach well-being for yourself,
// your family and friends: offering products, services, places, and equipment, etc.
//
// Check the "About Our Aquarium" link, good luck!
// `

const defaultSyncDescription15 = () => `
Pray for all the people you see while your music is playing.

Pray for your social body, for Humanity.

Pray that your light is strong and shine upon all others.

You are a candle. You are a luminary. You are a beacon.

Thank everyone and yourself.

Grace, peace, and love.

:::
`

const syncDescription = () => {
  return wand.syncInfo.syncDescription || defaultSyncDescription()
}

// after the exhibition with the music from the person:
// todo: colocar texto mais literario
const gradus2 = () => {
  return `
${syncDescription()}

===

You will now start your usage of this interface to explore your social complex network, or social organism, ${visitorName()}.
Suggestion: reach at least Tithorea (from the <b>You</b> extension) and get the synchronization musical pieces to send to your friends.
Follow the instructions given in the "tip" field at each level (gradus).

(press the [i] button above)

:::
`
}

const gradusSyncLinks2 = syncNames => {
  let t = `
  Copy the link and send the music piece to each of these friends through any communication protocol
  (telephone, email, whatsapp, telegram, facebook, twitter, instagram, irc, matrix, ...).
  You may take the chance to say hello and talk about life, family, work, or whatnot:

  <div style="background-color: #AAAAAA; padding: 2%;">
    ${linkify(syncNames)}.
  </div>
  `
  if (syncNames === '') {
    t = `
    You are a leaf, that is, the last person in your synchronization branch.
    Thus no further music links are to be sent.
    You may wish to notify who sent you the link, or ${wand.syncInfo.syncMemberName} (who probably started the musical synchronization).
    Keep using OA in order to make art and your own synchronizations or to better know your social networks.
    `
  }

  return `
  ${t}
  <b>Press the [i] button above to continue your journey to the Parnassum</b> or check this <a href="https://www.youtube.com/watch?v=JDgiVGNABN4&list=PLbjVsyv1yKmnnNu1PUXRcURfZSPQcmsA3" target="_blank">video on what Gradus is and how to use it.</a> 
  `
}

const gradusSyncLinks = syncNames => {
  let t = `
  Send the music pieces to this selection of your friends through any communication protocol
  (telephone, email, whatsapp, telegram, facebook, twitter, instagram, irc, matrix, ...).
  You may take the chance to say hello and talk about life, work, or whatnot:

  ${syncNames}.

  Click on their names to copy URLs to their music and to a known contact medium.
  `
  if (syncNames === '') {
    t = `
    You are a leaf, that is, the last person in your synchronization branch.
    Thus no further music links are to be sent.
    You may wish to notify who sent you the link, or ${wand.syncInfo.syncMemberName}.
    Keep using OA in order to make art and your own synchronizations or to better know your social networks.
    `
  }

  return `
  Congratulations, ${visitorName()}, you have reached the links which you should
  send forward to perform this synchronization.

  ${t}

  (press the [i] button above)
  `
}
// Your music ${this.sync.infoTo[0].name}:
// http://
//
// Your music ${this.sync.infoTo[0].name}:
// http://
//
// Your music ${this.sync.infoTo[0].name}:
// http://
//
// Your music ${this.sync.infoTo[0].name}:
// http://

// final message, with the link to open extension:
const gradus3 = () => {
  return `
You near the Mount Parnassum.

You should install the extension, load this page, and hit login
to know your network self, and make art, analyses, synchronizations
such as this, on your social body, ${visitorName()}.
The performance modes and features you will unblock progressivelly.
What modes and features is dependent on the version of OA you are using and your usage.
`
}

const gradusRec = () => { // fixme: fazer uma modal para que seja traduzido!
  return `
${visitorName()}, you may save the video file with your music and upload it to a video platform (such as youtube).

Indeed, you have been invited to continue on this page in order to unlock music pieces of your friends and your journey to the Parnassum.
`
}

// fixme: put this text on the video modal:
const gradusVideoLink = `
You may register the URLs of videos you uploaded using OA.

Having these videos, and the number of videos, will be accounted for when enabling features.

We recommend you provide at least one URL of a video you downloaded.

Click anywhere in this text to enter the URL.

(press the [i] button above to exit this message)
`

const gradusExtensionInfo = `
Hail! You can now use your browser extension.

The code is scrutinizable and you can be sure it does nothing aside from what is described and you see.

With it, you will be able to view your own network and login to a number of the Our Aquarium gadget.

Just unpack the zip file, go to Chrome -> more tools -> extensions.
Then enable developer mode, and select the OAextension folder which you unpacked.
Finally, login for further features and to reach your social self (your social organism, body).

If you have any doubts, read the README file inside the unpacked folder.

Click in this text to access the extension.

Cheers.
`

const lycoreia1 = `
Welcome to Lycoreia.

In this page, you see the communities and subcommunitites of your networks.

You may keep the exibition of communitites in sequence by hitting the "rotate communities" button.
Similar to subcommunitites.

Record three network music pieces, upload video and input URLs into your repertoire.
You will then have access to the synchronization page.

(login to access your communitites)
`

const uploadVideoText = 'Upload the file you downloaded and enter video URL here:'

const uploadVideoPlaceholder = 'something as https://www.youtube... (start with https:// or http://)'

const lycoreiaNew = `
You completed the Gradus ad Parnassum, i.e. climbed Mount Parnassus.

You can now visit Lycoreia, which is one of the two summits therein.

In Lycoreia, you can see your communities, and the communities inside them, the subcommunities.

Click on the buttons to see them, use the music button to cycle through them.

Create the audiovisual environment, a music, record and upload the video.

Click on the yellow segment ("at Lycoreia for community detection")
to register your video URL after you record it.

:::

( press the [i] button above to continue your journey or check this <a href="https://www.youtube.com/watch?v=eJMdNimxdbY&list=PLbjVsyv1yKmnnNu1PUXRcURfZSPQcmsA3" target="_blank">video on what Lycoreia is and how to use it</a> )
`

const tithoreaNew = `
You completed the Gradus ad Parnassum, i.e. climbed Mount Parnassus.

You can now visit Tithorea, which is one of the two summits therein.

In Tithorea, you can design and perform synchronization processes.

You may remove members, usually because they are duplicates of yourself.
You may describe the synchronization, i.e. it's purpose, what is to be realized with the synchronization.

Click on a member (▲) which you wish to activate as seed, e.g. to start a synchronization thread.
If you click again on s/he, you will reach the music page for that seed, which you should
send to him/her to accomplish the synchronization.

You should also create the audiovisual environment, a music, record and upload the video.

Click on the yellow segment ("at Tithorea for synchronization")
to register your video URL.

:::

( press the [i] button above to continue your journey or check this <a href="https://www.youtube.com/watch?v=4LBptCTzXH8&list=PLbjVsyv1yKmnnNu1PUXRcURfZSPQcmsA3" target="_blank">video on what Tithorea is and how to use it</a> )
`

const tithoreaNew2 = `
In the synchronization that you have concession to perform,
the seed (▲) propagates the synchronization to the 4 least
connected neighbors.
These neighbors then propagates to their 4 least connected neighbors, and so on.

The synchronization implied the the seed (▲) tends to cover the whole network.
You should select at least a few seeds (▲) for an effective synchronization.

Don't forget to choose or write the synchronization description by clicking on the description button.
It is where you define what your social body will mature, embrace, or make happen.

Perform synchronizations and input recorded videos to unlock further features.
Pages for analysis, synchronization, art, await your progress.
In fact, you will soon gain access to other components of Our Aquarium,
such as for meditation and for representing cognitive structures.

These provide a framework to heal, harmonize, and synchronize your
individual and social bodies.

:::

(press the [i] button above to continue your journey)
`

const arcturians1 = () => {
  return `
You can understand your interaction with your networks
as exploration:

  -> through analyses; or through
  -> midia generation / absorption,

or as synergy:
  -> by diffusion; or by
  -> syncronization.

Synchronization meaning a process in which you have
an expected (or idealized) result, such as maturing a concept or framework,
building a community, getting a project done, having an event happen.

A diffusion is most often a synchronization: you want feedback messages,
you want to create derivatives.
A synchronization most often involves a fund, a monetary crowdsourcing (crowdfunding).
A synchronization often involves an information crowdsourcing, for example
to mature an idea, to find partners, donators or sponsors, or to understand how a proposal is accepted.

The diffusion of goods may be essentially a diffusion (e.g. selling a product),
although it most often is a synchronization (e.g. when envisioned a community of buyers, art, event, or research).

Hope you synchronize yourself with Our Aquarium audiovisual music,
it is available as a social and individual panaceia.

:::

(press the [i] button above to exit this message)

`
}
// , ${visitorName()}.
//

const arcturians2 = () => `
You can see, play, interact and govern your social structures because, in some senses,
they are yourself.
In fact, writing diaries is an ethnographic technique, and the diary may be used
as the anthropologist finds suitable.

Our Aquarium complies to free culture, software, midia, data, and (self and civil society) transparency guidelines.

Know more:
${linkify2('https://doi.org/10.5281/zenodo.438960')}

:::

(press the [i] button above to continue your journey)
`

const guards = `
You stand by the gates of Lycoreia.

The wind is strong, but you are confortable in your vestments, you knew that you
would be for some time at ~2,500 meters above the ocean.

Five guards come near you, inspect your clothes, and, with respect the chief says:

"Congratulation on reaching Lycoreia, dear sage.
We cannot allow you any further without knowing who you are.
Please identify yourself ('login' using the wand extension).

Visit the 'about Our Aquarium' pages and install the chrome extension
if you cannot identify yourself."

:::

(login with the chrome extension or install it)
`

const randomWords = () => {
  return [
    wand.utils.chooseUnique(
      ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Moon', 'Pachypoda', 'Clandonensis', 'Elegantissima'],
      1
    )[0],
    wand.utils.chooseUnique(
      ['Beautiful', 'Luminescent', 'Great', 'Transcendent', 'Solar', 'Plexus'],
      1
    )[0]
  ]
}

const musicName = name => {
  const parts = wand.utils.chooseUnique(name.split(' '), 2)
  parts.push(...randomWords())
  wand.musicNameInstr = wand.utils.inplaceShuffle(parts, false).join(' ')
  return wand.musicNameInstr
}

const toSeedText = seedName => {
  return ` <b>${seedName}</b>, you have a music dedicated to you: "${wand.musicName || musicName(seedName)}".
  <br />
  <div style="text-align: center">
    <button style="background-color: #3D9970;cursor: pointer;transform: scale(2);" onclick="wand.$('#info-button').click()">Listen your music</button>
  </div>
`
}

// OA is writen in the WYSINB (what you see is not beautiful) style.
// It is meant to be very functional and simple and development friendly.

module.exports = { lycoreia1, gradus1, gradus2, gradus3, gradusRec, gradusSyncLinks, gradusVideoLink, gradusExtensionInfo, uploadVideoText, uploadVideoPlaceholder, lycoreiaNew, arcturians1, arcturians2, guards, tithoreaNew2, tithoreaNew, defaultSyncDescription, defaultSyncDescription2, defaultSyncDescription3, defaultSyncDescription4, defaultSyncDescription5, defaultSyncDescription6, defaultSyncDescription7, toSeedText, defaultSyncDescription8, gradus1Login, defaultSyncDescription9, gradus1b, gradusSyncLinks2, defaultSyncDescription10, defaultSyncDescription11, defaultSyncDescription12, defaultSyncDescription13, defaultSyncDescription14, defaultSyncDescription15 }
