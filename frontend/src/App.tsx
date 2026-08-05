import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import { fetchFeedback, toggleVote } from './store/slices/feedbackSlice';
import { logout } from './store/slices/signinSlice';
import { FilterBar } from './components/FilterBar';
import { FeedbackCard } from './components/FeedbackCard';
import FeedbackModal from './components/FeedbackModal';
import AuthModal from './components/AuthModal';

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { posts, pagination } = useSelector((state: RootState) => state.feedback);
  const user = useSelector((state: RootState) => state.auth.user);
  
  // State for all 4 filter criteria
  const [sortBy, setSortBy] = useState('most_voted');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Re-fetch feedback from backend whenever ANY filter changes
  useEffect(() => {
    dispatch(fetchFeedback({ 
      page: 1, 
      sort_by: sortBy, 
      status: status, 
      category_id: category,
      search: searchQuery 
    }));
  }, [dispatch, sortBy, status, category, searchQuery]);

  const handleVote = (id: number) => {
    dispatch(toggleVote(id));
  };

  const handleRefresh = () => {
    dispatch(fetchFeedback({ 
      page: 1, 
      sort_by: sortBy, 
      status: status, 
      category_id: category,
      search: searchQuery 
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100">
          <h1 className="text-xl font-bold text-gray-800">Feature Requests</h1>
          
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600">Hi, {user.username}</span>
                <button
                  onClick={() => dispatch(logout())}
                  className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 shadow-sm"
              >
                Log In / Sign Up
              </button>
            )}
          </div>
        </div>
        
        {/* Navigation & Filter Bar */}
        <FilterBar
          sortBy={sortBy}
          onSortChange={setSortBy}
          status={status}
          onStatusChange={setStatus}
          category={category}
          onCategoryChange={setCategory}
          onSearchChange={setSearchQuery}
          totalItems={pagination?.total_items || posts.length}
          onAddClick={() => setIsModalOpen(true)} 
        />

        {/* Feedback List */}
        <div className="mt-6 space-y-4">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <FeedbackCard
                key={post.post_id}
                post={post}
                onVote={handleVote}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-500">
              No feedback posts found matching your filters.
            </div>
          )}
        </div>

        {/* Create Feedback Modal */}
        <FeedbackModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onSubmitSuccess={handleRefresh}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />

      </div>
    </div>
  );
};

export default App;