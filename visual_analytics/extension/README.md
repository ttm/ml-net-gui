# chrome extension for scrapping data for donation
To install, in chrome browser, click the hamburger menu, go to More tools -> Extensions. Enable “Developer mode” on the top-right and click “Load Unpacked Extension” button, now browse to the main directory where manifest.json is located, click ok.

## most basic usage
To use it, you need a starting page, you have two options:
1. go to your friends page (in your profile, click friends). Or, 
2. go to the mutual friends page of someone.

The hydra grabber will scrape all those friends, and iterate over them to find friendships among them.
If your network is too big for how fast fb is loading, say you have more than 500 friends,
it might take too long to load all your friends, thus you might want to start from page `2.`.

Then reload the page and click on the extension badge (probably on chrome's top right corner). Wait until it asks you to save the file. Then, email it to me, I'll be happy to help with visualizing and analyzing the networks you send me.

## not so basic usage
Currently, this extension works for both "new facebook" and "classic facebook".
It executes faster in classic facebook but blocks access to friends if network is too big (I guess more than 200 nodes).
Classic/new fb can be set in the drop-down menu in the top navigation bar on fb itself.

Current setting is for very fast scrapping and might not work for you.
You'll notice that when it is not finishing to load all the friends in a mutual friends page.
If so, change the initial variables to the recommended values (commented there),
and browsing will be performed slower to allow for loading the pages.

## fixme
Use a different favicon?
Read fixme block in the start of `./scripts/fb_scrape.js`.
Search for `fixme:` and `todo:` in code.
Refactor messy code I did in v0.03 to solve numerous incosistencies in
fb (interface and [str/num]id usage) quicly.


## changelog

0.03
unified classic and new fb interfaces.
prioritized mutual friends to grap all num ids and str ids when available.
dealt with numeric and string ids.
bypassed fb access block to best mutual friends browse.
using friend as seed, i.e. scrapping ego-seeded ego network, not subego or coego anymore, but contain them.

0.02
enhanced code and added classic fb

0.01
started for new fb

## disclaimer
This extension is very experimental and oriented for my own usage and that of close friends.
Scrapping Facebook in all its flavors is beyond current scope and would require one to drop other activities in life, which is unsuitable.

## donation
If you like this extension or the code, or it has use for you, please consider donating money to me or contributing to code development.

:::
