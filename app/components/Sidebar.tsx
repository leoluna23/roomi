"use client";
import Link from "next/link";
import { useAuth } from "../auth/context";

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <aside className="w-52 bg-white border-r border-gray-200 flex flex-col p-4">
      <Link href="/" className="text-3xl font-extrabold mb-8 hover:opacity-80 transition-opacity tracking-tight" style={{ color: '#B22222', letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(178, 34, 34, 0.1)' }}>
        ROOMI
      </Link>
      <nav className="flex-1 space-y-2">
        <Link
          href="/"
          className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
          style={{ backgroundColor: '#B22222' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
        >
          Dashboard
        </Link>
        <Link
          href="/match"
          className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
          style={{ backgroundColor: '#B22222' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
        >
          Find Matches
        </Link>
        <Link
          href="/groups"
          className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
          style={{ backgroundColor: '#B22222' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
        >
          Groups
        </Link>
        <Link
          href="/schedule"
          className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
          style={{ backgroundColor: '#B22222' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
        >
          Tasks & Schedule
        </Link>
        <Link
          href="/bills"
          className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
          style={{ backgroundColor: '#B22222' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
        >
          Bills
        </Link>
        <Link
          href="/profile"
          className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
          style={{ backgroundColor: '#B22222' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
        >
          Profile
        </Link>
        <Link
          href="/mediate"
          className="block w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg text-left"
          style={{ backgroundColor: '#B22222' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
        >
          Mediator
        </Link>
      </nav>
      {user && (
        <div className="mt-auto pt-4 border-t border-gray-200 space-y-2">
          <div className="text-xs text-gray-600 px-4 truncate">{user.email}</div>
          <button
            onClick={signOut}
            className="w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md hover:shadow-lg"
            style={{ backgroundColor: '#B22222' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991919'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B22222'}
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}

