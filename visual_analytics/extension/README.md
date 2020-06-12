# chrome extension for scrapping data for donation
To install, in chrome, click the hamburger menu, go to More tools -> Extensions. Enable “Developer mode” on the top-right and click “Load Unpacked Extension” button, now browse to the main directory where manifest.json is located, click ok.

## most basic usage
To use, go to your friends page (in your profile, click friends).
Then reload the page and click on the extension badge (probably on chrome's top right corner). Wait until it asks you to save the file. Then, email it to me, I'll be happy to help with visualizing and analyzing the networks you send me.

If you have more than a few hundred friends, this process may take too long and even raise errors, thus check the "not so basic usage" below.

## not so basic usage
Currently, this extension works for both "new facebook" and "classic facebook".
It executes faster in classic facebook.
This can be set in the drop-down menu in the top navigation bar.

Another possibility is to scrape a co-ego network, performed by going to a friend's
profile, then clicking on the "friends -> mutual friends" tab.
Reload the page, and click the extension badge.

## fixme
Use a different favicon?
Read fixme block in the start of ./scripts/fb\_scrape.js

## disclaimer
This extension is very experimental and oriented for my own usage and that of close friends.
Scrapping Facebook in all its flavors is beyond current scope and would require one to drop other activities in life, which is unsuitable.
:::
