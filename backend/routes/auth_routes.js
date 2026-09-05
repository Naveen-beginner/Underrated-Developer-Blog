import express from 'express'
import { login } from '../controllers/auth_controller.js'

const router = express.Router()
router.post('/iamtheadmin', login)
// router.post('/registertheadmin', register)
export default router