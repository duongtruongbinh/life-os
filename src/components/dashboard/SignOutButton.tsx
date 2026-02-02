"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = React.ComponentProps<typeof Button>;

/** Signs out via Supabase and redirects to /. */
export function SignOutButton({ className, ...props }: SignOutButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      className={className}
      {...props}
    >
      Sign out
    </Button>
  );
}
