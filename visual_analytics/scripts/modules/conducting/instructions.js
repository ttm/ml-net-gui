/* global wand */
// to be shown in the canvas
// if clicked, speech synthesis
// there is a button to toggle portuguese and english
// only the instructions, no entity or myth
// not on first interfaces / interactions

// starting message:
const gradus1 = () => `
Welcome to the Gradus.

Hear your music, ${wand.syncInfo.pageMemberName},
join and enjoy ${neighborNames()}, and many others.

Keep your attention on the music, don't change the screen, or the interface might not
work properly.

Then, keep track of the "tips" until you reach your social organism and make art with it.

Also, the OA software is GPL @ FSF. So you can install an instance of your own or yield derivatives.

Good luck!

OA @ ${wand.syncInfo.pageMemberName}, ${(new Date()).toISOString().split('.')[0]}.
(press the [i] button above or login with the chrome extension if you have it)
`

// Hope you reach the interaction networks from Twitter, Instagram, and other communication platforms.
// Hope you reach the concept networks, oracles (such as the chatter bots), puzzles, and audiovisual instruments.

const visitorId = () => wand.syncInfo.msid || wand.syncInfo.mnid

const neighborNames = () => {
  const names = [wand.syncInfo.syncMemberName]
  wand.currentNetwork.forEachNeighbor(visitorId(), (nn, na) => {
    names.push(na.name)
  })
  return wand.utils.inplaceShuffle(names).join(', ')
}

const donationUrl = () => {
  return document.origin + '/?page=donate'
}

const defaultSyncDescription = () => `
Your music, and the Our Aquarium platform,
needs your help in order to survive.

It requires constant development and maintanainance,
which rely on donations.

Please visit our page: ${donationUrl()}.

Thank you very much!

OA @ aid
`

const syncDescription = () => (wand.syncInfo.syncDescription || defaultSyncDescription())

// after the exhibition with the music from the person:
const gradus2 = () => `
${syncDescription()}

(press the [i] button above)
`

const gradusSyncLinks = syncNames => `
Congratulations, ${wand.syncInfo.pageMemberName}, you have reached the links which you should
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
such as this, on your social body, ${wand.syncInfo.pageMemberName}.
The performance modes and features you will unblock progressivelly.
What modes and features is dependent on the version of OA you are using and your usage.
`

const gradusRec = () => `
You have recorded your music, ${wand.syncInfo.pageMemberName}.
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

module.exports = { tithorea1, lycoreia1, gradus1, gradus2, gradus3, gradusRec, gradusSyncLinks, gradusVideoLink, gradusExtensionInfo }
