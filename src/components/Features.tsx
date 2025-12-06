import { Card } from "@/components/ui/card";
import { 
  BookOpen, 
  ClipboardCheck, 
  BarChart3, 
  Users, 
  Sparkles,
  Shield,
  Zap,
  Globe
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "AI Lesson Generation",
    description: "Automatically create personalized lesson plans tailored to each student's learning pace and style.",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: ClipboardCheck,
    title: "Smart Grading",
    description: "Automated grading with image recognition for tests and assignments, saving teachers hours of work.",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Comprehensive dashboards showing student progress, engagement metrics, and learning outcomes.",
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  },
  {
    icon: Users,
    title: "Multi-Role Platform",
    description: "Seamless experience for teachers, students, parents, and administrators with role-specific features.",
    color: "text-success",
    bgColor: "bg-success/10"
  },
  {
    icon: Sparkles,
    title: "Adaptive Learning",
    description: "AI adjusts content difficulty and pacing based on student performance and learning patterns.",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: Shield,
    title: "Data Privacy",
    description: "Built with Tunisian compliance standards, ensuring children's data protection and security.",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description: "Students receive immediate feedback on assignments, fostering continuous learning and improvement.",
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  },
  {
    icon: Globe,
    title: "Multilingual Support",
    description: "Full support for English, French, and Arabic with RTL layout capabilities for inclusive education.",
    color: "text-success",
    bgColor: "bg-success/10"
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-ai bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to transform your educational institution with AI-powered technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border bg-card"
            >
              <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
