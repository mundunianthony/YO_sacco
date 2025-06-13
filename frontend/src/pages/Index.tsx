import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting login...');
      const response = await api.post('/auth/login', {
        email,
        password
      });
      console.log('Login response:', response.data);

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      // Store token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(user));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.firstName}!`,
      });

      // Navigate to appropriate dashboard
      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/member-dashboard");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.response?.data?.error || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to YO SACCO</CardTitle>
          <CardDescription>
            Please sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
                  Register here
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
