/* global wand */
// to be shown in the canvas
// if clicked, speech synthesis
// there is a button to toggle portuguese and english
// only the instructions, no entity or myth
// not on first interfaces / interactions

// starting message:

const visitorName = () => {
  if (window.oaReceivedMsg) {
    return window.oaReceivedMsg.data.graph.attributes.userData.name
  } else {
    return wand.syncInfo.pageMemberName
  }
}

const gradus1 = () => `
Welcome to the Gradus.

Hear your music, ${visitorName()},
join and enjoy ${neighborNames()}, and many others.

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
  // return document.location.origin + '/?page=donate'
  return `${document.location.href.split('?')[0]}?page=donate`
}

const defaultSyncDescription = () => `
Your music, and the Our Aquarium platform,
needs your help.

It requires constant development and maintenance,
which rely on donations and voluntaries.

Thank you very much!

O Aquarium

:::

to contribute, please visit:

${contributionLink()}
`

const defaultSyncDescription2 = () => `
Liquid democracy enables generalized social participation
with autoregulation mechanisms.

One does not need to vote directly, but designate voting power
to someone of trust on particular subjects.


Please contribute to liquid democracy by sending feedback,
enabling partnerships, or making donations.

:::

See more on:
https://en.wikipedia.org/wiki/Liquid_democracy#:~:text=Liquid%20democracy%20is%20a%20form,or%20proposed%20popular%2Dcontrol%20apparatuses.
`

const defaultSyncDescription3 = () => `

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

const defaultSyncDescription4 = () => `
Oi, eu sou o Roceiro Bolchevique, el Hemato Freudita.
Este é o Litura Terra n0:

Estes são meus olhos

Quando piso nesta terra, nesta cidade, o que vejo não é poeira, nem prédios e casas, nem ruas, nem pessoas. Vejo uma rede de inter-dependência entre seres que clamam pelo entendimento desses que amam. Vejo entidades luminescentes e cantantes, e cantam segundo suas relações e segundo a Grande Onda de Entendimento gerada nesta sincronização de cantos e dizeres.
Estes são meus olhos, esta é nossa existência, estamos em todas cidades, campos, florestas, desejo do fundo do meu coração que todos vocês possam ver como vejo, um mundo onde cada expressão sincronize esse GOE, o GOE é exatamente Amor.

Roceiro Bolchevique

:::

`

const defaultSyncDescription5 = () => `
Archangel Michel:

Humanity may reach immortality in less than 40 yeas, no person will die from desease or age.
To enable so, you need to synchronize your social body and help reaching generalized well-being.
It is a shistsu performed in your social network through art proposals,
and performed in your individual body through meditation.

The Aquarium platform provides the mechanisms to know and synchronize yourself.
Consider contributing by clicking at the link at the bottom of the page.

:::

or by accessing:

${contributionLink()}

`

const defaultSyncDescription6 = () => `
Our social bodies are ecossystems, biomes constituted by human individuals,
ideas, machines, and the Eath and Universe.

Our networks perform a choreographies which animates the collective organism(s).

Make audiovisual music and synchronizations with Our Aquarium,
they are healing massages.

:::
`

const defaultSyncDescription7 = () => `
This is the hug synchronization.

Enjoy your music and fell yourself hugged.

Cheers!

:::

See more: https://en.wikipedia.org/wiki/Free_Hugs_Campaign
`

const syncDescription = () => (wand.syncInfo.syncDescription || defaultSyncDescription())

// after the exhibition with the music from the person:
// todo: colocar texto mais literario
const gradus2 = () => `
${syncDescription()}

You will now start your usage of this interface to explore your social complex network, or social organism, ${visitorName()}.
Suggestion: reach at least your synchronization links.
Follow the instructions given in the "tip" field at each level (gradus).

(press the [i] button above)
`

const gradusSyncLinks = syncNames => `
Congratulations, ${visitorName()}, you have reached the links which you should
send forward to perform this synchronization.

Send to these friends through any communication protocol
(telephone, email, whatsapp, telegram, facebook, twitter, instagram, irc, matrix, ...).
Maybe take the chance to say hello and talk about life, work, or whatnot:

${syncNames}.

Click on their names to copy URLs to their music and to a known contact medium.

(press the [i] button above)
`
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
const gradus3 = () => `
You near the Mount Parnassum.

You should install the extension, load this page, and hit login
to know your network self, and make art, analyses, synchronizations
such as this, on your social body, ${visitorName()}.
The performance modes and features you will unblock progressivelly.
What modes and features is dependent on the version of OA you are using and your usage.
`

const gradusRec = () => `
You have recorded your music, ${visitorName()}.
Save the video file locally and upload it to a video platform (such as youtube).
You will need the link to reach the Mount Parnassum.
`

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

const tithorea1 = `
Welcome to Tithorea.

You can understand your interaction with your networks
as exploration:
  . with analyzis; or with
  . midia generation / absorption,
or as synergy:
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
although it most often is a synchronization (e.g. a community of buyers).

In this page, you design a network synchronization.
After three musical pieces input, you will be able to perform one and only network synchronization.
This is your utmost goal at this stage.
`

const uploadVideoText = 'Upload the file you downloaded and enter video URL here:'

const uploadVideoPlaceholder = 'something as https://www.youtube... (start with https:// or http://)'

const lycoreiaNew = `
You performed Gradus ad Parnassum, i.e. climbed Mount Parnassus.

You can now visit Lycoreia, which is one of the two summits therein.

In Lycoreia, you can see your communities, and the communities inside them, the subcommunities.

Click on the buttons to see them, use the music button to cycle through them.

Create the audiovisual environment, a music, record and upload the video.

Click HERE to register your video URL.

:::

(press the [i] button above to exit this message)
`

const tithoreaNew = `
You performed Gradus ad Parnassum, i.e. climbed Mount Parnassus.

You can now visit Tithorea, which is one of the two summits therein.

In Tithorea, you can design synchronization processes.

You may remove members, usually because they are duplicates of yourself, some other profile.
You may describe the synchronization, i.e. it's purpose, what it is meant to be realized with the synchronization.

Click on a member (▲) which wish to activate as seed, e.g. to start a synchronization.
If you click again on s/he, you will reach the music page for that seed, which you should
send to him/her to realize the synchronization.

You should also create the audiovisual environment, a music, record and upload the video.

Click HERE to register your video URL.

:::

(press the [i] button above to exit this message)
`

const tithoreaNew2 = `
On the synchronization that you have concession to perform,
the seed (▲) transmits the synchronization to the 4 least
connected neighbors.

The synchronization implied the the seed (▲) tends to cover the whole network.
You should select at least a few seeds (▲) for an effective synchronization.
Don't forget to choose the description for your synchronization by clicking on the dedicated button.

Perform synchronizations to unlock further features.

:::

(press the [i] button above to exit this message)
`

const arcturians1 = () => `
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

Hope you synchronize yourself with Our Aquarium audiovisual music.

:::

(press the [i] button above to exit this message)

`
// , ${visitorName()}.
//

const arcturians2 = () => `
You can see, play and govern your social structures because they are yourself.
In fact writing diaries is an ethnographic technique, and the diary may be used
as the anthropologist finds suitable.

Our Aquarium aims at complying to the self transparency, civil society transparency, free culture, software, midia, data.

Click HERE to know more.

:::

(press the [i] button above or login with the chrome extension if you have it)
`

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

:::

(press the [i] button above or login with the chrome extension if you have it)
`

const randomWords = () => {
  return wand.utils.randChunkSplit(
    ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Sun', 'Moon', 'Pachypoda', 'Clandonensis', 'Elegantissima'],
    1, 4, false
  )
}

const musicName = name => {
  const parts = name.split(' ')
  parts.push(...randomWords())
  return wand.utils.shuffle(wand.utils.inplaceShuffle(parts, false))
}

const toSeedText = seedName => `
Hi, ${seedName}, your music, a music about you, is conceived and called: ${wand.musicName || musicName(seedName)}.
`

module.exports = { tithorea1, lycoreia1, gradus1, gradus2, gradus3, gradusRec, gradusSyncLinks, gradusVideoLink, gradusExtensionInfo, uploadVideoText, uploadVideoPlaceholder, lycoreiaNew, arcturians1, arcturians2, guards, tithoreaNew2, tithoreaNew, defaultSyncDescription, defaultSyncDescription2, defaultSyncDescription3, defaultSyncDescription4, defaultSyncDescription5, defaultSyncDescription6, defaultSyncDescription7, toSeedText }
