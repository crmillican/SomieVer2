import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Logo } from "@/components/ui/logo";
import { ShieldCheck } from "lucide-react";

/**
 * Admin Entry Component
 * 
 * This component serves as a landing page for the admin section.
 * It provides a clean, clear way for admin users to access the admin login page.
 */
export function AdminEntry() {
  const [_, navigate] = useLocation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col items-center text-center mb-6">
            <Logo size="lg" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">SOMIE Admin Portal</h1>
            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <ShieldCheck className="h-4 w-4 mr-1" />
              <span>Secure administrative access</span>
            </div>
          </div>
          
          <div className="space-y-4 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              This area is restricted to authorized SOMIE team members only. 
              Please log in to access the administration panel.
            </p>
            
            <div className="pt-4">
              <Button 
                onClick={() => navigate('/admin/login')}
                className="w-full py-6 text-base font-medium"
              >
                <ShieldCheck className="mr-2 h-5 w-5" />
                Access Admin Login
              </Button>
            </div>
            
            <div className="pt-2">
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="mt-4 w-full"
              >
                Return to Main Site
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}