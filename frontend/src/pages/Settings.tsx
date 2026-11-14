
import { useState } from "react";
import {
  UserRound,
  ShieldCheck,
  LogOut,
  Save,
  Settings2,
} from "lucide-react";

type SettingsProps = {
  onLogout: () => void;
};

type Manager = {
  name?: string;
  email?: string;
};

function Settings({ onLogout }: SettingsProps) {
  const [manager] = useState<Manager>(() => {
    try {
      const stored = sessionStorage.getItem("queueflow_manager");
      return stored ? (JSON.parse(stored) as Manager) : {};
    } catch {
      return {};
    }
  });

  const [displayName, setDisplayName] = useState(
    () =>
      localStorage.getItem("queueflow_display_name") ??
      manager.name ??
      ""
  );

  const [message, setMessage] = useState("");

  const savePreferences = () => {
    localStorage.setItem(
      "queueflow_display_name",
      displayName.trim()
    );
    setMessage("Preferences saved successfully.");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Settings
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your account and application preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <UserRound size={24} className="text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Manager Account
          </h2>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <p>
            <span className="font-semibold">Name: </span>
            {manager.name || "Manager"}
          </p>
          <p>
            <span className="font-semibold">Email: </span>
            {manager.email || "Not available"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Settings2 size={22} className="text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Display Preferences
          </h2>
        </div>

        <label
          htmlFor="displayName"
          className="mt-5 block text-sm font-medium text-slate-700"
        >
          Preferred Display Name
        </label>

        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={60}
          className="mt-2 w-full max-w-md rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
        />

        <button
          type="button"
          onClick={savePreferences}
          className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Save size={17} />
          Save Preferences
        </button>

        {message && (
          <p role="status" className="mt-3 text-sm text-emerald-700">
            {message}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} className="text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Security
          </h2>
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Sign out of your QueueFlow manager account.
        </p>

        <button
          type="button"
          onClick={onLogout}
          className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );
}

export default Settings;
