import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import { login } from "../services/api.js";

function Signin({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    const data = await login(form);
    setLoading(false);

    if(!data.success) {
      toast.error(data.message);
      return;
    }

    toast.success(data.message);
    onLogin({ token: data.token, user: data.user });
  }

  return (
    <main className="auth-simple-screen">
      <Card className="auth-simple-card">
        <CardHeader>
          <p className="wordmark">EmpowHer</p>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your email and password to return to your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="form-stack" onSubmit={submit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
            </div>
            <Button disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
          </form>
          <p className="auth-link">New here? <Link to="/signup">Create an account</Link></p>
        </CardContent>
      </Card>
    </main>
  );
}

export default Signin;
