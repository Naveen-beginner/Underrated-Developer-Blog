import user from '../models/user_model.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import HTTP_STATUS_CODES from '../utils/http_status_codes.js'
import MESSAGES from '../utils/messages.js'

export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ message: MESSAGES.ERROR.REQUIRED_FIELDS })
        }

        const existingUser = await user.findOne({ email })
        if (!existingUser) {
            return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ message: MESSAGES.ERROR.INVALID_CREDENTIALS })
        }

        const passwordMatches = await bcrypt.compare(password, existingUser.password)
        if (!passwordMatches) {
            return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ message: MESSAGES.ERROR.INVALID_CREDENTIALS })
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured')
            return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR })
        }

        const token = jwt.sign(
            { sub: existingUser._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        const safeUser = existingUser.toObject()
        delete safeUser.password

        return res.status(HTTP_STATUS_CODES.OK).json({
            message: MESSAGES.SUCCESS.LOGIN_SUCCESS,
            token,
            expiresIn: '7d',
            data: safeUser
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR })
    }
}

// export const register = async (req, res) => {
//     try {
//         const { username, email, password } = req.body

//         if (!username || !email || !password) {
//             return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ message: MESSAGES.ERROR.REQUIRED_FIELDS })
//         }

//         const existingUser = await user.findOne({ username })
//         if (existingUser) {
//             return res.status(HTTP_STATUS_CODES.CONFLICT).json({ message: MESSAGES.ERROR.USER_EXISTS })
//         }

//         const hashedPassword = await bcrypt.hash(password, 12)
//         const newUser = await user.create({
//             username,
//             email,
//             password: hashedPassword
//         })

//         const safeUser = newUser.toObject()
//         delete safeUser.password

//         return res.status(HTTP_STATUS_CODES.CREATED).json({ message: MESSAGES.SUCCESS.REGISTRATION_SUCCESS, data: safeUser })
//     } catch (error) {
//         console.error(error)
//         return res.status(500).json({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR })
//     }
// }