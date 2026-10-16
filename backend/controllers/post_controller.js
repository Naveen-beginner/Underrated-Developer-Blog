import post from '../models/post_model.js'
import HTTP_STATUS_CODES from '../utils/http_status_codes.js'
import MESSAGES from '../utils/messages.js'

const notifySearchEngines = async (postItem) => {
    if (!postItem || !postItem.slug) return;
    const postUrl = `https://underrateddev.com/post?slug=${encodeURIComponent(postItem.slug)}`;
    const blogUrl = `https://underrateddev.com/blog`;
    const sitemapUrl = `https://underrateddev.com/sitemap.xml`;

    try {
        await fetch('https://api.indexnow.org/IndexNow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                host: 'underrateddev.com',
                key: '4frndtech-ud-indexnow-2026',
                keyLocation: 'https://underrateddev.com/4frndtech-ud-indexnow-2026.txt',
                urlList: [postUrl, blogUrl, sitemapUrl]
            })
        });
    } catch (_) {}

    try {
        await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
    } catch (_) {}
};

const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7)
}

const calculateReadTime = (sections, shortDescription = '') => {
    let wordCount = shortDescription.split(/\s+/).filter(Boolean).length
    if (Array.isArray(sections)) {
        sections.forEach(sec => {
            if (sec.title) wordCount += sec.title.split(/\s+/).filter(Boolean).length
            if (Array.isArray(sec.blocks)) {
                sec.blocks.forEach(b => {
                    if (b.data?.content) wordCount += String(b.data.content).split(/\s+/).filter(Boolean).length
                    if (b.data?.code) wordCount += String(b.data.code).split(/\s+/).filter(Boolean).length
                    if (Array.isArray(b.data?.items)) {
                        b.data.items.forEach(item => { wordCount += String(item).split(/\s+/).filter(Boolean).length })
                    }
                })
            }
        })
    }
    const minutes = Math.max(1, Math.ceil(wordCount / 200))
    return `${minutes} min read`
}

export const createPost = async (req, res) => {
    try {
        const { title, label, shortDescription, sections, dyks, banner, tags, slug } = req.body
        if (!title || !label || !shortDescription || !sections) {
            return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.ERROR.REQUIRED_FIELDS })
        }

        const postSlug = slug && slug.trim() ? slug.trim() : generateSlug(title)
        const readTime = calculateReadTime(sections, shortDescription)

        const newPost = await post.create({
            title,
            slug: postSlug,
            label,
            tags: Array.isArray(tags) ? tags : [label],
            readTime,
            author: req.user._id,
            banner: banner || null,
            shortDescription,
            sections,
            dyks: dyks || []
        })

        notifySearchEngines(newPost).catch(() => {});

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
        const { tag, search, limit } = req.query
        const filter = { published: true }

        if (tag) {
            filter.$or = [
                { label: new RegExp(tag, 'i') },
                { tags: { $in: [new RegExp(tag, 'i')] } }
            ]
        }

        if (search) {
            filter.$or = [
                { title: new RegExp(search, 'i') },
                { shortDescription: new RegExp(search, 'i') },
                { label: new RegExp(search, 'i') }
            ]
        }

        let query = post
            .find(filter)
            .populate('author', 'name username')
            .sort({ publishedAt: -1 })

        if (limit) {
            query = query.limit(parseInt(limit, 10))
        }

        const posts = await query

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
        let postExists = null

        // Check if id is a valid Mongo ObjectId
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            postExists = await post.findById(id).populate('author', 'name username')
        }
        
        // If not found by ID, search by slug
        if (!postExists) {
            postExists = await post.findOne({ slug: id }).populate('author', 'name username')
        }

        if (!postExists) {
            return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ success: false, message: MESSAGES.ERROR.POST_NOT_FOUND })
        }

        // Increment views in background
        post.findByIdAndUpdate(postExists._id, { $inc: { views: 1 } }).exec()

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

        notifySearchEngines(postExists).catch(() => {});

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