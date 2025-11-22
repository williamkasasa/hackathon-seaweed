import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingBag, MessageSquare, Sparkles } from 'lucide-react';

export function HowItWorksSection() {
  const { t } = useLanguage();

  const steps = [
    {
      icon: ShoppingBag,
      step: 1,
      key: 'step1',
    },
    {
      icon: MessageSquare,
      step: 2,
      key: 'step2',
    },
    {
      icon: Sparkles,
      step: 3,
      key: 'step3',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-[#088395]/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t('howItWorks.title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className="relative animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="bg-card p-8 rounded-xl shadow-lg text-center border border-border">
                <div className="w-20 h-20 bg-gradient-to-br from-[#088395] to-[#00D9A3] rounded-full flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-4xl font-bold text-[#088395] mb-4">
                  {step.step}
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                  {t(`howItWorks.${step.key}`)}
                </h3>
                <p className="text-muted-foreground">
                  {t(`howItWorks.${step.key}.desc`)}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#088395] to-[#00D9A3] transform -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
