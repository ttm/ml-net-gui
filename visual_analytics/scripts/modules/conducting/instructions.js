/* global wand */
// to be shown in the canvas
// if clicked, speech synthesis
// there is a button to toggle portuguese and english
// only the instructions, no entity or myth
// not on first interfaces / interactions

const gradus1 = () => `
Welcome to the Gradus, ${wand.fullNetwork.getNodeAttribute(wand.syncInfo.msid || wand.syncInfo.mnid, 'name')}.

First, hear your music in the network of ${wand.fullNetwork.getAttribute('userData').name}.

Then, keep track of the "tips" until you reach your own social structure.
You will make audiovisual music with it in order to acquire intimacy with the framework.

You will reach other interfaces for community detection, synchronization and diffusion,
merging structures, and other functionalities.
Hope you reach the interaction networks from Twitter, Instagram, and other communication platforms.

Good luck.

(press the [i] button)
`

// const gradus2 = `
// You have reached the audiovisualization of the network.
// Click at any node
// `

const gradusRec = () => `
You have recorded your music, ${wand.fullNetwork.getNodeAttribute(wand.syncInfo.msid || wand.syncInfo.mnid, 'name')}.
Save the video file locally and upload it to a video platform (such as youtube). Keep the link at hand.
You can also send the video to OA curators.
A video link sent to the curators might appear in the OA newsletter.
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

module.exports = { tithorea1, lycoreia1, gradus1, gradusRec }
