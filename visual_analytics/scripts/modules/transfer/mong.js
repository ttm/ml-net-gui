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

module.exports = { client, db, auth, writeIfNotThereReadIfThere, writeNetIfNotThereReadIfThere }
