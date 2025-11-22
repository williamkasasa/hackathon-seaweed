import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Bone, Zap, Activity } from 'lucide-react';

export function BenefitsSection() {
  const { t } = useLanguage();

  const benefits = [
    { icon: Shield, key: 'thyroid' },
    { icon: Bone, key: 'bones' },
    { icon: Zap, key: 'immunity' },
    { icon: Activity, key: 'digestion' },
  ];

  return (
    <section id="benefits" className="py-20 bg-gradient-to-b from-[#088395]/5 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t('benefits.title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('benefits.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.key}
              className="bg-card p-6 rounded-lg border border-border hover:border-[#088395] transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#088395] to-[#00D9A3] rounded-lg flex items-center justify-center mb-4">
                <benefit.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t(`benefit.${benefit.key}`)}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t(`benefit.${benefit.key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
