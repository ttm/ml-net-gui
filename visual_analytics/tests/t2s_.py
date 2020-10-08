import os

# atext = 'And so you think you should conquer the world, and I believe you. The thing is: you are more than that. First, take a look a Tithorea, it is where you design the synchronization.'

atext = 'a banana for you. Come on, man!'

'''
You are being invited to a journey in which there are three locations:
1) Gradus; 2) Lycoreia; 3) Tithorea.
In the Gradus you will explore the most basic features.

In the Lycoreia (for community detection); 3) Tithorea (for designing the synchronizations).

'''
tdict = {
    'journeyNew': '''
    So you wish to know about the Aquarium. Nice and welcome, these are probably your first steps
    in exploring and harnessing your social body.

    You usually start by listening to a musical piece dedicated to you.
    Then you start the 'Gradus ad Parnassum', an introduction to the most basic features in the Aquarium.
    Then you install the 'You' browser extension. It enables you to visit 'Lycoreia', where you explore the
    community structure of your social body or organism.
    It also enables you to visit Tithorea, where you then design interventions in your social organism
    which may alter it and help you achieve specific results:
    gather information, mature ideas, raise funding, start a commercial venue,
    find jobs or employees or collaborators, etc.

    Our Aquarium interfaces allow for the creation of multiple audiovisual music pieces
    from your networks for you to enjoy and share.

    Good luck in your journey!
    ''',

    # 'journey': '''
    # So you wish to know about the Aquarium. Nice and welcome.

    # Our Aquarium, also called OA, enables synchronizations.
    # In fact, it is dedicated to them.
    # A synchronization is somewhat like a diffusion, but it entails
    # modifications in your networks in order for you to accomplish something:
    # gather information, mature ideas, raise funding, start a commercial venue,
    # find jobs or employees or collaborators, etc.

    # Features in OA are unlocked through usage of the features already available to you.
    # The most often initiation to OA is accomplished by receiving a musical piece dedicated to you.
    # After which you start the 'Gradus ad Parnassum', a progressive introduction to the basic tools in OA.

    # By installing the 'You' browser extension, you can authenticate into OA, visualize, analyze and synchronize your networks.
    # Within the 'You' extension you have access to three pages in your own network: 1) Gradus (for basic features); 2) Lycoreia (for community detection); 3) Tithorea (for designing the synchronizations).
    # All three pages yield audiovisual music pieces from your networks for you to enjoy and share.

    # Good luck in your journey!

    # ''',

    # 'purposes': '''
    # Our Aquarium (OA) is a platform for harnessing your social self (or social organism) through synchronizations, analyses, audiovisual creation, and gamification.

    # It is an attempt to enable ourselves to shape the world into something better, that fits our own needs and desires.

    # The main mechanism provided by OA to achieve such results is the synchronization: a way in which you networks embraces the proposals you have.

    # Other instruments are also provided: interfaces for mediation, divination, audiovisual creation, cognitive representation and sharing, narratives.

    # Please consider donating any amout to OA research, development and maintainance. Overall, it is guaranteed that individuals are more acquainted with their social organisms and will be better adapted to dwell in them.
    # Furthermore, donating will help in keeping OA without ads, given that we don't sell data nor special features.

    # Thank you!
    # ''',

    # 'gradus': '''
    # The 'Gradus ad Parnassum' is a progressive learning journey to the mount Parnassus.

    # You may reach the 'Gradus ad Parnassum' interface by: 1) receiving a musical piece dedicated to you; or 2) installing the 'You' extension.

    # When receiving a musical piece, a step-by-step process is started, where you should keep track of the achieved feature and the instruction for current step, in the middle column, in order to unlock new features.

    # If using the 'You' browser extension, the features in this page are all unlocked, and you can select between two flavours of your network: 1) visited (where only the portion of your network which you visited with the 'You' extension is shown); 2) full (where all the connected members are shown).
    # Notice that 1) and 2) are equivalent if all the network was visited.

    # In summary, you can: change the network portion being visualized;
    # change node transparency;
    # change edge transparency;
    # change name transparency;
    # change name size;
    # change node size;
    # randomize the colors in use for background, nodes, edges, and names;
    # perform complex and simple audiovisual music;
    # toggle mute;
    # and toggle information screens.
    # You may also register the videos you made using OA and uploaded through their URLs by clicking on the yellow section.

    # Enjoy! We wish you the best of luck!
    # ''',

    # 'lycoreia': '''
    # Lycoreia is an exploratory interface for you to develop familiarity with your social network.

    # The basic functionality of Lycoreia is 'community detection'. You may click the 'highlight next community' button to see each community.
    # You may also click the 'highlight next subcommunity' to see the communities inside the community highlighted.

    # If you click the 'make musical sequence' button, it will start cycling the communities, one community per second. 
    # It will cycle through the subcommunities of the community if the last button pressed was to see a subcommunity.
    # It will cycle through the communities of the network if the last button pressed was to see a community (that is: not a subcommunity).
    # 
    # You can remove any of the cycling animations and sounds by clicking on the button created.

    # You need to hit the record button to record the video, which is different from most other OA interfaces.

    # Once you upload a video, you may register the URL by clicking on the yellow section.

    # Enjoy! We wish you the best of luck.
    # ''',

    # 'tithorea': '''
    # Tithorea is where you design your synchronizations.

    # You should read carefully the starting information pages, they are handy references.

    # In summary, you click on the 'remove user' button to remove duplicates of yourself if you have another profile for yourself.
    # Then click on the 'synchronization description' to select a description from the templates or write your own.
    # For example, we will here write about the poetry of Gilka Machado, which we believe should be better known.

    # Lastly, click on a participant to set it as the seed. Click again to consolidate such participant as a seed and get the link to send him or her.
    # You can select as many seeds as you wish. We suggest you to select at least five seeds to have an effective synchronization.

    # To may wish to have a specific participant as a seed. To find such participant, you should initially hover (or mouse over) the nodes. After you perform some synchronizations, you will enable features to find specific participants.

    # Enjoy and good luck!
    # ''',

    # 'extInstall': '''
    # Installing and using the <b>You</b> extension is the first step towards fully acquiring your social
    # networks in OA. Then, you will be able to better know yourself through your social self.

    # The following instructions are found in the 'about Our Aquarium' page, then on the fist link (on the first bullet).
    # To install the 'You' extension:
    # 1) Download the file you.zip and unpack it.
    # 2) In the Google Chrome browser, go to extensions (in the upper-right corner), and then manage extensions.
    # 3) Enable developer mode (in the extensions panel you reached in the last step.
    # 4) Click on the 'Load unpacked' button (in the extension panel). Select the folder you unpacked in step 1 (where you have the README.md file and the 'scripts' folder).

    # Done, you finished installing the 'You' extension. Now, to use it:


    # 1) Click on the badge of the You extension. It is also on the upper-right corner. You may need to pin the You extension in the extensions menu (also in the upper-right corner).
    # 2) Click on the pink button to retrieve some of your data. You should have Facebook logged in. Other social networks are enabled after you examine your friendship network (unfortunatelly, the friendship networks are currently only available on Facebook).
    # 3) Your browser will open your profile page to verify your identity, will then load your friends page and scroll down to have all your friends, and then will visit the mutual friends page of each friend. This process will probably take only a few minutes, wait for it to finish. If you see no activity, something has gone wrong. Leave the chrome window working while it is getting some data.
    # 4) After you retrieved your friends and at least some of your mutual friends, click on the 'You' extension badge again. You should see your name, id, number of friends, number of friends visited (for mutual friends), and friendships found.
    # 5) Click on any of the yellow buttons: "Gradus", "Lycoreia", or "Tithorea". They are specific pages for you to analyze and make audiovisual art with your social self and are only reacheable through the You browser extension. We suggest you use each of them at least a few times.
    # 6) Click again in the pink button from time to time, but wait about 1 hour before clicking again on the pink button. Facebook limits the access to specific features in a short timespan. Oh, and you may need to login again through the pink button if for any reason your browser looses your credentials, for example, if you shut down your computer.'

    # Enjoy!!
    # ''',
}

for key, value in tdict.items():
    somet = ('curl -X POST -u "apikey:HoCx17QqoAIXXllKnDzeMImwvrUGcfhvjLSSCL0mw2dT" '
    ' --header "Content-Type: application/json" '
    ' --header "Accept: audio/wav" '
    ' --data "{\\\"text\\\":\\\"' + value.replace('\n', ' ') + '\\\"}" '
    f' --output {key}.wav '
    ' "https://api.us-south.text-to-speech.watson.cloud.ibm.com/instances/e8afed51-da91-4ef6-802b-fa575e9f8b01/v1/synthesize"')

    os.system(somet)
    print(f'feito o key: {key}')
