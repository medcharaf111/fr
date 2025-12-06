import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Settings,
  ArrowRight 
} from "lucide-react";

const roles = [
  {
    icon: GraduationCap,
    title: "For Teachers",
    description: "Create AI-powered lessons, automate grading, and track student progress in real-time.",
    features: [
      "AI lesson plan generator",
      "Automated grading system",
      "Student analytics dashboard",
      "Resource library"
    ],
    color: "primary",
    gradient: "from-primary to-primary-glow"
  },
  {
    icon: BookOpen,
    title: "For Students",
    description: "Personalized learning paths, instant feedback, and progress tracking to excel academically.",
    features: [
      "Adaptive learning content",
      "Interactive assignments",
      "Progress portfolio",
      "Real-time feedback"
    ],
    color: "accent",
    gradient: "from-accent to-accent/80"
  },
  {
    icon: Users,
    title: "For Parents",
    description: "Stay informed about your child's progress with detailed analytics and communication tools.",
    features: [
      "Student progress tracking",
      "Teacher communication",
      "Assignment notifications",
      "Performance insights"
    ],
    color: "secondary",
    gradient: "from-secondary to-secondary/80"
  },
  {
    icon: Settings,
    title: "For Administrators",
    description: "Manage your institution with comprehensive tools for oversight and decision-making.",
    features: [
      "Multi-tenant management",
      "Analytics & reporting",
      "User administration",
      "System configuration"
    ],
    color: "success",
    gradient: "from-success to-success/80"
  }
];

const RolePreviews = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Built for Everyone in Education
          </h2>
          <p className="text-xl text-muted-foreground">
            Tailored experiences for teachers, students, parents, and administrators
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {roles.map((role, index) => (
            <Card 
              key={index}
              className="p-8 hover:shadow-xl transition-all duration-300 border-border bg-gradient-card group"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                <role.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-card-foreground">
                {role.title}
              </h3>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {role.description}
              </p>

              <ul className="space-y-3 mb-6">
                {role.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${role.color}`}></div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant="ghost" className="w-full group-hover:bg-accent/10">
                Learn More
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RolePreviews;
