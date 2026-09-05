import mongoose from 'mongoose'

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },

    label: {
        type: String,
        required: true,
        trim: true
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
                required: true,
                trim: true
            },

            blocks: [
                {
                    type: {
                        type: String,
                        required: true,
                        enum: [
                            'heading',
                            'paragraph',
                            'list'
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