import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AdminLoginData = {
  username: string;
  password: string;
};

export default function AdminLogin() {
  const { loginMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [loginError, setLoginError] = useState<string | null>(null);

  const loginForm = useForm<AdminLoginData>({
    resolver: zodResolver(
      insertUserSchema.pick({ username: true, password: true })
    ),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const handleAdminLogin = (data: AdminLoginData) => {
    setLoginError(null);
    
    loginMutation.mutate(data, {
      onSuccess: (userData) => {
        if (userData.role === "admin" || userData.role === "super_admin") {
          // Store role info in localStorage
          localStorage.setItem('somie_user_role', userData.role);
          console.log(`Admin login successful with role: ${userData.role}`);
          
          // Redirect to admin dashboard
          setLocation("/admin/dashboard");
          
          // Double-check navigation success after a delay
          setTimeout(() => {
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/admin/')) {
              console.warn('Admin redirect failed, trying direct navigation');
              window.location.href = "/admin/dashboard";
            }
          }, 300);
        } else {
          console.error("User doesn't have admin privileges");
          setLoginError("You don't have administrator privileges");
          
          // Log out the user since they don't have correct privileges
          setTimeout(() => {
            loginMutation.reset();
            setLocation("/");
          }, 2000);
        }
      },
      onError: (error) => {
        console.error("Admin login failed:", error);
        setLoginError(error.message || "Authentication failed");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1">
          <div className="w-full flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl text-center">Admin Access</CardTitle>
          <CardDescription className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>Secure Administrator Portal</span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          
          <Form {...loginForm}>
            <form
              onSubmit={loginForm.handleSubmit(handleAdminLogin)}
              className="space-y-4"
            >
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Username</FormLabel>
                    <FormControl>
                      <Input className="h-11" placeholder="Enter admin username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Password</FormLabel>
                    <FormControl>
                      <Input className="h-11" type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 mt-6 font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Secure Login
              </Button>
              
              <div className="text-center mt-4">
                <Button 
                  variant="link" 
                  onClick={() => setLocation('/')}
                  type="button"
                >
                  Return to Main Site
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}