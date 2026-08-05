# Product Feedback & Feature Requests Platform

This repository contains the MVP for a Product Feedback platform, built with React, Redux, Node.js, Express, and PostgreSQL. 

As an applicant aiming for Product Management, I focused on rapid prototyping, system architecture, database constraints, and state management integration. Included in this repository is the **Product Requirements Document (PRD)** outlining the core MVP scope, user roles, and product KPIs.

---

## A. Database Schema Design
The system uses a relational PostgreSQL database to handle users, posts, and the many-to-many relationship for voting.

* **USERS:** `user_id` (PK), `username`, `email`, `password_hash`, `role`
* **CATEGORIES:** `category_id` (PK), `category_name`, `color_code`
* **FEEDBACK_POSTS:** `post_id` (PK), `user_id` (FK), `title`, `description`, `category_id` (FK), `status`, `upvote_count`, `admin_response`, `admin_priority_rating`
* **VOTES (Joint Table):** `vote_id` (PK), `user_id` (FK), `post_id` (FK). 
  * *Constraint:* Uses `UNIQUE(user_id, post_id)` to ensure one vote per user and prevent duplicate upvotes at the database level.

---

## B. API Specifications (REST)

### 1. GET `/api/v1/feedback`
* **Description:** Lists paginated posts with filtering and sorting.
* **Query Params:** `page`, `sort_by`, `status`, `search`, `category_id`
* **Response (200):** `{ status: "success", data: { feedback_posts: [...], pagination: {...} } }`

### 2. POST `/api/v1/feedback`
* **Description:** Submit new feedback.
* **Headers:** `Authorization: Bearer <JWT>`
* **Body:** `{ "title": "Dark Mode", "description": "...", "category_id": 1 }`
* **Response (201):** `{ status: "success", data: { post_id, created_at } }`

### 3. POST `/api/v1/feedback/:post_id/vote`
* **Description:** Toggles an upvote. Checks the joint `votes` table; if a vote exists, it deletes it and decrements the post count. If not, it inserts it and increments.
* **Headers:** `Authorization: Bearer <JWT>`
* **Response (200):** `{ status: "success", data: { post_id, new_upvote_count, user_has_voted } }`

### 4. PATCH `/api/v1/feedback/:post_id/admin`
* **Description:** Admin-only route to update status, priority rating, and official responses.
* **Headers:** `Authorization: Bearer <JWT>`
* **Body:** `{ "status": "planned", "admin_response": "...", "admin_priority_rating": 5 }`
* **Response (200):** `{ status: "success", data: { ...updatedPost } }`

---

## C. Frontend Architecture & UI Layout

### Component Breakdown
* **`FeedbackCard`:** Reusable component displaying the post details, timestamps, category tags, and conditional rendering for the `AdminResponseBanner`.
* **`VoteButton`:** Handles user interaction for the voting system.
* **`FilterBar`:** Manages the state for global search, status dropdowns, sorting, and categories.
* **`FeedbackModal`:** Form component for submitting new posts.

### State Management (Redux Toolkit)
State updates for voting are handled to ensure a seamless UI experience while maintaining server authority:
1. When a user clicks "Upvote", a Redux async thunk (`toggleVote`) is dispatched.
2. The asynchronous POST request hits the `/vote` endpoint.
3. Upon a successful `200 OK` response, the Redux extraReducer intercepts the payload containing the exact `new_upvote_count` and `user_has_voted` boolean from the database.
4. The global state is updated with the server's exact mathematical reality, instantly reflecting the highlighted state and new count on the UI without requiring a full page refresh.