const s = require('mongodb-stitch-browser-sdk')
const auth = require('./mong_auth.js')
const sha = require('fast-sha256')
window.sha = sha

const client = s.Stitch.initializeDefaultAppClient(auth.app)
const db = client.getServiceClient(s.RemoteMongoClient.factory, auth.cluster).db(auth.db)

// usage:
// mong.db.collection(mong.auth.collections.test).insertOne({AAAA: 'llll'})
// db.collection(collectionName).updateOne({ owner_id: client.auth.user.id }, { $set: { number: 40 } }, { upsert: true })
// db.collection(collectionName).find({ owner_id: client.auth.user.id }, { limit: 100 }).asArray()
//
// const collectionName = 'nets'
// client.auth.loginWithCredential(new s.AnonymousCredential()).then(user =>
//   db.collection(collectionName).updateOne({ owner_id: client.auth.user.id }, { $set: { number: 40 } }, { upsert: true })
// ).then(() =>
//   db.collection(collectionName).find({ owner_id: client.auth.user.id }, { limit: 100 }).asArray()
// ).then(docs => {
//   console.log('Found docs', docs)
//   console.log('[MongoDB Stitch] Connected to Stitch')
// }).catch(err => {
//   console.error(err)
// })

const writeIfNotThereReadIfThere = (astring, call) => {
  client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    console.log('authenticated to mongo. User:', user)
    const hash = String(sha.hash(astring))
    db.collection(auth.collections.test).findOne({ hash }).then(res => {
      if (!res) { // insert
        console.log('not found', astring, hash)
        db.collection(auth.collections.test).insertOne({ AAAA: 'XXX', astring, date: new Date(Date.now()).toISOString(), hash })
      } else {
        console.log('found', res)
      }
    })
  })
}

const writeNetIfNotThereReadIfThere = (text, name, lastModified, call) => {
  client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    console.log('authenticated to mongo. User:', user)
    const hash = String(sha.hash(text))
    db.collection(auth.collections.test).findOne({ hash }).then(res => {
      if (!res) { // insert
        console.log('not found', hash)
        db.collection(auth.collections.test).insertOne({ text, date: new Date(Date.now()).toISOString(), hash, name, lastModified })
      } else {
        console.log('found', res)
      }
    })
  })
}

const writeNet = (text, name, sid, nid, id, call) => {
  client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    const query = sid ? { sid } : { nid }
    db.collection(auth.collections.test).findOne(query).then(res => {
      if (!res) {
        const hash = String(sha.hash(text))
        db.collection(auth.collections.test).insertOne({ text, date: new Date(Date.now()).toISOString(), hash, name, sid, nid, id })
        console.log('new network written')
      } else {
        db.collection(auth.collections.test).updateOne(query, { $set: { text }, $currentDate: { lastModified: true } })
        console.log('network updated')
      }
      call()
    })
  })
}

const findAllNetworks = () => {
  return client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    console.log('ALL NETs WOW')
    return db.collection(auth.collections.test).find({ hash: { $exists: true }, lastModified: { $exists: true }, sid: { $exists: false } }).asArray()
  })
}

const findAllScrappedNetworks = () => {
  return client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    console.log('ALL NETs WOW')
    return db.collection(auth.collections.test).find({ sid: { $exists: true } }).asArray()
  })
}

const findUserNetwork = (sid, nid) => {
  // todo: similar function to find nets by name (e.g. 'Flavio Parma')
  return client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    console.log('USER NET YEAH')
    let query
    if (sid) {
      query = { sid }
    } else {
      query = { nid }
    }
    return db.collection(auth.collections.test).find(query).asArray()
  })
}
const testCollection = db.collection(auth.collections.test)

module.exports = { client, db, auth, writeIfNotThereReadIfThere, writeNetIfNotThereReadIfThere, findAllNetworks, writeNet, testCollection, findUserNetwork, findAllScrappedNetworks, s }
