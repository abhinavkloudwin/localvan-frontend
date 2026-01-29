"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { apiClient } from "@/lib/api-client";
import { logout, checkAdminRole } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Menu, Plus, Edit2, Trash2, Eye } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function BlogManagementContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [statistics, setStatistics] = useState({
    total_blogs: 0,
    published_blogs: 0,
    draft_blogs: 0,
    archived_blogs: 0,
  });

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [processingBlog, setProcessingBlog] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    status: "draft",
    custom_slug: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          router.push("/unauthorized");
          return;
        }

        const userData = await apiClient.getProfile();

        if (!checkAdminRole(userData)) {
          router.push("/unauthorized");
          return;
        }

        setUser(userData);
        await Promise.all([fetchBlogs(), fetchStatistics()]);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/unauthorized");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchBlogs = async () => {
    try {
      const response = await apiClient.getAllBlogs(
        0,
        100,
        statusFilter || undefined,
        searchTerm || undefined
      );
      if (response && response.data) {
        setBlogs(response.data);
        setTotalBlogs(response.total || response.data.length);
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      setError("Failed to load blogs");
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await apiClient.getBlogStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBlogs();
    }
  }, [statusFilter, searchTerm]);

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      status: "draft",
      custom_slug: "",
    });
    setSelectedBlog(null);
  };

  const handleCreateBlog = async () => {
    if (!formData.title || !formData.content) {
      setError("Title and content are required");
      return;
    }

    setProcessingBlog(true);
    setError("");

    try {
      await apiClient.createBlog({
        title: formData.title,
        content: formData.content,
        status: formData.status,
        custom_slug: formData.custom_slug || undefined,
      });

      setSuccess("Blog created successfully");
      setIsCreateModalOpen(false);
      resetForm();
      await Promise.all([fetchBlogs(), fetchStatistics()]);
    } catch (err: any) {
      setError(err.message || "Failed to create blog");
    } finally {
      setProcessingBlog(false);
    }
  };

  const handleEditBlog = async () => {
    if (!selectedBlog) return;

    setProcessingBlog(true);
    setError("");

    try {
      const updateData: any = {};
      if (formData.title) updateData.title = formData.title;
      if (formData.content) updateData.content = formData.content;
      if (formData.status) updateData.status = formData.status;
      if (formData.custom_slug) updateData.custom_slug = formData.custom_slug;

      await apiClient.updateBlog(selectedBlog.id, updateData);

      setSuccess("Blog updated successfully");
      setIsEditModalOpen(false);
      resetForm();
      await fetchBlogs();
    } catch (err: any) {
      setError(err.message || "Failed to update blog");
    } finally {
      setProcessingBlog(false);
    }
  };

  const handleUpdateStatus = async (blog: Blog, newStatus: string) => {
    try {
      await apiClient.updateBlogStatus(blog.id, newStatus);
      setSuccess(`Blog status updated to ${newStatus}`);
      await Promise.all([fetchBlogs(), fetchStatistics()]);
    } catch (err: any) {
      setError(err.message || "Failed to update blog status");
    }
  };

  const handleDeleteBlog = async (blog: Blog) => {
    if (!confirm(`Are you sure you want to delete blog "${blog.title}"?`))
      return;

    try {
      await apiClient.deleteBlog(blog.id);
      setSuccess("Blog deleted successfully");
      await Promise.all([fetchBlogs(), fetchStatistics()]);
    } catch (err: any) {
      setError(err.message || "Failed to delete blog");
    }
  };

  const openEditModal = (blog: Blog) => {
    setSelectedBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      status: blog.status,
      custom_slug: blog.slug,
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (blog: Blog) => {
    setSelectedBlog(blog);
    setIsViewModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={logout}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 z-30">
            <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Menu size={24} />
                  </button>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
            <TableSkeleton rows={8} />
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 z-30">
          <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu size={24} />
                </button>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Blog Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Create and manage blog posts
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => setError("")}
                className="text-red-800 underline text-sm mt-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">{success}</p>
              <button
                onClick={() => setSuccess("")}
                className="text-green-800 underline text-sm mt-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">Total Blogs</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.total_blogs}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">Published</p>
              <p className="text-2xl font-bold text-green-600">
                {statistics.published_blogs}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">Drafts</p>
              <p className="text-2xl font-bold text-yellow-600">
                {statistics.draft_blogs}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">Archived</p>
              <p className="text-2xl font-bold text-gray-600">
                {statistics.archived_blogs}
              </p>
            </div>
          </div>

          {/* Filters and Create Button */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} />
              Create Blog
            </Button>
          </div>

          {/* Blogs Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title / Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Published At
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <p className="text-gray-500">No blogs found</p>
                      </td>
                    </tr>
                  ) : (
                    blogs.map((blog) => (
                      <tr key={blog.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="text-sm font-bold text-gray-900">
                              {blog.title}
                            </div>
                            <div className="text-sm text-gray-500">{blog.slug}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={blog.status}
                            onChange={(e) => handleUpdateStatus(blog, e.target.value)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${
                              blog.status === "published"
                                ? "bg-green-100 text-green-800"
                                : blog.status === "draft"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {blog.published_at
                              ? new Date(blog.published_at).toLocaleDateString()
                              : "Not published"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openViewModal(blog)}
                              className="text-gray-600 hover:text-gray-900"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => openEditModal(blog)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteBlog(blog)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Create Blog Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            resetForm();
            setError("");
          }}
          title="Create New Blog"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter blog title"
            />

            <div>
              <label className="block text-base font-bold mb-2 text-black">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={8}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Write your blog content here..."
              />
            </div>

            <Input
              label="Custom Slug (Optional)"
              value={formData.custom_slug}
              onChange={(e) =>
                setFormData({ ...formData, custom_slug: e.target.value })
              }
              placeholder="auto-generated-from-title"
            />

            <div>
              <label className="block text-base font-bold mb-2 text-black">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                  setError("");
                }}
                disabled={processingBlog}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleCreateBlog}
                disabled={processingBlog}
              >
                {processingBlog ? "Creating..." : "Create Blog"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Blog Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            resetForm();
            setError("");
          }}
          title="Edit Blog"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />

            <div>
              <label className="block text-base font-bold mb-2 text-black">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={8}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>

            <Input
              label="Slug"
              value={formData.custom_slug}
              onChange={(e) =>
                setFormData({ ...formData, custom_slug: e.target.value })
              }
            />

            <div>
              <label className="block text-base font-bold mb-2 text-black">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetForm();
                  setError("");
                }}
                disabled={processingBlog}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleEditBlog}
                disabled={processingBlog}
              >
                {processingBlog ? "Updating..." : "Update Blog"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* View Blog Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedBlog(null);
          }}
          title="View Blog"
          size="lg"
        >
          {selectedBlog && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedBlog.title}
                </h3>
                <p className="text-sm text-gray-500">Slug: {selectedBlog.slug}</p>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedBlog.content}
                </p>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold capitalize">
                    {selectedBlog.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Published:</span>
                  <span>
                    {selectedBlog.published_at
                      ? new Date(selectedBlog.published_at).toLocaleDateString()
                      : "Not published"}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default function BlogManagement() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <BlogManagementContent />
    </Suspense>
  );
}
