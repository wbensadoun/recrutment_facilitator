import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Accès non autorisé</h2>
        <p className="text-gray-600 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline"
            className="w-full sm:w-auto"
          >
            Retour
          </Button>
          <Button 
            onClick={() => navigate('/')} 
            className="w-full sm:w-auto"
          >
            Page d'accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
