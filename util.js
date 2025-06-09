module.exports.shuffle = (array) => {
  for (let i = 0; i < array.length - 1; i++) {
    const j = Math.floor(Math.random() * array.length)
    const item = array[i]
    array[i] = array[j]
    array[j] = item
  }
  return array
}