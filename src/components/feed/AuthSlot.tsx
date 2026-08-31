import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function AuthSlot({
  clipId,
  onOpen,
}: {
  clipId?: string;
  onOpen?: () => void;
}) {
  const { user, isPending } = useCurrentUserState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isPending) {
    return (
      <div className="tap dock-item text-muted">
        <span className="size-7 rounded-full bg-fg/15" />
        <span className="t-dock">You</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        to="/login"
        search={{ c: clipId }}
        className="tap dock-item text-muted"
      >
        <User className="size-6" />
        <span className="t-dock">You</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onOpen} className="tap dock-item text-fg">
      {user.profileImageUrl ? (
        <img
          src={user.profileImageUrl}
          alt=""
          className="size-7 rounded-full object-cover ring-1 ring-fg/40"
        />
      ) : (
        <span className="grid size-7 place-items-center rounded-full bg-nob t-chip text-ink">
          {(user.displayName ?? "N").charAt(0).toUpperCase()}
        </span>
      )}
      <span className="t-dock">You</span>
    </button>
  );
}
