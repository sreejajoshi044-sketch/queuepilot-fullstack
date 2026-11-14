
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { X, Plus, ListOrdered } from "lucide-react";

type CreateQueueModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void | Promise<void>;
};

function CreateQueueModal({
  isOpen,
  onClose,
  onCreate,
}: CreateQueueModalProps) {
  const [queueName, setQueueName] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQueueName("");
      setError("");
      setIsCreating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isCreating) return;

    const name = queueName.trim();

    if (!name) {
      setError("Queue name is required.");
      return;
    }

    if (name.length < 3) {
      setError(
        "Queue name must contain at least 3 characters."
      );
      return;
    }

    if (name.length > 60) {
      setError(
        "Queue name cannot exceed 60 characters."
      );
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      // Wait for the PostgreSQL API operation.
      await onCreate(name);

      // Do not close here.
      // Queues.tsx closes the modal only on success.
    } catch (err) {
      console.error("Create queue error:", err);
      setError(
        "Unable to create queue. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-queue-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-3">
              <ListOrdered
                size={23}
                className="text-indigo-600"
              />
            </div>

            <div>
              <h2
                id="create-queue-title"
                className="text-xl font-bold text-slate-900"
              >
                Create New Queue
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add a new service queue.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isCreating}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-6"
        >
          <label
            htmlFor="queueName"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Queue Name
          </label>

          <input
            id="queueName"
            type="text"
            value={queueName}
            maxLength={60}
            disabled={isCreating}
            onChange={(e) => {
              setQueueName(e.target.value);
              setError("");
            }}
            placeholder="e.g. Customer Support"
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? "queue-name-error" : undefined
            }
            autoFocus
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
          />

          {/* Validation or API Error */}
          {error && (
            <p
              id="queue-name-error"
              role="alert"
              className="mt-2 text-sm text-red-500"
            >
              {error}
            </p>
          )}

          {/* Footer Buttons */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={18} />
              {isCreating
                ? "Creating..."
                : "Create Queue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateQueueModal;
