import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, Heart, ChefHat } from 'lucide-react';

export function ProblemSection() {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: Sparkles,
      title: t('problem.point1'),
      description: t('problem.point1.desc'),
    },
    {
      icon: Heart,
      title: t('problem.point2'),
      description: t('problem.point2.desc'),
    },
    {
      icon: ChefHat,
      title: t('problem.point3'),
      description: t('problem.point3.desc'),
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-[#088395]/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t('problem.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('problem.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-card p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-border animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#088395] to-[#00D9A3] rounded-full flex items-center justify-center mb-6">
                <benefit.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
