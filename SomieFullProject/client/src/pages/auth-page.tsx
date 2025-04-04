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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Building2, Users, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useEffect, useState } from "react";

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  userType: 'business' | 'influencer';
};

interface LoginFormProps {
  onSubmit: (data: LoginData) => void;
  isPending: boolean;
}

// Separate component for the login form to avoid conditional hooks
function LoginForm({ onSubmit, isPending }: LoginFormProps) {
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(
      insertUserSchema.pick({ username: true, password: true })
    ),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  return (
    <Form {...loginForm}>
      <form
        onSubmit={loginForm.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={loginForm.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input className="h-11" placeholder="Enter your username" {...field} />
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
              <FormLabel>Password</FormLabel>
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
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Sign In
        </Button>
      </form>
    </Form>
  );
}

interface RegisterFormProps {
  onSubmit: (data: RegisterData) => void;
  isPending: boolean;
  initialUserType: 'business' | 'influencer';
}

// Separate component for the register form to avoid conditional hooks
function RegisterForm({ onSubmit, isPending, initialUserType }: RegisterFormProps) {
  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      userType: initialUserType || 'business',
    }
  });

  return (
    <Form {...registerForm}>
      <form
        onSubmit={registerForm.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={registerForm.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Choose a Username</FormLabel>
              <FormControl>
                <Input className="h-11" placeholder="Enter a unique username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={registerForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Create Password</FormLabel>
              <FormControl>
                <Input className="h-11" type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={registerForm.control}
          name="userType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>I am a...</FormLabel>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <Button
                  type="button"
                  variant={field.value === "business" ? "default" : "outline"}
                  className={`h-auto py-3 px-4 flex flex-col items-center justify-center gap-2 ${
                    field.value === "business" ? "ring-1 ring-primary/20" : ""
                  }`}
                  onClick={() => field.onChange("business")}
                >
                  <Building2 className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Business/Brand</span>
                </Button>
                
                <Button
                  type="button"
                  variant={field.value === "influencer" ? "default" : "outline"}
                  className={`h-auto py-3 px-4 flex flex-col items-center justify-center gap-2 ${
                    field.value === "influencer" ? "ring-1 ring-primary/20" : ""
                  }`}
                  onClick={() => field.onChange("influencer")}
                >
                  <Users className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Content Creator</span>
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full h-11 mt-6 font-medium"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Create Account
        </Button>
      </form>
    </Form>
  );
}

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  
  // Parse URL parameters for mode and user type
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const type = urlParams.get('type');
  
  // Set initial tab based on URL parameters
  useEffect(() => {
    if (mode === 'register') {
      setActiveTab('register');
    } else {
      setActiveTab('login');
    }
  }, [mode]);

  // Extract redirect logic to avoid conditional effects
  const getRedirectPath = (user: any, urlParams: URLSearchParams) => {
    if (!user) return null;
    
    // Check for redirect parameter in URL
    const redirectParam = urlParams.get('redirect');
    let redirectPath;
    
    if (redirectParam) {
      // Decode the redirect URL
      try {
        redirectPath = decodeURIComponent(redirectParam);
        console.log(`Auth page: Redirecting to original destination: ${redirectPath}`);
      } catch (e) {
        console.error("Failed to decode redirect URL:", e);
        // Fall back to dashboard if decoding fails
        redirectPath = user.userType === "business" ? "/business-dashboard" : "/influencer-dashboard";
      }
    } else {
      // If no redirect specified, go to appropriate dashboard
      redirectPath = user.userType === "business" ? "/business-dashboard" : "/influencer-dashboard";
      console.log(`Auth page: No redirect parameter, going to default dashboard: ${redirectPath}`);
    }
    
    return redirectPath;
  };
  
  // Handle redirects with improved error handling and retry logic
  useEffect(() => {
    if (user) {
      console.log("Auth page: User detected, preparing to redirect", { 
        id: user.id, 
        username: user.username, 
        userType: user.userType
      });
      
      try {
        // Store user info in localStorage as a fallback authentication mechanism
        localStorage.setItem('somie_user_id', user.id.toString());
        localStorage.setItem('somie_user_type', user.userType);
        localStorage.setItem('somie_username', user.username);
        console.log('User data stored in localStorage as authentication fallback');
        
        // Get redirect path
        const redirectPath = getRedirectPath(user, urlParams);
        console.log(`Redirecting to: ${redirectPath}`);
        
        // Use a small delay to ensure all localStorage updates finish
        setTimeout(() => {
          if (redirectPath) {
            setLocation(redirectPath);
            
            // Double-check navigation success after a small delay
            setTimeout(() => {
              const currentPath = window.location.pathname;
              console.log(`Navigation check: now at ${currentPath}, should be at ${redirectPath}`);
              
              // If we're still on the auth page after redirect attempt, try again with direct navigation
              if (currentPath.includes('auth-page')) {
                console.warn('Redirect failed, trying window.location fallback');
                window.location.href = redirectPath;
              }
            }, 300);
          }
        }, 100);
      } catch (error) {
        console.error("Error during redirect:", error);
        // Attempt fallback redirect
        setLocation(user.userType === "business" ? "/business-dashboard" : "/influencer-dashboard");
      }
    } else {
      console.log("Auth page: No user detected, staying on auth page");
    }
  }, [user, setLocation, urlParams]);

  // Form handlers
  const handleLogin = (data: LoginData) => {
    loginMutation.mutate(data, {
      onSuccess: (userData) => {
        // Store user ID and type in localStorage as fallback for auth
        try {
          localStorage.setItem('somie_user_id', userData.id.toString());
          localStorage.setItem('somie_user_type', userData.userType);
          localStorage.setItem('somie_username', userData.username);
          console.log('User data stored in localStorage as authentication fallback');
        } catch (err) {
          console.error('Failed to store user data in localStorage', err);
        }
      }
    });
  };

  const handleRegister = (data: RegisterData) => {
    registerMutation.mutate(data, {
      onSuccess: (userData) => {
        // Store user ID and type in localStorage as fallback for auth
        try {
          localStorage.setItem('somie_user_id', userData.id.toString());
          localStorage.setItem('somie_user_type', userData.userType);
          localStorage.setItem('somie_username', userData.username);
          console.log('User data stored in localStorage as authentication fallback');
        } catch (err) {
          console.error('Failed to store user data in localStorage', err);
        }
      }
    });
  };

  // Get initial user type from URL parameters
  const initialUserType = type === 'influencer' ? 'influencer' : 'business';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-xl border-0 gradient-bg">
          <CardHeader className="pb-6">
            <div className="w-full flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <CardDescription className="text-center text-muted-foreground">
              Social Media Influence Exchange
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <LoginForm 
                  onSubmit={handleLogin} 
                  isPending={loginMutation.isPending} 
                />
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <RegisterForm 
                  onSubmit={handleRegister} 
                  isPending={registerMutation.isPending}
                  initialUserType={initialUserType}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-amber-500 to-orange-600 items-center justify-center p-12 text-center lg:text-left">
        <div className="max-w-lg text-white">
          <div className="mb-10">
            <div className="logo text-5xl mb-2">SOMIE</div>
            <p className="text-xl opacity-90 font-light">Social Media Influence Exchange</p>
          </div>
          
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Connect. Create. <span className="text-amber-200">Monetize.</span>
          </h1>
          
          <div className="space-y-6">
            <p className="text-xl opacity-90 leading-relaxed">
              The comfortable platform where creators and brands build authentic partnerships that feel natural to audiences.
            </p>
            
            <div className="grid grid-cols-1 gap-6 mt-8">
              <div className="flex gap-4 items-start bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                <CheckCircle className="h-6 w-6 text-amber-200 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-lg mb-2">For Content Creators</h3>
                  <p className="text-sm opacity-90">Find opportunities that match your personal style and audience interests, creating content that feels authentic and genuine.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                <CheckCircle className="h-6 w-6 text-amber-200 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-lg mb-2">For Brands & Businesses</h3>
                  <p className="text-sm opacity-90">Connect with genuine voices that align with your values to create warm, inviting marketing that resonates with your target audience.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}