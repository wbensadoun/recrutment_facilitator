import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import MainNavbar from "@/components/MainNavbar";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
          <p className="text-xl text-gray-700 mb-6">Page Not Found</p>
          <p className="text-gray-600 mb-8">The page you are looking for doesn't exist or has been moved.</p>
          
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <a href="/">Return to Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
