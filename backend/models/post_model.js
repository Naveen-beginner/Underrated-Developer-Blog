import mongoose from 'mongoose'

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },

    slug: {
        type: String,
        trim: true,
        sparse: true,
        index: true
    },

    label: {
        type: String,
        required: true,
        trim: true
    },

    tags: {
        type: [String],
        default: []
    },

    readTime: {
        type: String,
        default: '5 min read'
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    banner: {
        type: String,
        trim: true,
        default: null
    },

    shortDescription: {
        type: String,
        required: true,
        trim: true,
    },

    sections: [
        {
            title: {
                type: String,
                required: false,
                default: '',
                trim: true
            },

            blocks: [
                {
                    type: {
                        type: String,
                        required: true,
                        enum: [
                            'heading',
                            'subheading',
                            'paragraph',
                            'list',
                            'code',
                            'callout',
                            'quote',
                            'divider',
                            'image'
                        ]
                    },

                    data: {
                        type: mongoose.Schema.Types.Mixed,
                        default: {}
                    }
                }
            ]
        }
    ],

    dyks: [
        {
            badge: {
                type: String,
                required: true,
                trim: true
            },

            number: {
                type: Number,
                required: true
            },

            title: {
                type: String,
                required: true,
                trim: true
            },

            description: {
                type: String,
                required: true,
                trim: true
            }
        }
    ],

    views: {
        type: Number,
        default: 0
    },

    published: {
        type: Boolean,
        default: true
    },

    publishedAt: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true })


const post = mongoose.model('post', PostSchema)

export default post