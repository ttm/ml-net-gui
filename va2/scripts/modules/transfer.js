// mongo:
const s = require('mongodb-stitch-browser-sdk')
const e = module.exports
e.ss = s

const creds = {}
const regName = (name, app, url, db, coll) => {
  creds[name] = {
    cluster: 'mongodb-atlas', // always
    app,
    url,
    db: db || 'anydb',
    collections: { test: coll || 'anycollection' }
  }
}

regName('ttm', 'freene-gui-fzgxa', 'https://ttm.github.io/oa/', 'freenet-all', 'test3') // renato.fabbri@
// regName('ttm', 'freene-gui-fzgxa', 'https://ttm.github.io/oa/', 'freenet-all', 'nets') // dummy
regName('tokisona', 'aplicationcreated-mkwpm', 'https://tokisona.github.io/oa/', 'adbcreated', 'acolectioncreated') // sync.aquarium@ and aeterni
regName('mark', 'anyapplication-faajz', 'https://markturian.github.io/ouraquarium/', 'anydb', 'anycollection') // markarcturian@
// regName('sync', 'anyapplication-faajz', 'https://worldhealing.github.io/ouraquarium/', 'anydb', 'anycollection') // markarcturian@

const auth = creds.tokisona
// const auth = creds.mark
// const auth = creds.ttm
// const auth = creds.sync

// auth.url = 'http://localhost:8080/'

const client = s.Stitch.initializeDefaultAppClient(auth.app)
const db = client.getServiceClient(s.RemoteMongoClient.factory, auth.cluster).db(auth.db)

e.writeAny = (data, aa) => {
  return client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    return db.collection(aa ? 'aatest' : auth.collections.test).insertOne(data)
  })
}

e.findAny = (data, aa) => {
  return client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    return db.collection(aa ? 'aatest' : auth.collections.test).findOne(data)
  })
}

e.findAll = (query, aa, projection, col) => {
  return client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    return db.collection(aa ? 'aatest' : (col || auth.collections.test)).find(query, { projection }).asArray()
  })
}

e.remove = (query, aa) => {
  return client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    return db.collection(aa ? 'aatest' : auth.collections.test).deleteMany(query)
  })
}

// sparql:
const losdheaders = require('./losdheaders.js')
const superagent = require('superagent')

e.getNetMembersLinks = (netid, call = console.log) => {
  const qmembers = `SELECT DISTINCT ?p ?n WHERE {
    ?s po:snapshotID '${netid}' .
    ?p a po:Participant .
    ?p po:snapshot ?s .
    ?p po:observation ?o .
    ?o po:name ?n .
  }`
  const qfriendships = `SELECT DISTINCT ?p1 ?p2 WHERE {
    ?f a po:Friendship .
    ?f po:snapshot ?s .
    ?s po:snapshotID '${netid}' .
    ?f po:member ?p1, ?p2 .
    FILTER(?p1 != ?p2)
  }`
  e.losdCall(qmembers, (members) => {
    e.losdCall(qfriendships, (friendships) => {
      call({ members, friendships })
    })
  })
}

const dummyQueries = {
  0: [
    'SELECT ?s ?n WHERE {',
    '?s a po:Snapshot .',
    '?s po:name ?n .',
    '}'
  ].join(' '),
  1: `PREFIX : <https://rfabbri.linked.data.world/d/linked-open-social-data/>
      PREFIX po: <http://purl.org/socialparticipation/po/>
      SELECT (COUNT(DISTINCT ?author) as ?c) WHERE {
        ?author a po:Participant . 
    }`
}

e.losdCall = (query, callback) => {
  if (typeof query === 'object') {
    query = query.join(' ')
  }
  if (Object.keys(dummyQueries).includes(String(query))) {
    query = dummyQueries[query]
  }
  const query_ = [
    'PREFIX : <https://rfabbri.linked.data.world/d/linked-open-social-data/>',
    'PREFIX po: <http://purl.org/socialparticipation/po/>',
    query
  ]
  sparqlCall(
    'https://api.data.world/v0/sparql/rfabbri/linked-open-social-data',
    query_.join(' '),
    callback,
    losdheaders.losdheaders
  )
}

const sparqlCall = (url, query, callback, headers) => {
  if (typeof query !== 'string') {
    query = query.join(' ')
  }
  superagent
    .get(url)
    .query({ query, format: 'json' })
    .set(headers)
    .then(result => {
      const mres__ = JSON.parse(result.text)
      const sparqlres = mres__.results.bindings
      callback(sparqlres)
    })
}

// ////////////// generic:
class FindAll {
  constructor () {
    // ttm test
    // mark
    this.dbs = {}
    this.clients = {}
    for (const au in creds) {
      if (au === 'tokisona') continue
      console.log(au)
      this.mkOne(au)
    }
    this.tokisona = (query, projection, col) => e.findAll(query, false, projection, col)
  }

  mkOne (au) {
    const auth = creds[au]
    const client = s.Stitch.initializeAppClient(auth.app)
    const db = client.getServiceClient(s.RemoteMongoClient.factory, auth.cluster).db(auth.db)
    const find = (query, projection, col) => client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
      return db.collection(col || auth.collections.test).find(query, { projection }).asArray()
    })
    // this[au] = { client, db, find }
    this[au] = find
    this.dbs[au] = db
    this.clients[au] = client
  }
}

e.fAll = new FindAll()

// e.fAll = (query, au) => { // au in (tokisona, mark, ttm, sync)
//   const auth = creds[au]
//   const client = s.Stitch.initializeAppClient(auth.app)
//   const db = client.getServiceClient(s.RemoteMongoClient.factory, auth.cluster).db(auth.db)
//   return client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
//     return db.collection(auth.collections.test).find(query).asArray()
//   })
// }
