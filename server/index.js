import express from 'express'
import path from 'path'

const app = express()
const __dirname = path.resolve()

// serve frontend build
app.use(express.static(path.join(__dirname, 'dist')))

// ⭐ สำคัญมาก
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(3000, () => {
  console.log('Server running')
})
