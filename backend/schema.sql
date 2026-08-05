-- Create ENUMs
CREATE TYPE user_role_enum AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE status_enum AS ENUM ('under_review', 'planned', 'in_progress', 'completed');
CREATE TYPE vote_type_enum AS ENUM ('upvote', 'downvote');

-- 1. USERS Table
CREATE TABLE IF NOT EXISTS users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_role user_role_enum DEFAULT 'user',
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 2. CATEGORIES Table
CREATE TABLE IF NOT EXISTS categories (
    category_id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color_code VARCHAR(7),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 3. FEEDBACK_POSTS Table
CREATE TABLE IF NOT EXISTS feedback_posts (
    post_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category_id BIGINT REFERENCES categories(category_id),
    status status_enum DEFAULT 'under_review',
    upvote_count INT DEFAULT 0,
    admin_priority_rating INT CHECK (admin_priority_rating >= 1 AND admin_priority_rating <= 5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    creator_ip INET NOT NULL,
    is_archived BOOLEAN DEFAULT false
);

-- 4. VOTES Table
CREATE TABLE IF NOT EXISTS votes (
    vote_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    post_id BIGINT REFERENCES feedback_posts(post_id),
    vote_type vote_type_enum DEFAULT 'upvote',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 5. OFFICIAL_RESPONSES Table
CREATE TABLE IF NOT EXISTS official_responses (
    response_id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES feedback_posts(post_id),
    admin_id BIGINT REFERENCES users(user_id),
    response_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    edited_by BIGINT REFERENCES users(user_id),
    is_pinned BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false
);

-- Indexes for Performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON feedback_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON feedback_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON feedback_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON feedback_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_upvote_count ON feedback_posts(upvote_count DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_user_post ON votes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_responses_post_id ON official_responses(post_id);