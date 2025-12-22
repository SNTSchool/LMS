import express from 'express'
import cors from 'cors'
import classesRoutes from './routes/classes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Backend running' })
})

app.use('/api/classes', classesRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
})