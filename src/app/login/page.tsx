"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

import { Suspense } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Get redirect destination from query param (set by middleware)
  const redirectTo = searchParams.get("next") || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    router.refresh();
    router.push(redirectTo);
    setLoading(false);
  }

  return (
    <Card
      className="w-full max-w-sm glass border-accent-gradient animate-in fade-in-0 zoom-in-95 duration-500"
      style={{ animationFillMode: 'backwards', animationDelay: '100ms' }}
    >
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-6 icon-hover-scale" />
        </div>
        <CardTitle className="text-xl font-bold text-gradient-cosmic">
          Welcome to Life OS
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to continue your journey
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="transition-spring focus-ring-animated"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="transition-spring focus-ring-animated"
          />
          {message && (
            <p className="text-destructive text-sm animate-in fade-in-0 slide-in-from-top-1">{message}</p>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full transition-spring hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-muted-foreground text-center text-sm">
          <Link href="/" className="underline transition-colors hover:text-foreground">
            Back to home
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
      {/* Cosmic gradient background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, oklch(0.25 0.12 280 / 0.5) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, oklch(0.2 0.15 200 / 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, oklch(0.15 0.08 320 / 0.3) 0%, transparent 70%),
            var(--background)
          `
        }}
      />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

