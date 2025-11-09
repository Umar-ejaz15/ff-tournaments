"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { CheckSquare, Square, Plus, Edit, Trash2, Calendar, User, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdBy: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
}

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useSWR<Task[]>("/api/admin/tasks", fetcher, {
    refreshInterval: 2000,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: "",
    dueDate: "",
  });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const url = "/api/admin/tasks";
      const method = editingTask ? "PUT" : "POST";
      const body = editingTask
        ? { id: editingTask.id, ...form }
        : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());
      mutate("/api/admin/tasks");
      setShowModal(false);
      setEditingTask(null);
      setForm({ title: "", description: "", priority: "medium", assignedTo: "", dueDate: "" });
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      mutate("/api/admin/tasks");
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch("/api/admin/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      mutate("/api/admin/tasks");
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "high":
        return "text-red-400 bg-red-500/20 border-red-500/50";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/50";
      case "low":
        return "text-blue-400 bg-blue-500/20 border-blue-500/50";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/50";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-400" />;
      case "pending":
        return <Square className="w-4 h-4 text-gray-400" />;
      default:
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-yellow-400 flex items-center gap-3">
            <CheckSquare className="w-8 h-8" />
            Task Management
          </h1>
          <button
            onClick={() => {
              setEditingTask(null);
              setForm({ title: "", description: "", priority: "medium", assignedTo: "", dueDate: "" });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() =>
                      handleStatusChange(
                        task.id,
                        task.status === "completed" ? "pending" : "completed"
                      )
                    }
                    className="mt-1"
                  >
                    {task.status === "completed" ? (
                      <CheckSquare className="w-5 h-5 text-green-400" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 hover:text-green-400" />
                    )}
                  </button>
                  <h3
                    className={`font-semibold text-lg ${
                      task.status === "completed" ? "line-through text-gray-500" : "text-white"
                    }`}
                  >
                    {task.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingTask(task);
                      setForm({
                        title: task.title,
                        description: task.description || "",
                        priority: task.priority,
                        assignedTo: task.assignedTo || "",
                        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
                      });
                      setShowModal(true);
                    }}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                  >
                    <Edit className="w-4 h-4 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-gray-400 mb-3">{task.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {getStatusIcon(task.status)}
                  <span className="text-gray-400 capitalize">{task.status.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                </div>
                {task.dueDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
                {task.assignee && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <User className="w-4 h-4" />
                    {task.assignee.name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
            <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
            <p className="text-gray-400 text-lg mb-2">No tasks yet</p>
            <p className="text-gray-500 text-sm">Create your first task to get started</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">
              {editingTask ? "Edit Task" : "New Task"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select
                    value={editingTask?.status || "pending"}
                    onChange={(e) =>
                      editingTask && handleStatusChange(editingTask.id, e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
                    disabled={!editingTask}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {busy ? "Saving..." : editingTask ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTask(null);
                    setForm({ title: "", description: "", priority: "medium", assignedTo: "", dueDate: "" });
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

