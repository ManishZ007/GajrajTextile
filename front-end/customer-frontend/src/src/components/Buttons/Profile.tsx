'use client';

import { useSession } from 'next-auth/react';
import { UserCircle, LogIn, User } from 'lucide-react';

type ProfileButtonProps = {
  onToggleProfile: () => void;
};

export const ProfileButton = ({
  onToggleProfile,
}: ProfileButtonProps): React.JSX.Element => {
  const { data: session, status } = useSession();

  const isLoggedIn = status === 'authenticated' && !!session;

  // Extract first letter of user name for avatar initial (if name exists)
  const initial = session?.user?.name?.charAt(0)?.toUpperCase() ?? null;

  return (
    // hidden on mobile, visible on desktop only
    <div className="hidden md:flex items-center justify-center">
      <button
        onClick={onToggleProfile}
        aria-label={isLoggedIn ? 'Open profile menu' : 'Go to login'}
        className="flex items-center justify-center cursor-pointer transition duration-300"
      >
        {isLoggedIn && initial ? (
          // Logged in + name — show initial avatar
          <span
            className="w-7 h-7 rounded-full text-[11px] font-medium flex items-center justify-center select-none"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-accent-text)",
            }}
          >
            {initial}
          </span>
        ) : isLoggedIn ? (
          // Logged in, no name — show user circle icon
          <UserCircle
            strokeWidth={1.5}
            className="w-5 h-5 transition duration-300"
            style={{ color: "var(--color-text)" }}
          />
        ) : (
          // Guest — show user icon
          <User
            strokeWidth={1.5}
            className="w-5 h-5 transition duration-300"
            style={{ color: "var(--color-text-muted)" }}
          />
        )}
      </button>
    </div>
  );
};
