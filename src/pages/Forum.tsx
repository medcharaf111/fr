import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Plus,
  Filter,
  TrendingUp,
  Clock,
  Eye,
  Bookmark,
  Bell,
  BookOpen,
  Users,
  Award,
  Laptop,
  MapPin,
  GraduationCap,
  FileText
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';

interface Category {
  id: number;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  category_type: string;
  icon: string;
  topic_count: number;
}

interface Topic {
  id: number;
  title: string;
  category_name: string;
  category_name_ar: string;
  author: {
    id: number;
    username: string;
    full_name: string;
    role: string;
  };
  is_pinned: boolean;
  status: string;
  views_count: number;
  reply_count: number;
  likes_count: number;
  is_bookmarked: boolean;
  last_reply: {
    author: string;
    created_at: string;
  } | null;
  created_at: string;
  tags: { id: number; name: string; name_ar: string }[];
}

const Forum: React.FC = () => {
  const { t, language, dir } = useLanguage();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'replies' | 'views'>('recent');
  const [showMyTopics, setShowMyTopics] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Format relative time (e.g., "2 hours ago")
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };
    
    if (seconds < 60) {
      return language === 'ar' ? 'الآن' : 'just now';
    }
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        if (language === 'ar') {
          const unitAr: { [key: string]: string } = {
            year: interval === 1 ? 'سنة' : interval === 2 ? 'سنتان' : 'سنوات',
            month: interval === 1 ? 'شهر' : interval === 2 ? 'شهران' : 'أشهر',
            week: interval === 1 ? 'أسبوع' : interval === 2 ? 'أسبوعان' : 'أسابيع',
            day: interval === 1 ? 'يوم' : interval === 2 ? 'يومان' : 'أيام',
            hour: interval === 1 ? 'ساعة' : interval === 2 ? 'ساعتان' : 'ساعات',
            minute: interval === 1 ? 'دقيقة' : interval === 2 ? 'دقيقتان' : 'دقائق',
          };
          return `منذ ${interval} ${unitAr[unit]}`;
        } else {
          return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
        }
      }
    }
    
    return language === 'ar' ? 'الآن' : 'just now';
  };

  const categoryIcons: { [key: string]: React.ReactNode } = {
    'BookOpen': <BookOpen className="w-5 h-5" />,
    'FileText': <FileText className="w-5 h-5" />,
    'GraduationCap': <GraduationCap className="w-5 h-5" />,
    'Award': <Award className="w-5 h-5" />,
    'Laptop': <Laptop className="w-5 h-5" />,
    'MapPin': <MapPin className="w-5 h-5" />,
    'MessageSquare': <MessageSquare className="w-5 h-5" />,
  };

  useEffect(() => {
    fetchCategories();
    fetchTopics();
  }, [selectedCategory, sortBy, showMyTopics, showBookmarks]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/forum/categories/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      let url = 'http://localhost:8000/api/forum/topics/?';
      
      if (selectedCategory) {
        url += `category=${selectedCategory}&`;
      }
      
      if (showMyTopics) {
        url += 'my_topics=true&';
      }
      
      if (showBookmarks) {
        const bookmarksResponse = await fetch('http://localhost:8000/api/forum/bookmarks/', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!bookmarksResponse.ok) {
          throw new Error('Failed to fetch bookmarks');
        }
        
        const bookmarks = await bookmarksResponse.json();
        setTopics(Array.isArray(bookmarks) ? bookmarks.map((b: any) => b.topic) : []);
        setLoading(false);
        return;
      }
      
      // Sort
      const orderingMap = {
        recent: '-last_activity',
        replies: '-reply_count',
        views: '-views_count',
      };
      url += `ordering=${orderingMap[sortBy]}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }
      
      const data = await response.json();
      setTopics(Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : []));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}${language === 'ar' ? ' دقيقة' : ' min ago'}`;
    } else if (diffHours < 24) {
      return `${diffHours}${language === 'ar' ? ' ساعة' : ' hours ago'}`;
    } else if (diffDays < 7) {
      return `${diffDays}${language === 'ar' ? ' يوم' : ' days ago'}`;
    }
    return date.toLocaleDateString(language === 'ar' ? 'ar-TN' : 'en-US');
  };

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir={dir}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">{t('forum.title')}</h1>
                <p className="text-indigo-100 font-medium">{t('forum.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <button className="p-2.5 hover:bg-white/20 rounded-xl transition-all relative backdrop-blur-sm border border-white/30 hover:scale-110 transform">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg"></span>
              </button>
              <LanguageToggle />
              <button
                onClick={() => navigate('/forum/create')}
                className="flex items-center space-x-2 rtl:space-x-reverse bg-white text-indigo-600 px-6 py-3 rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span>{t('forum.newTopic')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-28 border border-indigo-100">
              <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center space-x-2">
                <Filter className="w-5 h-5 text-indigo-600" />
                <span>{t('forum.filters')}</span>
              </h3>
              
              {/* Categories */}
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setShowMyTopics(false);
                    setShowBookmarks(false);
                  }}
                  className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-3 rounded-xl transition-all font-medium ${
                    !selectedCategory && !showMyTopics && !showBookmarks
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105 transform'
                      : 'hover:bg-indigo-50 text-gray-700 hover:scale-102 transform'
                  }`}
                >
                  {t('forum.allCategories')}
                </button>
                
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedCategory(cat.id);
                      setShowMyTopics(false);
                      setShowBookmarks(false);
                    }}
                    className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-3 rounded-xl transition-all flex items-center ${dir === 'rtl' ? 'space-x-reverse' : ''} space-x-3 font-medium group ${
                      selectedCategory === cat.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105 transform'
                        : 'hover:bg-indigo-50 text-gray-700 hover:scale-102 transform'
                    }`}
                  >
                    <span className={`${selectedCategory === cat.id ? 'text-white' : 'text-indigo-600 group-hover:text-indigo-700'}`}>
                      {categoryIcons[cat.icon]}
                    </span>
                    <span className="flex-1">{language === 'ar' ? cat.name_ar : cat.name}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      selectedCategory === cat.id 
                        ? 'bg-white/30 text-white' 
                        : 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200'
                    }`}>
                      {cat.topic_count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowMyTopics(true);
                    setShowBookmarks(false);
                    setSelectedCategory(null);
                  }}
                  className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg transition-colors ${
                    showMyTopics ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {t('forum.myTopics')}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowBookmarks(true);
                    setShowMyTopics(false);
                    setSelectedCategory(null);
                  }}
                  className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg transition-colors ${
                    showBookmarks ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {t('forum.myBookmarks')}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Sort */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
                  <input
                    type="text"
                    placeholder={t('forum.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="recent">{t('forum.mostRecent')}</option>
                  <option value="replies">{t('forum.mostReplies')}</option>
                  <option value="views">{t('forum.mostViews')}</option>
                </select>
              </div>
            </div>

            {/* Topics List */}
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 font-medium">{t('common.loading')}...</p>
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-xl p-16 text-center border border-indigo-100">
                <div className="bg-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('forum.noTopics')}</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">{t('forum.noTopics.desc')}</p>
                <button
                  onClick={() => navigate('/forum/create')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform"
                >
                  {t('forum.createFirst')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTopics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => navigate(`/forum/topics/${topic.id}`)}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border border-indigo-50 hover:border-indigo-200 hover:scale-[1.02] transform"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
                          {topic.is_pinned && (
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-md">
                              📌 {t('forum.topic.pinned')}
                            </span>
                          )}
                          <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                            {language === 'ar' ? topic.category_name_ar : topic.category_name}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-indigo-600 transition-colors">
                          {topic.title}
                        </h3>
                        
                        <div className="flex items-center space-x-5 rtl:space-x-reverse text-sm text-gray-600 mb-3">
                          <span className="flex items-center space-x-1.5 rtl:space-x-reverse font-medium">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                              {topic.author.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span>{topic.author.full_name}</span>
                          </span>
                          <span className="flex items-center space-x-1 rtl:space-x-reverse bg-green-50 px-3 py-1 rounded-full">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-green-700">{formatTimeAgo(topic.created_at)}</span>
                          </span>
                          <span className="flex items-center space-x-1 rtl:space-x-reverse bg-gray-100 px-3 py-1 rounded-full">
                            <Eye className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold">{topic.views_count}</span>
                          </span>
                          <span className="flex items-center space-x-1 rtl:space-x-reverse bg-indigo-50 px-3 py-1 rounded-full">
                            <MessageSquare className="w-4 h-4 text-indigo-600" />
                            <span className="font-semibold text-indigo-700">{topic.reply_count}</span>
                          </span>
                          {topic.is_bookmarked && (
                            <Bookmark className="w-4 h-4 fill-current text-indigo-600" />
                          )}
                        </div>
                        
                        {topic.last_reply && (
                          <div className="mt-3 text-sm text-gray-500">
                            {t('forum.topic.lastReply')} {t('forum.topic.by')} {topic.last_reply.author} • {formatDate(topic.last_reply.created_at)}
                          </div>
                        )}
                        
                        {topic.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {topic.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                              >
                                {language === 'ar' && tag.name_ar ? tag.name_ar : tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
