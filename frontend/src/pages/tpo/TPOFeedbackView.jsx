import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Star, Search, Filter, User, Calendar, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import ToastNotification from '../../components/ui/ToastNotification';

const TPOFeedbackView = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTrainer, setSelectedTrainer] = useState('all');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/tpo/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(response.data.data.feedbacks || []);
    } catch (err) {
      showToast('error', 'Failed to load feedback');
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique trainers from training category feedback
  const trainers = useMemo(() => {
    const trainingFeedbacks = feedbacks.filter(f => f.category === 'training');
    const trainerMap = new Map();

    trainingFeedbacks.forEach(feedback => {
      if (feedback.toTrainer) {
        trainerMap.set(feedback.toTrainer._id, {
          id: feedback.toTrainer._id,
          name: feedback.toTrainer.name,
          subject: feedback.toTrainer.subjectDealing
        });
      } else if (feedback.otherTrainerName) {
        const key = `other_${feedback.otherTrainerName}`;
        trainerMap.set(key, {
          id: key,
          name: feedback.otherTrainerName,
          subject: null
        });
      }
    });

    return Array.from(trainerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [feedbacks]);

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch =
      feedback.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.fromStudent?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.toTrainer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.otherTrainerName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || feedback.category === selectedCategory;

    // Trainer filter (only for training category)
    let matchesTrainer = true;
    if (selectedCategory === 'training' && selectedTrainer !== 'all') {
      if (feedback.toTrainer) {
        matchesTrainer = feedback.toTrainer._id === selectedTrainer;
      } else if (feedback.otherTrainerName) {
        matchesTrainer = `other_${feedback.otherTrainerName}` === selectedTrainer;
      } else {
        matchesTrainer = false;
      }
    }

    return matchesSearch && matchesCategory && matchesTrainer;
  });

  // Group by category
  const groupedFeedbacks = {
    training: filteredFeedbacks.filter(f => f.category === 'training'),
    placement: filteredFeedbacks.filter(f => f.category === 'placement'),
    facilities: filteredFeedbacks.filter(f => f.category === 'facilities'),
    coordinator: filteredFeedbacks.filter(f => f.category === 'coordinator'),
    general: filteredFeedbacks.filter(f => f.category === 'general'),
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'training', label: 'Training' },
    { value: 'placement', label: 'Placement' },
    { value: 'facilities', label: 'Facilities' },
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'general', label: 'General' },
  ];

  // Reset trainer filter when category changes
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category !== 'training') {
      setSelectedTrainer('all');
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Feedback Management</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Total: {filteredFeedbacks.length} {selectedCategory !== 'all' && `${selectedCategory} `}feedback(s)
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student, trainer, title, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter Buttons */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Category:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.value
                      ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                  {cat.value !== 'all' && ` (${groupedFeedbacks[cat.value]?.length || 0})`}
                </button>
              ))}
            </div>

            {/* Trainer Sub-Filter (only show for Training category) */}
            {selectedCategory === 'training' && trainers.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Filter by Trainer:</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedTrainer('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedTrainer === 'all'
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Trainers ({groupedFeedbacks.training?.length || 0})
                  </button>
                  {trainers.map(trainer => {
                    const trainerFeedbackCount = groupedFeedbacks.training?.filter(f =>
                      f.toTrainer?._id === trainer.id || `other_${f.otherTrainerName}` === trainer.id
                    ).length || 0;

                    return (
                      <button
                        key={trainer.id}
                        onClick={() => setSelectedTrainer(trainer.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedTrainer === trainer.id
                            ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {trainer.name}
                        {trainer.subject && ` (${trainer.subject})`}
                        {` (${trainerFeedbackCount})`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback List - Organized by Category */}
      {selectedCategory === 'all' ? (
        // Show all categories grouped
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(groupedFeedbacks).map(([category, items]) => {
            if (items.length === 0) return null;

            const categoryInfo = categories.find(c => c.value === category);

            return (
              <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-blue-100 text-blue-800">
                        {categoryInfo?.label}
                      </span>
                      <span className="text-sm sm:text-base text-gray-600">({items.length})</span>
                    </h3>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {items.map(feedback => (
                    <FeedbackCard key={feedback._id} feedback={feedback} />
                  ))}
                </div>
              </div>
            );
          })}

          {filteredFeedbacks.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
              <MessageSquare className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500">No feedback found</p>
            </div>
          )}
        </div>
      ) : (
        // Show selected category only
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredFeedbacks.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <MessageSquare className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500">
                No {selectedCategory} feedback found
                {selectedCategory === 'training' && selectedTrainer !== 'all' && ' for this trainer'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFeedbacks.map(feedback => (
                <FeedbackCard key={feedback._id} feedback={feedback} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

// Feedback Card Component
const FeedbackCard = ({ feedback }) => {
  return (
    <div className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
      <div className="space-y-2 sm:space-y-3">
        {/* Header - Title and Rating */}
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 break-words">{feedback.title}</h4>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 sm:h-4 w-3 sm:w-4 ${
                    i < feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-xs sm:text-sm text-gray-600 ml-1">({feedback.rating}/5)</span>
            </div>
          </div>

          {feedback.response && (
            <span className="px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
              Responded
            </span>
          )}
        </div>

        {/* Content */}
        <p className="text-xs sm:text-sm text-gray-700 break-words">{feedback.content}</p>

        {/* Suggestions */}
        {feedback.suggestions && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-2 sm:p-3 rounded">
            <p className="text-[10px] sm:text-xs font-semibold text-blue-900 mb-1">Suggestions:</p>
            <p className="text-[10px] sm:text-xs text-blue-800 break-words">{feedback.suggestions}</p>
          </div>
        )}

        {/* Response */}
        {feedback.response && (
          <div className="bg-green-50 border-l-4 border-green-500 p-2 sm:p-3 rounded">
            <p className="text-[10px] sm:text-xs font-semibold text-green-900 mb-1">Response:</p>
            <p className="text-[10px] sm:text-xs text-green-800 break-words">{feedback.response.content}</p>
            <p className="text-[9px] sm:text-[10px] text-green-700 mt-1">
              Responded on {new Date(feedback.response.respondedAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Footer - Student and Trainer Info */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-600 pt-2 border-t border-gray-100">
          {!feedback.isAnonymous && feedback.fromStudent && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="break-words"><strong>From:</strong> {feedback.fromStudent.name} ({feedback.fromStudent.rollNo})</span>
            </div>
          )}
          {feedback.isAnonymous && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="italic">Anonymous Student</span>
            </div>
          )}

          {feedback.toTrainer && (
            <div className="flex items-center gap-1">
              <span className="break-words"><strong>To:</strong> {feedback.toTrainer.name}</span>
            </div>
          )}
          {!feedback.toTrainer && feedback.otherTrainerName && (
            <div className="flex items-center gap-1">
              <span className="break-words"><strong>To:</strong> {feedback.otherTrainerName}</span>
            </div>
          )}

          <div className="flex items-center gap-1 sm:ml-auto">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TPOFeedbackView;
