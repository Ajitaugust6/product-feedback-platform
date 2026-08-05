import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { VoteButton } from './VoteButton';
import { updateFeedbackAdmin } from '../store/slices/feedbackSlice'; 
import type { RootState, AppDispatch } from '../store';

const timeAgo = (dateString?: string) => {
  if (!dateString) return 'Just now';
  
  let postTime = new Date(dateString).getTime();
  
  // The ultimate PostgreSQL/Node driver fix:
  // Re-adds the missing 5.5 hours (in milliseconds) that the backend stripped away
  postTime += (5.5 * 60 * 60 * 1000); 
  
  const currentTime = new Date().getTime();
  const seconds = Math.floor((currentTime - postTime) / 1000);
  
  // If the math pushes a new post slightly into the future, catch it here
  if (seconds < 0 || seconds < 60) return 'Just now';
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  
  return 'Just now';
};

interface FeedbackCardProps {
  post: any;
  onVote: (id: number) => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ post, onVote }) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';

  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(post.status || 'under_review');
  const [adminResponse, setAdminResponse] = useState(post.admin_response || '');
  const [priorityRating, setPriorityRating] = useState(post.admin_priority_rating || 5);

  const handleAdminSubmit = async () => {
    await dispatch(updateFeedbackAdmin({ postId: post.post_id, status, adminResponse, priorityRating }));
    setIsEditing(false); 
  };

  const catName = post.category_name || 'General';
  const creatorName = post.creator_username || 'Anonymous User';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex gap-6 relative">
      <div className="flex-shrink-0">
        <VoteButton upvotes={post.upvote_count} hasVoted={post.has_voted} onVote={(e) => { e.preventDefault(); onVote(post.post_id); }} />
      </div>
      
      <div className="flex-1 w-full overflow-hidden">
        
        {/* User Profile Info & Timestamp */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold uppercase">
            {creatorName.charAt(0)}
          </div>
          <span className="text-sm font-bold text-gray-900">{creatorName}</span>
          <span className="text-sm text-gray-500">· {timeAgo(post.created_at)}</span>
        </div>

        {/* Status Badge */}
        {post.status && post.status !== 'under_review' && (
          <div className="absolute top-6 right-6">
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
              post.status === 'planned' ? 'bg-orange-100 text-orange-700' :
              post.status === 'completed' ? 'bg-green-100 text-green-700' :
              post.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {post.status.replace('_', ' ')}
            </span>
          </div>
        )}

        <h3 className="text-lg font-bold text-gray-900 mb-2 pr-24">{post.title}</h3>
        <p className="text-gray-600 mb-4 text-sm">{post.description}</p>
        
        {/* Category Tag */}
        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded shadow-sm border border-gray-200">
          [{catName}]
        </span>

        {/* OFFICIAL REPLY BANNER WITH GUARANTEED STARS */}
        {post.admin_response && !isEditing && (
          <div className="mt-5 bg-[#F2F6FC] p-4 rounded-lg text-sm text-gray-800 border border-blue-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  A
                </div>
                <span className="font-bold text-gray-900">Product Manager</span>
              </div>
              <span className="text-blue-600 font-bold text-xs flex items-center gap-1">
                ✓ Verified Reply
              </span>
            </div>
            <p className="whitespace-pre-wrap text-gray-700 mb-3">{post.admin_response}</p>
            
            {/* THE STAR RATING FIX */}
            <div className="flex items-center gap-1 bg-white w-fit px-2 py-1 rounded text-yellow-600 font-bold text-xs border border-yellow-200 shadow-sm">
              Priority: {post.admin_priority_rating || 5}.0 <span className="text-yellow-400">★</span>
            </div>
          </div>
        )}

        {/* ADMIN EDIT CONTROLS */}
        {isAdmin && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="text-xs text-blue-600 font-bold hover:underline">
                + Add / Edit Official Response
              </button>
            ) : (
              <div className="flex flex-col gap-3 mt-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full mt-1 border p-2 rounded text-sm bg-white">
                      <option value="under_review">Under Review</option>
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Priority Rating (1-5)</label>
                    <select value={priorityRating} onChange={(e) => setPriorityRating(Number(e.target.value))} className="w-full mt-1 border p-2 rounded text-sm bg-white">
                      <option value="1">1 - Low</option>
                      <option value="2">2 - Medium</option>
                      <option value="3">3 - High</option>
                      <option value="4">4 - Critical</option>
                      <option value="5">5 - Must Have</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Developer Response</label>
                  <textarea value={adminResponse} onChange={(e) => setAdminResponse(e.target.value)} className="w-full mt-1 border p-2 rounded text-sm bg-white h-24 resize-none" placeholder="Type your official update here..." />
                </div>

                <div className="flex gap-2 mt-1">
                  <button onClick={handleAdminSubmit} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 transition">Save Update</button>
                  <button onClick={() => setIsEditing(false)} className="text-gray-500 px-4 py-2 text-sm font-bold hover:bg-gray-100 rounded transition">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};