const s = require('mongodb-stitch-browser-sdk')
const e = module.exports

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
regName('sync', 'anyapplication-faajz', 'https://worldhealing.github.io/ouraquarium/', 'anydb', 'anycollection') // markarcturian@

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

e.findAll = (query, aa) => {
  return client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    return db.collection(aa ? 'aatest' : auth.collections.test).find(query).asArray()
  })
}

e.remove = (query, aa) => {
  return client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    return db.collection(aa ? 'aatest' : auth.collections.test).deleteMany(query)
  })
}
