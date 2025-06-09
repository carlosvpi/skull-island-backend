const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const {
  info,
  addPlayer,
  postMessage,
  startGame,
  roll,
  endTurn,
} = require('./skullIsland.js')

const app = express()
const port = 3000

const playerIds = new Map([])

app.use(bodyParser.urlencoded())
app.use(bodyParser.json())
app.use(cors())
app.use((req, res, next) => {
  console.log(`\x1b[44m${(new Date()).toString().slice(0, 24)} \x1b[0m\x1b[43m ${req.method.toUpperCase().padEnd(8)}\x1b[0m ${req.originalUrl}(\x1b[33m${playerIds.get(req.ip)}\x1b[0m)`)
  let sent = null
  const originalSent = res.send
  res.send = (value => {
    sent = value
    originalSent.call(res, value)
  }).bind(res)
  next()
  console.log(`                                   \x1b[32m${sent}\x1b[0m`)
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

app.get('/', (req, res) => {
  res.send('Healthy')
})

app.get('/info', (req, res) => {
  res.send(info(playerIds.get(req.ip), req.ip === '::1'))
})

app.post('/connect', (req, res) => {
  const id = playerIds.has(req.ip) ? playerIds.get(req.ip) : Math.random().toString(16).slice(2)
  playerIds.set(req.ip, id)
  res.send(addPlayer(id, req.body.name, req.body.avatar))
})

app.post('/postMessage', (req, res) => {
  res.send(postMessage(playerIds.get(req.ip), req.body.message))
})

app.post('/startGame', (req, res) => {
  if (req.ip !== '::1') {
    res.send(false)
    return
  }
  res.send(startGame(playerIds.get(req.ip)))
})

app.post('/roll', (req, res) => {
  res.send(roll(playerIds.get(req.ip), req.body.indexes))
})

app.post('/endTurn', (req, res) => {
  res.send(endTurn(playerIds.get(req.ip)))
})
