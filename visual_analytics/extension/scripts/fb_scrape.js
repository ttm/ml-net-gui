console.log('inside fb to scrape man')
// chrome.runtime.sendMessage('YOOOO', function (response) {
//   console.log(response.received_by.concat(' heard me.'))
// })


var hitsCounterThreshold = 10; //Recommended:10
var initDelayInMilliseconds = 5000; //Recommended:5000
var scrollDelayInMilliSeconds = 1000; //Recommended:1000
var scrollMagnitude = 1000; //Recommended:1000

function scrollTillEnd(call = () => console.log('scrolling complete')) {
    var x = 1, y = -1;
    var hitsCounter = 0;
    time = setInterval(function () {
        x = document.documentElement.scrollTop;
        document.documentElement.scrollTop += scrollMagnitude;
        y = document.documentElement.scrollTop;
        if (x == y) {
            hitsCounter += 1;
            if (hitsCounter > hitsCounterThreshold) {
                clearInterval(time);
                console.log('finished scrolling')
                call()
                // closeCurrentTab();
            }
        }
        else {
            hitsCounter = 0;
        }
    }, scrollDelayInMilliSeconds);
}

function getElementsByXPath(xpath, parent) {
    let results = [];
    let query = document.evaluate(xpath, parent || document,
        null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
        results.push(query.snapshotItem(i));
    }
    return results;
}

let startup = () => {
  let membername = getElementsByXPath('//*/h1').map(i => i.innerText)[0]
  let parts = membername.match(/[^\r\n]+/g)
  let name = parts[0]
  let codename = undefined
  if (parts.length > 1) {
    codename = parts[1]
  }
  // get potential id of the entity, if user page is loaded is ok:
  let path = window.location.pathname
  let potentialId = path.split('/')[1]
  return {
    url: `${window.location.origin}/${potentialId}`,
    id: potentialId,
    name,
    codename
  }
}

let getFriendsProfiles = () => {
  setTimeout(() => {
    scrollTillEnd(() => {
      // parse HTML to get profiles:
      let profiles = htmlToFriendsProfiles()
      console.log('profiles', profiles)
    })
  }, initDelayInMilliseconds);
}

let htmlToFriendsProfiles = () => {
  let exp2 = getElementsByXPath('//*/body/div[2]/div[1]/div[1]/div[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[4]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div')
  // get names (always), ids (if available), mutual friends (if available):
  let names = exp2.map(e => e.childNodes[1].childNodes[0].innerText)
  // mutual friends, perfectly (undefined if not given):
  let mutual = exp2.map(e => {
    const c = e.childNodes[1]
    if (c.childNodes.length < 2) {
      return undefined
    }
    const num = e.childNodes[1].childNodes[1].innerText.split(' ')[0]
    if (num.length === 0 || !/^\d+$/.test(num)) {
      return undefined
    }
    return parseInt(num)
  })
  // url to iterate and to get ids, perfectly (undefined for inactive users):
  let member_urls = exp2.map(e => e.childNodes[1].childNodes[0].childNodes[0].href)

  let iids = member_urls.map((i, ii) => {
    if (i === undefined) {
      return {
        idType: undefined,
        id: undefined,
        stringId: undefined,
        numericId: undefined,
        url: undefined,
        name: names[ii],
        mutual: mutual[ii]
      }
    }
    const parts = i.split('/')
    const last = parts[parts.length - 1]
    const numericId = last.match(/^profile.php\?id=(.*)/)
    if (numericId && /^\d+$/.test(numericId[1])) {
      return {
        idType: Number,
        id: numericId[1],
        stringId: undefined,
        numericId: numericId[1],
        url: i,
        name: names[ii],
        mutual: mutual[ii]
      }
    } else {
      return {
        idType: String,
        id: last,
        stringId: last,
        numericId: undefined,
        url: i,
        name: names[ii],
        mutual: mutual[ii]
      }
    }
  })
  return iids
}

let scrape = () => {
  // starts with the profile page of the seed, preferentially / typically the user
  // get name and id
  // enter and scrape friends page
  // for each friend:
  //    enters its friends or friends_mutual page
  //    get name with potential codename
  //    assert gotten name matches name if id already scrapped
  //    scrape friends
  //    if not friends_mutual:
  //        may wish to keep track of ppl with are not friends with the seed
  //        to iterate and get friends
  let startData = startup()
  console.log(startData, 'HOOO')
  let url = `${startData.url}/friends_mutual`
  // window.open(url,'_self')
  // chrome.runtime.sendMessage({ "message": "open_new_tab", "url": url })
  let seedProfiles = getFriendsProfiles()
  console.log(startData, 'HAAAA')
  if (true) {
    return
  }
  return {
    seed: [sid, nid],
    seedFriendIds: {
      string: stringSeedFriendIds,
      numeric: numericSeedFriendIds,
      ids: seedFriendIds, // string if available, else numeric, else undefined
      mutual: false, // if true, start from the mutual friends of the seed, for seed not logged in fb
    },
    membersIds: {
      numericIds, // of any member scrapped that is not the seed
      stringIds, // of any member scrapped that is not the seed
      ids,
      mutual: true, // if true, start from the mutual friends of the seed, for seed not logged in fb
    },
    friendships, // sequence of [id1, id2]
    profiles, // list of dicts with {id, numericId, stringId, name, profilePage, mutualFriends
  }
}
