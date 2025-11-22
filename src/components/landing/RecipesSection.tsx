import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export function RecipesSection() {
  const { t } = useLanguage();

  const recipes = [
    {
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
      title: 'Wakame Seaweed Salad',
      description: 'Fresh and tangy traditional Japanese side dish',
      time: '15 min',
    },
    {
      image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80',
      title: 'Kombu Dashi Broth',
      description: 'The foundation of Japanese umami cooking',
      time: '30 min',
    },
    {
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
      title: 'Sea Vegetable Pasta',
      description: 'Mediterranean fusion with red pesto',
      time: '20 min',
    },
  ];

  return (
    <section id="recipes" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t('recipes.title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('recipes.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {recipes.map((recipe, index) => (
            <div
              key={index}
              className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all animate-fade-in border border-border"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  {recipe.time}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-2">{recipe.title}</h3>
                <p className="text-muted-foreground mb-4">{recipe.description}</p>
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-[#088395] group-hover:text-white group-hover:border-[#088395] transition-colors"
                >
                  {t('recipes.viewRecipe')}
                  <ExternalLink className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
