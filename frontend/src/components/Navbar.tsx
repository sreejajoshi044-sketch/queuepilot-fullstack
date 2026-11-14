
import { useState } from "react";
import { Bell, Search, CalendarDays, Menu } from "lucide-react";

type NavbarProps = {
  activePage: string;
  onMenuClick?: () => void;
};

function Navbar({ activePage, onMenuClick }: NavbarProps) {
  const [search, setSearch] = useState("");

  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">

        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {activePage}
            </h2>
            <p className="text-xs text-slate-500">
              Welcome back, Manager
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-wrap items-center gap-4">

          {/* Search */}
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 md:flex">
            <Search size={18} className="text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search queues..."
              aria-label="Search queues"
              className="w-40 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Date */}
          <div className="hidden items-center gap-2 text-sm text-slate-500 xl:flex">
            <CalendarDays size={18} />
            <span>{today}</span>
          </div>

          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <Bell size={21} />
          </button>

          {/* Profile */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              M
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">
                Manager
              </p>
              <p className="text-xs text-slate-400">
                Administrator
              </p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}

export default Navbar;
