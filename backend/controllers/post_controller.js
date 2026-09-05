import post from '../models/post_model.js'
import HTTP_STATUS_CODES from '../utils/http_status_codes.js'
import MESSAGES from '../utils/messages.js'

export const createPost = async (req, res) => {
    try {
        const { title, label, shortDescription, sections, dyks } = req.body
        if (!title || !label || !shortDescription || !sections) {
            return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.ERROR.REQUIRED_FIELDS })
        }

        const newPost = await post.create({
            title,
            label,
            author: req.user._id,
            shortDescription,
            sections,
            dyks
        })

        return res.status(HTTP_STATUS_CODES.CREATED).json({
            success: true,
            message: MESSAGES.SUCCESS.POST_CREATED,
            data: newPost
        })
    } catch (error) {
        console.error('Create post error: ', error)
        return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR })
    }
}

export const getPosts = async (req, res) => {
    try {
        const posts = await post
            .find({ published: true })
            .populate('author', 'username')
            .sort({ publishedAt: -1 })

        return res.status(HTTP_STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.SUCCESS.POSTS_FETCHED,
            data: posts
        })
    } catch (error) {
        console.error('Get posts error: ', error)
        return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR })
    }
}

export const getPostById = async (req, res) => {
    try {
        const { id } = req.params
        const postExists = await post.findById(id).populate('author', 'name')
        if (!postExists) {
            return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.ERROR.POST_NOT_FOUND })
        }

        return res.status(HTTP_STATUS_CODES.OK).json({ success: true, message: MESSAGES.SUCCESS.POST_FETCHED, data: postExists })
    } catch (error) {
        console.error('Get post error: ', error)
        return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR })
    }
}

export const updatePost = async (req, res) => {
    try {
        const { id } = req.params
        const { title, shortDescription, blocks, published } = req.body

        const postExists = await post.findById(id)
        if (!postExists) {
            return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ message: MESSAGES.ERROR.POST_NOT_FOUND })
        }

        if (postExists.author.toString() !== req.user._id.toString()) {
            return res.status(HTTP_STATUS_CODES.FORBIDDEN).json({ message: MESSAGES.ERROR.FORBIDDEN })
        }

        if (title !== undefined) {
            postExists.title = title
        }

        if (shortDescription !== undefined) {
            postExists.shortDescription = shortDescription
        }

        if (blocks !== undefined) {
            postExists.sections = blocks
        }
        if (published !== undefined) {
            postExists.published = published
        }
        if (published && !postExists.publishedAt) {
            postExists.publishedAt = new Date()
        }

        await postExists.save()

        return res.status(HTTP_STATUS_CODES.OK).json({ success: true, message: MESSAGES.SUCCESS.POST_UPDATED, data: postExists })
    } catch (error) {
        console.error('Update post error: ', error)
        return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR })
    }
}

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params
        const postExists = await post.findById(id)
        if (!postExists) {
            return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ message: MESSAGES.ERROR.POST_NOT_FOUND })
        }

        if (postExists.author.toString() !== req.user._id.toString()) {
            return res.status(HTTP_STATUS_CODES.FORBIDDEN).json({ message: MESSAGES.ERROR.FORBIDDEN })
        }

        await postExists.deleteOne()

        return res.status(HTTP_STATUS_CODES.OK).json({ message: MESSAGES.SUCCESS.POST_DELETED })
    } catch (error) {
        console.error('Create post error: ', error)
        return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR })
    }
}