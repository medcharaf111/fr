import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ThumbsUp,
  Bookmark,
  MessageSquare,
  Eye,
  CheckCircle,
  Lock,
  Pin,
  MoreVertical
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';

interface Topic {
  id: number;
  title: string;
  content: string;
  category: {
    id: number;
    name: string;
    name_ar: string;
  };
  author: {
    id: number;
    username: string;
    full_name: string;
    role: string;
  };
  is_pinned: boolean;
  status: string;
  views_count: number;
  likes_count: number;
  is_liked_by_user: boolean;
  is_bookmarked: boolean;
  created_at: string;
  replies: Reply[];
}

interface Reply {
  id: number;
  author: {
    id: number;
    username: string;
    full_name: string;
    role: string;
  };
  content: string;
  is_solution: boolean;
  is_edited: boolean;
  likes_count: number;
  is_liked_by_user: boolean;
  sub_replies_count: number;
  created_at: string;
}

const TopicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');

  useEffect(() => {
    fetchTopic();
  }, [id]);

  const fetchTopic = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/forum/topics/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch topic');
      }
      
      const data = await response.json();
      setTopic(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching topic:', error);
      setLoading(false);
    }
  };

  const handleLikeTopic = async () => {
    if (!topic) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/forum/topics/${id}/like/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        // Optimistically update UI
        setTopic({
          ...topic,
          is_liked_by_user: !topic.is_liked_by_user,
          likes_count: topic.is_liked_by_user ? topic.likes_count - 1 : topic.likes_count + 1
        });
      } else {
        console.error('Failed to like topic:', response.status);
      }
    } catch (error) {
      console.error('Error liking topic:', error);
    }
  };

  const handleBookmark = async () => {
    if (!topic) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/forum/topics/${id}/bookmark/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        // Optimistically update UI
        setTopic({
          ...topic,
          is_bookmarked: !topic.is_bookmarked
        });
      } else {
        console.error('Failed to bookmark:', response.status);
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
    }
  };

  const handlePostReply = async () => {
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      await fetch('http://localhost:8000/api/forum/replies/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: id,
          content: replyContent,
        }),
      });
      setReplyContent('');
      fetchTopic();
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeReply = async (replyId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:8000/api/forum/replies/${replyId}/like/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      fetchTopic();
    } catch (error) {
      console.error('Error liking reply:', error);
    }
  };

  const handleMarkSolution = async (replyId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:8000/api/forum/replies/${replyId}/mark_solution/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      fetchTopic();
    } catch (error) {
      console.error('Error marking solution:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-TN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Topic not found</h2>
          <button
            onClick={() => navigate('/forum')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Back to Forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir={dir}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/forum')}
              className="flex items-center space-x-2 rtl:space-x-reverse text-white hover:bg-white/20 px-4 py-2 rounded-xl transition-all backdrop-blur-sm border border-white/30 font-semibold hover:scale-105 transform"
            >
              <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
              <span>{t('common.back')}</span>
            </button>
            <LanguageToggle />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Topic Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-indigo-100">
          {/* Topic Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
              {topic.is_pinned && (
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-1.5 rtl:space-x-reverse font-bold shadow-md">
                  <Pin className="w-3.5 h-3.5" />
                  <span>{t('forum.topic.pinned')}</span>
                </span>
              )}
              {topic.status === 'closed' && (
                <span className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-1.5 rtl:space-x-reverse font-bold shadow-md">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t('forum.topic.closed')}</span>
                </span>
              )}
              <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full">
                {language === 'ar' ? topic.category.name_ar : topic.category.name}
              </span>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">{topic.title}</h1>

            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {topic.author.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{topic.author.full_name}</div>
                    <div className="text-sm text-gray-600 flex items-center space-x-1">
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">{topic.author.role}</span>
                      <span>•</span>
                      <span>{formatDate(topic.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm">
                <span className="flex items-center space-x-1.5 rtl:space-x-reverse bg-white px-3 py-2 rounded-lg shadow-sm">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-700">{topic.views_count}</span>
                </span>
                <span className="flex items-center space-x-1.5 rtl:space-x-reverse bg-white px-3 py-2 rounded-lg shadow-sm">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-indigo-700">{topic.replies.length}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Topic Content */}
          <div className="prose max-w-none mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">{topic.content}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse pt-6 border-t border-gray-200">
            <button
              onClick={handleLikeTopic}
              className={`flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 rounded-xl transition-all font-semibold shadow-md hover:shadow-lg hover:scale-105 transform ${
                topic.is_liked_by_user
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${topic.is_liked_by_user ? 'fill-current' : ''}`} />
              <span>{topic.likes_count}</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 rounded-xl transition-all font-semibold shadow-md hover:shadow-lg hover:scale-105 transform ${
                topic.is_bookmarked
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${topic.is_bookmarked ? 'fill-current' : ''}`} />
              <span>{topic.is_bookmarked ? t('forum.topic.bookmarked') : t('forum.topic.bookmark')}</span>
            </button>
          </div>
        </div>

        {/* Replies Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            <span>{topic.replies.length} {topic.replies.length === 1 ? t('forum.topic.reply') : t('forum.topic.replies')}</span>
          </h2>

          {/* Replies List */}
          {topic.replies.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl">
              <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-indigo-600" />
              </div>
              <p className="text-gray-700 font-semibold mb-2">{t('forum.topic.noReplies')}</p>
              <p className="text-sm text-gray-500">{t('forum.topic.noReplies.desc')}</p>
            </div>
          ) : (
            <div className="space-y-5 mb-8">
              {topic.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`rounded-xl p-6 transition-all hover:shadow-lg border-2 ${
                    reply.is_solution 
                      ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md' 
                      : 'border-gray-200 bg-white hover:border-indigo-200'
                  }`}
                >
                  {reply.is_solution && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3 text-green-700 font-bold">
                      <CheckCircle className="w-5 h-5 fill-current" />
                      <span className="text-sm">✅ {t('forum.topic.solution')}</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {reply.author.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{reply.author.full_name}</div>
                        <div className="text-sm text-gray-600 flex items-center space-x-1.5">
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">{reply.author.role}</span>
                          <span>•</span>
                          <span>{formatDate(reply.created_at)}</span>
                          {reply.is_edited && <span className="text-gray-400">({t('forum.reply.edited')})</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-800 text-lg mb-4 whitespace-pre-wrap leading-relaxed">{reply.content}</p>

                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <button
                      onClick={() => handleLikeReply(reply.id)}
                      className={`flex items-center space-x-1.5 rtl:space-x-reverse px-4 py-2 rounded-lg transition-all font-semibold ${
                        reply.is_liked_by_user 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${reply.is_liked_by_user ? 'fill-current' : ''}`} />
                      <span>{reply.likes_count}</span>
                    </button>

                    {topic.author.id === currentUserId && !reply.is_solution && (
                      <button
                        onClick={() => handleMarkSolution(reply.id)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-400 to-emerald-400 text-white font-semibold hover:shadow-lg transition-all flex items-center space-x-1.5 rtl:space-x-reverse"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{t('forum.topic.markSolution')}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply Form */}
          {topic.status !== 'closed' && (
            <div className="border-t-2 border-indigo-100 pt-8 mt-8">
              <h3 className="font-bold text-xl text-gray-900 mb-5 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <span>{t('forum.topic.writeReply')}</span>
              </h3>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={t('forum.topic.writeReply')}
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-lg shadow-sm hover:border-indigo-300 transition-all"
                rows={5}
              />
              <div className="flex justify-end space-x-3 rtl:space-x-reverse mt-5">
                <button
                  onClick={() => setReplyContent('')}
                  className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-all font-semibold border border-gray-300"
                >
                  {t('forum.topic.cancel')}
                </button>
                <button
                  onClick={handlePostReply}
                  disabled={submitting || !replyContent.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all disabled:bg-gray-300 disabled:cursor-not-allowed font-bold hover:scale-105 transform"
                >
                  {submitting ? t('forum.create.submitting') : t('forum.topic.postReply')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicDetail;
