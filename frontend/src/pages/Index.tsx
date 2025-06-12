
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Test users
  const testUsers = {
    "admin@yosacco.com": { password: "admin123", role: "admin", name: "Admin User" },
    "member@yosacco.com": { password: "member123", role: "member", name: "John Doe" }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const user = testUsers[email as keyof typeof testUsers];
      
      if (user && user.password === password) {
        // Store user info in localStorage (temporary solution)
        localStorage.setItem("currentUser", JSON.stringify({
          email,
          role: user.role,
          name: user.name
        }));

        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.name}!`,
        });

        // Navigate to appropriate dashboard
        if (user.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/member-dashboard");
        }
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">YO Sacco</h1>
          <p className="text-muted-foreground">Manage your savings and loans</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
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
            </form>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Test Accounts:</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-muted p-2 rounded">
                  <p><strong>Admin:</strong> admin@yosacco.com</p>
                  <p><strong>Password:</strong> admin123</p>
                </div>
                <div className="bg-muted p-2 rounded">
                  <p><strong>Member:</strong> member@yosacco.com</p>
                  <p><strong>Password:</strong> member123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
