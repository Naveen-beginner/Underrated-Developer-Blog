import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

import authRoutes from './routes/auth_routes.js'
import postRoutes from './routes/post_routes.js'
app.use('/api/auth/my', authRoutes)
app.use('/api/my/', postRoutes)

const PORT = process.env.PORT || 5500
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blog-underrated'

app.get('/', (req, res) => {
    res.status(200).send('Server lives here')
})

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(e => console.error('MongoDB connection error: ' + e))

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`)
})