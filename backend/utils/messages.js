const MESSAGES = {
    SUCCESS: {
        POST_CREATED: "Post created successfully",
        POST_UPDATED: "Post updated successfully",
        POST_DELETED: "Post deleted successfully",
        POST_FETCHED: "Post fetched successfully",
        POSTS_FETCHED: "Posts fetched successfully",

        REGISTRATION_SUCCESS: "User registered successfully",
        LOGIN_SUCCESS: "Login successful",
        LOGOUT_SUCCESS: "Logout successful"
    },

    ERROR: {
        INTERNAL_SERVER_ERROR: "Something went wrong on the server",
        BAD_REQUEST: "Invalid request",
        UNAUTHORIZED: "Authentication required",
        FORBIDDEN: "You do not have permission to perform this action",
        NOT_FOUND: "The requested resource was not found",

        POST_NOT_FOUND: "Post not found",
        POST_CREATION_FAILED: "Failed to create post",
        POST_UPDATE_FAILED: "Failed to update post",
        POST_DELETE_FAILED: "Failed to delete post",

        INVALID_CREDENTIALS: "Invalid email or password",
        USER_NOT_FOUND: "User not found",

        USER_EXISTS: "A user already exists with the entered credentials",

        REQUIRED_FIELDS: "Required fields are missing"
    }
}

export default MESSAGES