
import { useState } from "react";
import {
  LayoutDashboard,
  ListOrdered,
  Ticket,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
};

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "My Queues", icon: ListOrdered },
  { name: "Tokens", icon: Ticket },
  { name: "Analytics", icon: ChartNoAxesCombined },
  { name: "Settings", icon: Settings },
];

function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="rounded-xl bg-indigo-600 p-2 text-white">
            <Layers size={22} />
          </div>

          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                QueueFlow
              </h1>
              <p className="text-[10px] tracking-widest text-slate-400">
                MANAGER PORTAL
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.name;

          return (
            <button
              key={item.name}
              type="button"
              title={collapsed ? item.name : undefined}
              onClick={() => onNavigate(item.name)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="space-y-3 border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-slate-100"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={20} />
          ) : (
            <>
              <ChevronLeft size={20} />
              Collapse
            </>
          )}
        </button>

        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
            M
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">
                Manager
              </p>
              <p className="text-xs text-slate-400">
                Administrator
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onNavigate("Logout")}
          title={collapsed ? "Logout" : undefined}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50"
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

