import { Button } from "@/components/ui/button";
import { Sparkles, Brain, TrendingUp } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Education Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Transform Education
            </span>
            <br />
            <span className="text-foreground">with AI Intelligence</span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            NATIVE OS personalizes learning, automates workflows, and provides real-time insights 
            for teachers, students, and parents. Built for the future of education.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button variant="hero" size="lg" className="text-lg px-8 py-6">
              Get Started Free
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 max-w-3xl mx-auto">
            <div className="p-6 rounded-xl bg-card shadow-md border border-border">
              <Brain className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-foreground mb-1">AI-Driven</div>
              <div className="text-sm text-muted-foreground">Personalized Learning</div>
            </div>
            <div className="p-6 rounded-xl bg-card shadow-md border border-border">
              <TrendingUp className="w-8 h-8 text-accent mx-auto mb-3" />
              <div className="text-3xl font-bold text-foreground mb-1">Real-Time</div>
              <div className="text-sm text-muted-foreground">Analytics & Insights</div>
            </div>
            <div className="p-6 rounded-xl bg-card shadow-md border border-border">
              <Sparkles className="w-8 h-8 text-secondary mx-auto mb-3" />
              <div className="text-3xl font-bold text-foreground mb-1">Automated</div>
              <div className="text-sm text-muted-foreground">Workflows & Grading</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
