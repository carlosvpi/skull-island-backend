const { shuffle } = require('./util')

const DIAMOND_CARD = 'DIAMOND_CARD'
const GOLD_CARD = 'GOLD_CARD'
const CHEST_CARD = 'CHEST_CARD'
const SKULL_CARD = 'SKULL_CARD'
const DOUBLE_SKULL_CARD = 'DOUBLE_SKULL_CARD'
const PIRATE_CARD = 'PIRATE_CARD'
const WITCH_CARD = 'WITCH_CARD'
const MONKEY_PARROT_CARD = 'MONKEY_PARROT_CARD'
const SHIP1_CARD = 'SHIP1_CARD'
const SHIP2_CARD = 'SHIP2_CARD'
const SHIP3_CARD = 'SHIP3_CARD'

const QUESTION_FACE = 'QUESTION'
const SKULL = 'SKULL'
const DIAMOND = 'DIAMOND'
const GOLD = 'GOLD'
const MONKEY = 'MONKEY'
const PARROT = 'PARROT'
const SWORDS = 'SWORDS'
const DICE_FACES = [SKULL, DIAMOND, GOLD, MONKEY, PARROT, SWORDS]
const DICE_SCORING_FACES = [DIAMOND, GOLD, MONKEY, PARROT, SWORDS]
const DICE_PURE_FACES = [DIAMOND, GOLD, SWORDS]
const MONKEY_PARROT = [MONKEY, PARROT]

let isWitchUsed = false
let cards
let cardIndex = 0

const LOBBY = 'LOBBY'
const TURN_1 = 'TURN_1'
const TURN_N = 'TURN_N'
const SKULL_ISLAND = 'SKULL_ISLAND'
const FINISH = 'FINISH'
const players = new Map([])
const messages = []

const pointsPerRepe = [0, 0, 0, 100, 200, 500, 1000, 2000, 4000]

let state = LOBBY
let playerIndex = 0
let playerIds = []
let dice = null
let winningPlayerId = null

const info = (id, isMaster = false) => {
  if (!players.has(id)) return false
  const player = players.get(id)
  const data = {
    turnPlayerId: playerIds[playerIndex],
    state,
    isMaster,
    players: [...players],
    messages: messages.slice(player.messageIndex),
    card: cards ? cards[cardIndex] : null,
    dice: dice ? dice : null,
    storedDice: null,
    isWitchUsed,
    winningPlayerId
  }
  player.messageIndex = messages.length
  return data
}
const postMessage = (id, message) => {
  if (!players.has(id)) return false
  const player = players.get(id)
  messages.push({ author: player.name ?? 'unknown', message, timestamp: Date.now() })
}
const addPlayer = (id, name, avatar) => {
  players.set(id, { name, avatar, messageIndex: 0, score: 0 })
  return `"${id}"`
}

const startGame = () => {
  cards = shuffle([
    DIAMOND_CARD, DIAMOND_CARD, DIAMOND_CARD,
    GOLD_CARD, GOLD_CARD, GOLD_CARD,
    CHEST_CARD, CHEST_CARD, CHEST_CARD,
    SKULL_CARD, SKULL_CARD, SKULL_CARD,
    DOUBLE_SKULL_CARD, DOUBLE_SKULL_CARD,
    PIRATE_CARD, PIRATE_CARD, PIRATE_CARD,
    WITCH_CARD, WITCH_CARD,
    SHIP1_CARD, SHIP1_CARD,
    SHIP2_CARD, SHIP2_CARD,
    SHIP3_CARD
  ])
  cardIndex = 0
  playerIds = shuffle([...players].map(([id]) => id))
  playerIndex = 0
  isWitchUsed = false
  state = TURN_1
  dice = Array(8).fill(QUESTION_FACE)
  return true
}

const roll = (id, indexes) => {
  if (id !== playerIds[playerIndex]) return false
  if (state === TURN_1) {
    indexes = [0, 1, 2, 3, 4, 5, 6, 7]
  }
  if (indexes.length < 2) return false
  if (indexes.some(index => 0 > index || index >= dice.length)) return false
  if (indexes.filter(index => dice[index] === SKULL).length > +(!isWitchUsed)) return false
  if (indexes.filter(index => dice[index] === SKULL).length > 0) {
    isWitchUsed = true
  }
  indexes.forEach(index => {
    dice[index] = DICE_FACES[Math.floor(Math.random() * 6)]
  })
  const skullCount = dice.filter(face => face === SKULL).length + +(cards[cardIndex] === SKULL_CARD) + 2 * +(cards[cardIndex] === DOUBLE_SKULL_CARD)
  const isTurnEnd = state === TURN_1 ? skullCount === 3 : skullCount >= 3
  const goesToSkullIsland = state === TURN_1 &&
    ![SHIP1_CARD, SHIP2_CARD, SHIP3_CARD].includes(cards[cardIndex]) &&
    skullCount >= 4
  if (state === SKULL_ISLAND) {
    if (skullCount === 0) {
      endTurn()
    }
  } else if (goesToSkullIsland) {
    state = SKULL_ISLAND
  } else if (isTurnEnd) {
    endTurn()
  } else {
    state = TURN_N
  }
  return true
}

const endTurn = (id) => {
  if (id !== playerIds[playerIndex]) return false
  const skullCount = dice.filter(face => face === SKULL).length + +(cards[cardIndex] === SKULL_CARD) + 2 * +(cards[cardIndex] === DOUBLE_SKULL_CARD)
  const isTurnEnd = state === TURN_1 ? skullCount === 3 : skullCount >= 3
  if (state !== SKULL_ISLAND) {
    const shipPoints = isTurnEnd ? 0
      : cards[cardIndex] === SHIP1_CARD && dice.filter(face => face === SWORDS).length >= 2 ? 300
      : cards[cardIndex] === SHIP2_CARD && dice.filter(face => face === SWORDS).length >= 3 ? 500
      : cards[cardIndex] === SHIP3_CARD && dice.filter(face => face === SWORDS).length >= 4 ? 1000
      : 0
    const purePoints = isTurnEnd ? 0
      : dice.filter(face => [GOLD, DIAMOND].includes(face)).length * 100
    const repePoints = cards[cardIndex] === MONKEY_PARROT_CARD
      ? DICE_PURE_FACES.reduce((acc, faceItem) => {
        return acc + pointsPerRepe[dice.filter(face => face === faceItem).length]
      }, pointsPerRepe[dice.filter(face => MONKEY_PARROT.includes(face)).length])
      : DICE_SCORING_FACES.reduce((acc, faceItem) => {
        return acc + pointsPerRepe[dice.filter(face => face === faceItem).length]
      }, 0)
    const allDiceScore = skullCount === 0
      && dice.every(faceItem => {
        if ((faceItem === MONKEY || faceItem === PARROT) && cards[cardIndex] === MONKEY_PARROT_CARD) {
          return pointsPerRepe[dice.filter(face => [MONKEY, PARROT].includes(face)).length] > 0
        }
        if (faceItem === SWORDS && shipPoints) {
          return true
        }
        return pointsPerRepe[dice.filter(face => face === faceItem).length] > 0
      })
    const basePoints = shipPoints + purePoints + repePoints + 500 * +allDiceScore
    const points = basePoints * (1 + +(cards[cardIndex] === CHEST_CARD))
    players.get(playerIds[playerIndex]).score += points
  } else {
    const basePoints = 100 * dice.filter(face => face === SKULL).length
    const points = basePoints * (1 + +(cards[cardIndex] === CHEST_CARD))
    players.forEach((player, id) => {
      if (id === playerIds[playerIndex]) return
      player.score -= points
    })
  }
  playerIndex = (playerIndex + 1) % playerIds.length
  state = TURN_1
  cardIndex++
  if (cardIndex >= cards.length) {
    cards = shuffle(cards)
    cardIndex = 0
  }
  isWitchUsed = false
  _checkVictory()
  return true
}

const _checkVictory = () => {
  console.log(playerIds)
  const maxScoringPlayerId = playerIds.reduce((acc, playerId) => {
    console.log('acc', acc, 'playerId', playerId)
    return players.get(acc).score > players.get(playerId).score ? acc : playerId
  })
  if (maxScoringPlayerId < 6000) return
  if (winningPlayerId !== maxScoringPlayerId) {
    winningPlayerId = maxScoringPlayerId
    return
  }
  if (winningPlayerId === maxScoringPlayerId && winningPlayerId === playerIds[(playerIndex+1) % playerIds.length]) {
    state = FINISH
    return
  }
}

module.exports.info = info
module.exports.postMessage = postMessage
module.exports.addPlayer = addPlayer
module.exports.startGame = startGame
module.exports.endTurn = endTurn
module.exports.roll = roll
