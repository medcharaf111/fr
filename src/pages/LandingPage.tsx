import DarkModeToggle from '@/components/DarkModeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-background" dir={dir} style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Navigation Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Native OS" className="w-10 h-10" />
              <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>Native OS</span>
            </div>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <LanguageToggle />
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-muted-foreground hover:text-foreground"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
              >
                {t('landing.login')}
              </Button>
              <Button
                onClick={() => navigate('/demo')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-7 py-5 rounded-md shadow-sm"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
              >
                {t('landing.demo')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden">
        {/* Blurred Background Image */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(https://cdn.pixabay.com/photo/2015/07/17/22/43/student-849825_1280.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(8px)',
              transform: 'scale(1.05)'
            }}
          ></div>
          <div className="absolute inset-0 bg-background/60"></div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse z-[2]"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse z-[2]" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={`max-w-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'}`}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] mb-6" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.03em' }}>
                {t('landing.title')}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t('landing.subtitle')} <span className="text-primary font-semibold">{t('landing.subtitle2')}</span>
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/demo')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-7 text-lg rounded-md shadow-lg hover:shadow-xl transition-all"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
                >
                  {t('landing.demo')}
                </Button>
                <Button
                  size="lg"
                  onClick={() => navigate('/register')}
                  variant="outline"
                  className="border-border hover:border-primary hover:bg-accent px-10 py-7 text-lg rounded-md"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
                >
                  {t('landing.register')}
                </Button>
              </div>
            </div>
            
            {/* Hero Image/Illustration */}
            <div className={`relative lg:block hidden transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}>
              <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl p-8 aspect-[4/3]">
                <div className="absolute inset-0 bg-white/10 rounded-2xl backdrop-blur-sm"></div>
                <div className="relative h-full flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    {/* Dashboard Preview Cards */}
                    <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg">
                      <div className="h-3 w-3/4 bg-gray-300 rounded mb-3"></div>
                      <div className="h-2 w-full bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
                    </div>
                    <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg mt-8">
                      <div className="h-3 w-2/3 bg-gray-300 rounded mb-3"></div>
                      <div className="h-2 w-full bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 w-4/6 bg-gray-200 rounded"></div>
                    </div>
                    <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg -mt-4">
                      <div className="h-3 w-3/4 bg-gray-300 rounded mb-3"></div>
                      <div className="h-2 w-full bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
                    </div>
                    <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg">
                      <div className="h-3 w-2/3 bg-gray-300 rounded mb-3"></div>
                      <div className="h-2 w-full bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-background relative">
        <div className="absolute inset-0 bg-gradient-to-b from-muted to-background"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className={`text-center transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-5xl font-bold text-blue-600 mb-2" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>2,500+</div>
              <div className="text-gray-500 text-sm uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{t('landing.schools')}</div>
            </div>
            <div className={`text-center transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-5xl font-bold text-blue-600 mb-2" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>50,000+</div>
              <div className="text-gray-500 text-sm uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{t('landing.teachers')}</div>
            </div>
            <div className={`text-center transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-5xl font-bold text-blue-600 mb-2" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>1M+</div>
              <div className="text-gray-500 text-sm uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{t('landing.students')}</div>
            </div>
            <div className={`text-center transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-5xl font-bold text-blue-600 mb-2" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>24/7</div>
              <div className="text-gray-500 text-sm uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{t('landing.support')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Background with texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted"></div>
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className={`mb-20 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
              {t('landing.whyChoose')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('landing.whyChoose.desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className={`group bg-card p-10 rounded-lg border border-border shadow-sm hover:shadow-xl transition-all duration-700 hover:-translate-y-1 overflow-hidden relative ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'}`}>
              <div className="mb-5 w-full h-48 rounded-lg overflow-hidden relative">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'url(https://cdn.pixabay.com/photo/2016/11/19/14/00/code-1839406_1280.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(2px)'
                }}></div>
                <div className="absolute inset-0 bg-primary/60"></div>
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>{t('landing.complete.title')}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t('landing.complete.desc')}
              </p>
            </div>

            <div className={`group bg-card p-10 rounded-lg border border-border shadow-sm hover:shadow-xl transition-all duration-700 delay-200 hover:-translate-y-1 overflow-hidden relative ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}>
              <div className="mb-5 w-full h-48 rounded-lg overflow-hidden relative">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'url(https://cdn.pixabay.com/photo/2016/11/29/05/45/astronomy-1867616_1280.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(2px)'
                }}></div>
                <div className="absolute inset-0 bg-secondary/60"></div>
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>{t('landing.language.title')}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t('landing.language.desc')}
              </p>
            </div>

            <div className={`group bg-card p-10 rounded-lg border border-border shadow-sm hover:shadow-xl transition-all duration-700 delay-300 hover:-translate-y-1 overflow-hidden relative ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'}`}>
              <div className="mb-5 w-full h-48 rounded-lg overflow-hidden relative">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'url(https://cdn.pixabay.com/photo/2016/11/27/21/42/stock-1863880_1280.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(2px)'
                }}></div>
                <div className="absolute inset-0 bg-accent/60"></div>
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>{t('landing.insights.title')}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t('landing.insights.desc')}
              </p>
            </div>

            <div className={`group bg-card p-10 rounded-lg border border-border shadow-sm hover:shadow-xl transition-all duration-700 delay-500 hover:-translate-y-1 overflow-hidden relative ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}>
              <div className="mb-5 w-full h-48 rounded-lg overflow-hidden relative">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'url(https://cdn.pixabay.com/photo/2018/05/14/16/54/cyber-3400789_1280.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(2px)'
                }}></div>
                <div className="absolute inset-0 bg-primary/60"></div>
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>{t('landing.secure.title')}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t('landing.secure.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6 bg-background overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-muted/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className={`mb-20 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
              {t('landing.builtForEveryone')}
            </h2>
            <p className="text-xl text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('landing.builtForEveryone.desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className={`p-8 bg-card rounded-lg border border-border hover:border-primary transition-all duration-700 hover:shadow-lg overflow-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
              <div className="mb-6 w-full h-40 -mx-8 -mt-8 rounded-t-lg overflow-hidden relative">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'url(https://cdn.pixabay.com/photo/2017/07/31/11/21/people-2557396_1280.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(1px)'
                }}></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-primary/80"></div>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {t('landing.features.ministry.title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t('landing.features.ministry.desc')}
              </p>
            </div>

            <div className={`p-8 bg-card rounded-lg border border-border hover:border-primary transition-all duration-700 delay-200 hover:shadow-lg overflow-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
              <div className="mb-6 w-full h-40 -mx-8 -mt-8 rounded-t-lg overflow-hidden relative">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'url(https://cdn.pixabay.com/photo/2016/11/29/03/53/architecture-1867187_1280.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(1px)'
                }}></div>
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/60 to-secondary/80"></div>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {t('landing.features.school.title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t('landing.features.school.desc')}
              </p>
            </div>

            <div className={`p-8 bg-card rounded-lg border border-border hover:border-primary transition-all duration-700 delay-500 hover:shadow-lg overflow-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
              <div className="mb-6 w-full h-40 -mx-8 -mt-8 rounded-t-lg overflow-hidden relative">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'url(https://cdn.pixabay.com/photo/2015/07/19/10/00/school-851328_1280.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(1px)'
                }}></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-secondary/80"></div>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {t('landing.features.student.title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t('landing.features.student.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-secondary"></div>
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }}></div>

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
              {t('landing.cta.title')}
            </h2>
            <p className="text-xl md:text-2xl text-primary-foreground/80 mb-12 leading-relaxed max-w-3xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('landing.cta.desc')}
            </p>
            <div className="flex flex-wrap gap-5 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-background text-primary hover:bg-primary-foreground px-12 py-7 text-lg rounded-lg shadow-2xl hover:shadow-xl transition-all hover:scale-105"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
              >
                {t('landing.cta.trial')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-card text-muted-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-muted"></div>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <img src="/logo.png" alt="Native OS" className="w-10 h-10" />
                <span className="text-xl font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>Native OS</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t('landing.footer.modern')}
              </p>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4 text-sm uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t('landing.footer.product')}</h4>
              <ul className="space-y-3 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">{t('landing.footer.features')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">{t('landing.footer.pricing')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">{t('landing.footer.security')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4 text-sm uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t('landing.footer.support')}</h4>
              <ul className="space-y-3 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">{t('landing.footer.documentation')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">{t('landing.footer.helpCenter')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">{t('landing.footer.contact')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4 text-sm uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t('landing.footer.contactInfo')}</h4>
              <ul className="space-y-3 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                <li>{t('landing.footer.email')}</li>
                <li>{t('landing.footer.location')}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8">
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{t('landing.footer.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
