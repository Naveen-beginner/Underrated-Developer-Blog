import express from 'express'
import { createPost, deletePost, getPostById, getPosts, updatePost } from '../controllers/post_controller.js'
import authenticateAuthor from '../middlewares/auth_middleware.js'

const router = express.Router()
router.post('/create/post', authenticateAuthor, createPost)
router.get('/all/posts', getPosts)
router.get('/post/:id', getPostById)
router.put('/update/post/:id', authenticateAuthor, updatePost)
router.delete('/delete/post/:id', authenticateAuthor, deletePost)

export default router