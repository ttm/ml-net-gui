/* global wand */
// to be shown in the canvas
// if clicked, speech synthesis
// there is a button to toggle portuguese and english
// only the instructions, no entity or myth
// not on first interfaces / interactions

// starting message:
const gradus1 = () => `
Welcome to the Gradus.

Hear your music, ${wand.syncInfo.pageMemberName}.
in the network of ${wand.syncInfo.syncMemberName}.

Then, keep track of the "tips" until you reach your own social organism.
You will make art, audiovisual music, with it in order to acquire intimacy with the framework.

You will reach other interfaces for community detection, synchronization and diffusion,
merging structures, and other modes of performance.
Hope you reach the interaction networks from Twitter, Instagram, and other communication platforms.
Hope you reach the concept networks, oracles (such as the chatter bots), puzzles, and audiovisual instruments.

Also, the OA software is GPL @ FSF. So you can install an instance of your own or yield derivatives.

Now with your friendship networks.
Good luck!

OA @ ${wand.syncInfo.pageMemberName}/${wand.syncInfo.syncMemberName}, ${(new Date()).toISOString().split('.')[0]}.
(press the [i] button above or login with the chrome extension if you have it)
`

// after the exhibition with the music from the person:
const gradus2 = () => `
${wand.syncInfo.syncDescription || 'no description for the sync provided'}

(press the [i] button above)
`

const gradusSyncLinks = linksText => `
Congratulations, ${wand.syncInfo.pageMemberName}, you have reached the links which you should
send forward to perform this synchronization.

Click on the text below to copy it. Send to these friends through any communication protocol
(telephone, email, whatsapp, telegram, facebook, twitter, instagram, irc, matrix, ...).
Maybe take the chance to say hello and talk about life, work, or whatnot:

${linksText}

${wand.syncInfo.syncDescription || 'no description for the sync provided'}

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

module.exports = { tithorea1, lycoreia1, gradus1, gradus2, gradus3, gradusRec, gradusSyncLinks }
