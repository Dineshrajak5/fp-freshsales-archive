import Link from "next/link";
import { SignOutButton } from "./sign-out-button";
import { GlobalSearch } from "./global-search";

export function AppHeader() {
  return (
    <header className="bg-white border-b sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link href="/" className="font-semibold text-gray-900 text-sm whitespace-nowrap">
          FP Archive
        </Link>
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          <Link href="/colleges" className="text-gray-600 hover:text-gray-900">
            Colleges
          </Link>
          <Link href="/contacts" className="text-gray-600 hover:text-gray-900">
            Contacts
          </Link>
          <Link href="/deals" className="text-gray-600 hover:text-gray-900">
            Deals
          </Link>
        </nav>
        <GlobalSearch />
        <SignOutButton />
      </div>
    </header>
  );
}