import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Phone, Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gradient-to-b from-[#088395] to-[#076d7e] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">{t('footer.about')}</h3>
            <p className="text-white/80">{t('footer.aboutText')}</p>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-4">{t('footer.contact')}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@algamar.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+34 986 85 75 85</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-4">{t('footer.follow')}</h3>
            <div className="flex gap-4">
              <a href="#" className="hover:text-[#00D9A3] transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-[#00D9A3] transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-[#00D9A3] transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-8 text-center text-white/80">
          <p>© 2024 Algamar. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
