"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-9 min-h-11 touch-manipulation px-3 text-muted-foreground md:h-8 md:min-h-0"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.refresh();
        router.push("/");
      }}
    >
      {"\ub85c\uadf8\uc544\uc6c3"}
    </Button>
  );
}
