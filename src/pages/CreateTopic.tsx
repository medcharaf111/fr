import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';

interface Category {
  id: number;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
}

const CreateTopic: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    content: '',
    subject: '',
    region: '',
    schoolLevel: '',
    tags: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      // Process tags
      const tagNames = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch('http://localhost:8000/api/forum/topics/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: parseInt(formData.category),
          title: formData.title,
          content: formData.content,
          related_subject: formData.subject || null,
          region: formData.region || null,
          school_level: formData.schoolLevel || null,
          tag_names: tagNames,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Topic created successfully:', data);
        navigate(`/forum/topics/${data.id}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to create topic:', response.status, errorData);
        alert(t('forum.create.error') + ': ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      alert(t('forum.create.error'));
    } finally {
      setLoading(false);
    }
  };

  const subjects = [
    'math',
    'science',
    'english',
    'arabic',
    'social_studies',
    'art',
    'music',
    'physical_education',
    'computer_science',
    'religious_studies',
  ];

  const schoolLevels = [
    'Primary',
    'Secondary',
    'High School',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50" dir={dir}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/forum')}
              className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
              <span>Back to Forum</span>
            </button>
            <LanguageToggle />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('forum.create.title')}</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forum.create.selectCategory')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-4 py-2 border ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              >
                <option value="">{t('forum.create.selectCategory')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {language === 'ar' ? cat.name_ar : cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forum.create.topicTitle')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('forum.create.topicTitle.placeholder')}
                className={`w-full px-4 py-2 border ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forum.create.content')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={t('forum.create.content.placeholder')}
                rows={8}
                className={`w-full px-4 py-2 border ${
                  errors.content ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none`}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-500">{errors.content}</p>
              )}
            </div>

            {/* Subject (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forum.create.subject')}
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">{t('forum.create.subject')}</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Region and School Level (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('forum.create.region')}
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="e.g., Tunis, Sfax"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('forum.create.schoolLevel')}
                </label>
                <select
                  value={formData.schoolLevel}
                  onChange={(e) => setFormData({ ...formData, schoolLevel: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">{t('forum.create.schoolLevel')}</option>
                  {schoolLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forum.create.tags')}
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder={t('forum.create.tags.placeholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                {language === 'ar'
                  ? 'افصل الوسوم بفواصل. مثال: تدريس، رياضيات، تكنولوجيا'
                  : 'Separate tags with commas. Example: teaching, math, technology'}
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 rtl:space-x-reverse pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/forum')}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('forum.topic.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 rtl:space-x-reverse"
              >
                <span>{loading ? t('forum.create.submitting') : t('forum.create.submit')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTopic;
