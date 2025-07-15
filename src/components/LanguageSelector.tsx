import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={currentLanguage === 'fr' ? 'default' : 'outline'}
        size="sm"
        onClick={() => changeLanguage('fr')}
      >
        FR
      </Button>
      <Button
        variant={currentLanguage === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => changeLanguage('en')}
      >
        EN
      </Button>
    </div>
  );
};

export default LanguageSelector;
