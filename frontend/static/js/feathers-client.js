import feathers from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'

// const socket = io('http://localhost:3030', {transports: ['websocket']})
const socket = io(process.env.feathersURL, {transports: ['websocket']})

const feathersClient = feathers()
  .configure(socketio(socket, { timeout: 100000 }))

export default feathersClient

