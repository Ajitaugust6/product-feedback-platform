import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createFeedback } from '../store/slices/feedbackSlice';
import type { AppDispatch } from '../store';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmitSuccess }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return alert("Please select a category!");
    
    try {
      await dispatch(createFeedback({ title, description, category_id: Number(categoryId) })).unwrap();
      setTitle(''); 
      setCategoryId(''); 
      setDescription('');
      onClose();
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Submit Your Feedback</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-700">Title</label>
            <input
              type="text" 
              required 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-gray-700">Category</label>
            <select
              value={categoryId} 
              onChange={(e) => setCategoryId(Number(e.target.value))} 
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
            >
              <option value="" disabled>Select a category...</option>
              <option value="1">UI/UX</option>
              <option value="2">Performance</option>
              <option value="3">Security</option>
              <option value="4">Mobile</option>
              <option value="5">Integrations</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-gray-700">Description</label>
            <textarea
              required 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button type="submit" className="w-full mt-2 rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white hover:bg-blue-700">
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;