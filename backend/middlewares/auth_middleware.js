import jwt from 'jsonwebtoken'
import user from '../models/user_model.js'
import HTTP_STATUS_CODES from '../utils/http_status_codes.js'
import MESSAGES from '../utils/messages.js'

const authenticateAuthor = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization
        const token = authorization?.startsWith('Bearer ')
            ? authorization.slice(7)
            : null

        if (!token) {
            return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({
                success: false,
                message: MESSAGES.ERROR.UNAUTHORIZED
            })
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured')
            return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR
            })
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
        const authenticatedUser = await user.findById(decodedToken.sub).select('-password')

        if (!authenticatedUser) {
            return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({
                success: false,
                message: MESSAGES.ERROR.INVALID_CREDENTIALS
            })
        }

        if (authenticatedUser.role !== 'author') {
            return res.status(HTTP_STATUS_CODES.FORBIDDEN).json({
                success: false,
                message: MESSAGES.ERROR.FORBIDDEN
            })
        }

        req.user = authenticatedUser
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({
                success: false,
                message: MESSAGES.ERROR.INVALID_CREDENTIALS
            })
        }

        console.error('Authentication error: ', error)
        return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR
        })
    }
}

export default authenticateAuthor