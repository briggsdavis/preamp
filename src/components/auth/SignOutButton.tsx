import { useAuthActions } from "@convex-dev/auth/react";

import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const { signOut } = useAuthActions();
  return (
    <Button variant="ghost" onClick={() => void signOut()}>
      Sign out
    </Button>
  );
}
