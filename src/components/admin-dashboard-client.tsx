"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import ContentTab from "@/components/admin-content-tab"
import PremiumPageBackground from "@/components/premium-page-background"
import { motion } from "framer-motion"
import { ROLES, type RoleName } from "@/lib/rbac"
import { TipTapEditor } from "@/components/blog/tiptap-editor"
import BlogAnalyticsTab from "@/components/blog/blog-analytics-tab"
import { BarChart3 } from "lucide-react"
import {
  Users,
  Shield,
  UserPlus,
  Trash2,
  Edit,
  Search,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  PenSquare,
  FileText,
  Activity,
  LayoutDashboard,
  UserCheck,
  ExternalLink,
} from "lucide-react"

export interface AdminData {
  activeTab: string
  /** Highest-privilege role the viewing user has. Controls tab visibility. */
  role: RoleName
  users: Array<{
    id: string
    email: string
    name: string
    rollNumber: string
    image: string
    isActive: boolean
    roles: string[]
    createdAt: string
    hasTeamMember: boolean
    isBlogAuthor: boolean
  }>
  approvedRolls: Array<{
    id: string
    rollNumber: string
    email: string
    isUsed: boolean
    notes: string
    createdAt: string
  }>
  teamMembers: Array<{
    id: string
    name: string
    bio: string
    profileImage: string
    strengths: string[]
    displayOrder: number
    isActive: boolean
    category: string
    socialLinks: { platform: string; url: string }[]
    userEmail: string
  }>
  blogs: Array<{
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    coverImage: string
    published: boolean
    featured: boolean
    readTime: string
    viewCount: number
    publishedAt: string | null
    createdAt: string
    authorId: string
    authorName: string
    categoryId: string
    categoryName: string
    tags: string[]
  }>
  blogAuthors: Array<{
    id: string
    displayName: string
    bio: string
    avatar: string
    isApproved: boolean
    userId: string
    userEmail: string
    userName: string
  }>
  auditLogs: Array<{
    id: string
    actorId: string
    actorName: string
    action: string
    entityType: string
    entityId: string
    metadata: string
    ipAddress: string
    createdAt: string
  }>
  categories: Array<{ id: string; name: string; slug: string }>
  tags: Array<{ id: string; name: string; slug: string }>
  stats: {
    totalUsers: number
    approvedRolls: number
    unusedRolls: number
    teamMembers: number
    blogs: number
    publishedBlogs: number
    blogAuthors: number
    auditLogs: number
  }
  topBlogs: Array<{ id: string; title: string; slug: string; viewCount: number; publishedAt: string }>
  // === Dynamic content (CMS) ===
  siteSettings: Record<string, string>
  pillars: Array<{
    id: string; title: string; description: string; iconName: string
    colorFrom: string; colorTo: string; features: string[]
    displayOrder: number; isActive: boolean
  }>
  domains: Array<{
    id: string; title: string; description: string; iconName: string
    color: string; displayOrder: number; isActive: boolean
  }>
  heroStats: Array<{
    id: string; iconName: string; value: string; label: string
    description: string; gradient: string; displayOrder: number; isActive: boolean
  }>
  events: Array<{
    id: string; title: string; description: string; date: string; time: string
    location: string; type: string; status: string; image: string
    registrations: number; maxRegistrations: number; registrationUrl: string
    displayOrder: number; isActive: boolean
  }>
  missions: Array<{
    id: string; title: string; description: string; iconName: string
    displayOrder: number; isActive: boolean
  }>
  resourceRoadmaps: Array<{
    id: string; title: string; description: string; difficulty: string
    duration: string; topics: string[]; url: string
    displayOrder: number; isActive: boolean
  }>
  resourceToolkits: Array<{
    id: string; title: string; description: string; tools: string[]
    toolkitCategory: string; downloads: number
    displayOrder: number; isActive: boolean
  }>
  resourceProjects: Array<{
    id: string; title: string; description: string; tech: string[]
    author: string; stars: number; github: string
    displayOrder: number; isActive: boolean
  }>
  resourceLinkCategories: Array<{
    id: string; title: string; displayOrder: number; isActive: boolean
    links: Array<{
      id: string; title: string; description: string; url: string
      displayOrder: number; isActive: boolean
    }>
  }>
  footerSocial: Array<{
    id: string; platform: string; label: string; url: string
    iconName: string; displayOrder: number; isActive: boolean
  }>
  footerQuickLinks: Array<{
    id: string; label: string; href: string
    displayOrder: number; isActive: boolean
  }>
  footerContacts: Array<{
    id: string; label: string; value: string; iconName: string
    displayOrder: number; isActive: boolean
  }>
}

export default function AdminDashboardClient({ data }: { data: AdminData }) {
  const { toast } = useToast()
  const role: RoleName = data.role || ROLES.MEMBER

  // Tab visibility per RBAC matrix:
  //   SUPER_ADMIN  -> all tabs (members, team, blogs, authors, content, audit)
  //   ADMIN        -> team, blogs, authors, content (NO members, NO audit)
  //   BLOG_AUTHOR  -> blogs, authors only
  const visibleTabs = useMemo(() => {
    const tabs: string[] = ["blogs", "authors", "analytics"]
    if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) {
      tabs.push("team", "content")
    }
    if (role === ROLES.SUPER_ADMIN) {
      tabs.unshift("members")
      tabs.push("audit")
    }
    return tabs
  }, [role])

  // Ensure the active tab is one this role can see; otherwise fall back.
  const [tab, setTab] = useState(
    visibleTabs.includes(data.activeTab) ? data.activeTab : visibleTabs[0],
  )

  // Local state mirrors server state for snappy UI
  const [users, setUsers] = useState(data.users)
  const [approvedRolls, setApprovedRolls] = useState(data.approvedRolls)
  const [teamMembers, setTeamMembers] = useState(data.teamMembers)
  const [blogs, setBlogs] = useState(data.blogs)
  const [blogAuthors, setBlogAuthors] = useState(data.blogAuthors)
  const [auditLogs] = useState(data.auditLogs)

  const [userSearch, setUserSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.rollNumber.includes(userSearch)
    const matchesRole = roleFilter === "ALL" || u.roles.includes(roleFilter)
    return matchesSearch && matchesRole
  })

  // --- Roll number handlers ---
  const [newRoll, setNewRoll] = useState("")
  const [newRollNotes, setNewRollNotes] = useState("")
  const addRoll = async () => {
    const roll = newRoll.trim()
    if (!/^[0-9]{6}$/.test(roll)) {
      toast({ title: "Invalid roll number", description: "Must be exactly 6 digits.", variant: "destructive" })
      return
    }
    const res = await fetch("/api/admin/roll-numbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber: roll, notes: newRollNotes }),
    })
    if (!res.ok) {
      const err = await res.json()
      toast({ title: "Failed", description: err.error || "Error", variant: "destructive" })
      return
    }
    const created = await res.json()
    setApprovedRolls([created, ...approvedRolls])
    setNewRoll("")
    setNewRollNotes("")
    toast({ title: "Roll number approved", description: `${roll} can now sign in.` })
  }
  const removeRoll = async (id: string, roll: string) => {
    if (!confirm(`Revoke access for ${roll}?`)) return
    const res = await fetch(`/api/admin/roll-numbers?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      toast({ title: "Failed", variant: "destructive" })
      return
    }
    setApprovedRolls(approvedRolls.filter((r) => r.id !== id))
    toast({ title: "Access revoked", description: `${roll} can no longer sign in.` })
  }

  // --- Role handlers ---
  const assignRole = async (userId: string, role: string, add: boolean) => {
    const res = await fetch("/api/admin/roles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role, action: add ? "add" : "remove" }),
    })
    if (!res.ok) {
      toast({ title: "Failed", variant: "destructive" })
      return
    }
    const resData = await res.json()

    setUsers(
      users.map((u) =>
        u.id === userId
          ? {
              ...u,
              roles: add ? [...new Set([...u.roles, role])] : u.roles.filter((r) => r !== role),
            }
          : u,
      ),
    )

    if (role === ROLES.BLOG_AUTHOR) {
      if (add && resData.author) {
        setBlogAuthors((prev) => {
          const exists = prev.some((a) => a.id === resData.author.id || a.userId === userId)
          if (exists) {
            return prev.map((a) => (a.userId === userId ? { ...a, isApproved: true } : a))
          }
          return [resData.author, ...prev]
        })
      } else if (!add) {
        setBlogAuthors((prev) =>
          prev.map((a) => (a.userId === userId ? { ...a, isApproved: false } : a)),
        )
      }
    }

    toast({ title: add ? "Role assigned" : "Role removed", description: `${role} ${add ? "added" : "removed"}.` })
  }

  // --- Team member handlers ---
  const [editingTeam, setEditingTeam] = useState<string | null>(null)
  const [newTeamMember, setNewTeamMember] = useState({
    name: "",
    position: "",
    bio: "",
    category: "Volunteer",
  })

  const saveTeamMember = async (id: string, updates: any) => {
    const res = await fetch("/api/admin/team", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    })
    if (!res.ok) {
      toast({ title: "Failed", variant: "destructive" })
      return
    }
    setTeamMembers(teamMembers.map((m) => (m.id === id ? { ...m, ...updates } : m)))
    setEditingTeam(null)
    toast({ title: "Team member updated" })
  }
  const toggleTeamMemberActive = async (id: string, current: boolean) => {
    const res = await fetch("/api/admin/team", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !current }),
    })
    if (!res.ok) {
      toast({ title: "Failed", variant: "destructive" })
      return
    }
    setTeamMembers(teamMembers.map((m) => (m.id === id ? { ...m, isActive: !current } : m)))
    toast({ title: !current ? "Member shown" : "Member hidden" })
  }
  const moveTeamMember = async (id: string, direction: "up" | "down") => {
    const idx = teamMembers.findIndex((m) => m.id === id)
    if (idx === -1) return
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= teamMembers.length) return
    const a = teamMembers[idx]
    const b = teamMembers[swapIdx]
    await Promise.all([
      fetch("/api/admin/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, displayOrder: b.displayOrder }),
      }),
      fetch("/api/admin/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, displayOrder: a.displayOrder }),
      }),
    ])
    setTeamMembers((prev) => {
      const next = [...prev]
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }
  const deleteTeamMember = async (id: string, name: string) => {
    if (!confirm(`Delete team member ${name}? This also removes their social links.`)) return
    const res = await fetch(`/api/admin/team?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      toast({ title: "Failed", variant: "destructive" })
      return
    }
    setTeamMembers(teamMembers.filter((m) => m.id !== id))
    toast({ title: "Team member deleted" })
  }

  // --- Blog handlers ---
  const [editingBlog, setEditingBlog] = useState<string | null>(null)
  const [newBlog, setNewBlog] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    categoryId: "",
    coverImage: "",
    readTime: "5 min read",
    tags: [] as string[],
    featured: false,
  })
  const [newBlogTag, setNewBlogTag] = useState("")

  const saveBlog = async (id: string, updates: any) => {
    const res = await fetch(`/api/admin/blogs?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    })
    if (!res.ok) {
      const err = await res.json()
      toast({ title: "Failed", description: err.error, variant: "destructive" })
      return
    }
    const updated = await res.json()
    setBlogs(blogs.map((b) => (b.id === id ? { ...b, ...updated } : b)))
    setEditingBlog(null)
    toast({ title: "Blog updated" })
  }
  const createBlog = async () => {
    if (!newBlog.title.trim() || !newBlog.slug.trim() || !newBlog.excerpt.trim()) {
      toast({ title: "Missing fields", description: "Title, slug, and excerpt are required.", variant: "destructive" })
      return
    }
    const res = await fetch("/api/admin/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBlog),
    })
    if (!res.ok) {
      const err = await res.json()
      toast({ title: "Failed", description: err.error, variant: "destructive" })
      return
    }
    const created = await res.json()
    setBlogs([created, ...blogs])
    setNewBlog({ title: "", slug: "", excerpt: "", content: "", categoryId: "", coverImage: "", readTime: "5 min read", tags: [], featured: false })
    toast({ title: "Blog created" })
  }
  const toggleBlogPublish = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/blogs?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, published: !current }),
    })
    if (!res.ok) {
      toast({ title: "Failed", variant: "destructive" })
      return
    }
    setBlogs(blogs.map((b) => (b.id === id ? { ...b, published: !current } : b)))
    toast({ title: !current ? "Blog published" : "Blog unpublished" })
  }
  const deleteBlog = async (id: string, title: string) => {
    if (!confirm(`Delete blog "${title}"?`)) return
    const res = await fetch(`/api/admin/blogs?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      toast({ title: "Failed", variant: "destructive" })
      return
    }
    setBlogs(blogs.filter((b) => b.id !== id))
    toast({ title: "Blog deleted" })
  }

  // --- Blog author handlers ---
  const toggleBlogAuthorApproval = async (id: string, current: boolean) => {
    const res = await fetch("/api/admin/blog-authors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isApproved: !current }),
    })
    if (!res.ok) {
      toast({ title: "Failed", variant: "destructive" })
      return
    }

    const targetAuthor = blogAuthors.find((a) => a.id === id)
    setBlogAuthors(blogAuthors.map((a) => (a.id === id ? { ...a, isApproved: !current } : a)))

    if (targetAuthor?.userId) {
      setUsers(
        users.map((u) =>
          u.id === targetAuthor.userId
            ? {
                ...u,
                roles: !current
                  ? [...new Set([...u.roles, ROLES.BLOG_AUTHOR])]
                  : u.roles.filter((r) => r !== ROLES.BLOG_AUTHOR),
              }
            : u,
        ),
      )
    }

    toast({ title: !current ? "Author approved" : "Author revoked" })
  }

  const rejectBlogAuthorRequest = async (id: string, displayName: string) => {
    if (!confirm(`Reject author request for ${displayName}?`)) return
    const res = await fetch(`/api/admin/blog-authors?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      toast({ title: "Failed to reject request", variant: "destructive" })
      return
    }

    const targetAuthor = blogAuthors.find((a) => a.id === id)
    setBlogAuthors(blogAuthors.filter((a) => a.id !== id))

    if (targetAuthor?.userId) {
      setUsers(
        users.map((u) =>
          u.id === targetAuthor.userId
            ? { ...u, roles: u.roles.filter((r) => r !== ROLES.BLOG_AUTHOR) }
            : u,
        ),
      )
    }

    toast({ title: "Application Rejected", description: `Author request for ${displayName} was rejected.` })
  }

  // --- Upload handler ---
  const uploadFile = async (file: File, subdir: string) => {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("subdir", subdir)
    const res = await fetch("/api/uploads", { method: "POST", body: fd })
    if (!res.ok) throw new Error("Upload failed")
    return (await res.json()).url as string
  }

  const slugify = (text: string) =>
    text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "")

  return (
    <main className="min-h-screen relative">
      <PremiumPageBackground />
      <Navigation />

      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="font-heading font-bold text-4xl sm:text-5xl">
                <span className="gradient-text-premium">Super Admin Dashboard</span>
              </h1>
              <p className="text-gray-400 mt-2">Manage members, team, blogs, and access control.</p>
            </div>
            <Link href="/dashboard/member">
              <Button variant="outline" className="glass border-white/10 text-gray-200 hover:bg-white/5 btn-premium">
                <UserCheck className="mr-2 h-4 w-4" />
                My Profile
              </Button>
            </Link>
          </div>

          {/* Stats overview - premium analytics cards */}
          {role !== ROLES.BLOG_AUTHOR && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
              {[
                { label: "Users", value: data.stats.totalUsers, icon: Users, color: "#4A90E2", gradient: "from-blue-500 to-blue-600" },
                { label: "Approved Rolls", value: data.stats.approvedRolls, icon: Shield, color: "#50C878", gradient: "from-emerald-500 to-emerald-600" },
                { label: "Team Members", value: data.stats.teamMembers, icon: UserPlus, color: "#FF6B6B", gradient: "from-pink-500 to-pink-600" },
                { label: "Blogs", value: data.stats.blogs, icon: FileText, color: "#FFB84D", gradient: "from-amber-500 to-amber-600" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="glass-strong border-white/10 relative overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                          <stat.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-xs uppercase tracking-wider">{stat.label}</p>
                          <p className="text-white text-2xl font-bold">{stat.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="bg-[#1A1F2E] border border-white/10 grid grid-cols-2 md:grid-cols-6 h-auto p-1">
              {visibleTabs.includes("members") && (
                <TabsTrigger value="members" className="data-[state=active]:bg-[#4A90E2] data-[state=active]:text-white text-[#B0B0B0]">
                  <Users className="h-4 w-4 mr-2" /> Members
                </TabsTrigger>
              )}
              {visibleTabs.includes("team") && (
                <TabsTrigger value="team" className="data-[state=active]:bg-[#4A90E2] data-[state=active]:text-white text-[#B0B0B0]">
                  <UserPlus className="h-4 w-4 mr-2" /> Team
                </TabsTrigger>
              )}
              {visibleTabs.includes("blogs") && (
                <TabsTrigger value="blogs" className="data-[state=active]:bg-[#4A90E2] data-[state=active]:text-white text-[#B0B0B0]">
                  <FileText className="h-4 w-4 mr-2" /> Blogs
                </TabsTrigger>
              )}
              {visibleTabs.includes("authors") && (
                <TabsTrigger value="authors" className="data-[state=active]:bg-[#4A90E2] data-[state=active]:text-white text-[#B0B0B0]">
                  <PenSquare className="h-4 w-4 mr-2" /> Authors
                </TabsTrigger>
              )}
              {visibleTabs.includes("analytics") && (
                <TabsTrigger value="analytics" className="data-[state=active]:bg-[#4A90E2] data-[state=active]:text-white text-[#B0B0B0]">
                  <BarChart3 className="h-4 w-4 mr-2" /> Analytics
                </TabsTrigger>
              )}
              {visibleTabs.includes("content") && (
                <TabsTrigger value="content" className="data-[state=active]:bg-[#4A90E2] data-[state=active]:text-white text-[#B0B0B0]">
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Content
                </TabsTrigger>
              )}
              {visibleTabs.includes("audit") && (
                <TabsTrigger value="audit" className="data-[state=active]:bg-[#4A90E2] data-[state=active]:text-white text-[#B0B0B0]">
                  <Activity className="h-4 w-4 mr-2" /> Audit
                </TabsTrigger>
              )}
            </TabsList>

            {/* ============= MEMBERS TAB ============= */}
            <TabsContent value="members" className="space-y-6 mt-6">
              {/* Approved roll numbers */}
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#50C878]" /> Approved Roll Numbers
                  </CardTitle>
                  <CardDescription className="text-[#B0B0B0]">
                    Only students whose roll number is in this list can sign in.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      value={newRoll}
                      onChange={(e) => setNewRoll(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                      placeholder="123456"
                      className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]"
                    />
                    <Input
                      value={newRollNotes}
                      onChange={(e) => setNewRollNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]"
                    />
                    <Button onClick={addRoll} className="bg-[#50C878] hover:bg-[#5DD988]">
                      <Plus className="h-4 w-4 mr-2" /> Add Roll
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {approvedRolls.length === 0 && (
                      <p className="text-[#B0B0B0] text-sm text-center py-4">No approved roll numbers yet.</p>
                    )}
                    {approvedRolls.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1A1F2E]/50 border border-white/5">
                        <div>
                          <span className="text-[#E0E0E0] font-mono">{r.rollNumber}</span>
                          <span className="text-[#B0B0B0] text-sm ml-2">@student.nitandhra.ac.in</span>
                          {r.notes && <p className="text-[#B0B0B0] text-xs mt-1">{r.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {r.isUsed ? (
                            <Badge className="bg-[#50C878]/20 text-[#50C878] border-[#50C878]/30">Used</Badge>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeRoll(r.id, r.rollNumber)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* User list */}
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#4A90E2]" /> Registered Users
                  </CardTitle>
                  <CardDescription className="text-[#B0B0B0]">
                    Assign roles, manage permissions. Filter and search to find members.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B0B0B0]" />
                      <Input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by name, email, or roll number..."
                        className="pl-10 bg-[#1A1F2E] border-white/10 text-[#E0E0E0]"
                      />
                    </div>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-3 py-2 bg-[#1A1F2E] border border-white/10 rounded-lg text-[#E0E0E0]"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                      <option value="BLOG_AUTHOR">Blog Author</option>
                    </select>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {filteredUsers.length === 0 && (
                      <p className="text-[#B0B0B0] text-sm text-center py-4">No users found.</p>
                    )}
                    {filteredUsers.map((u) => (
                      <div key={u.id} className="p-3 rounded-lg bg-[#1A1F2E]/50 border border-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[#E0E0E0] font-medium truncate">{u.name || "(no name)"}</p>
                            <p className="text-[#B0B0B0] text-sm truncate">{u.email}</p>
                            {u.rollNumber && (
                              <p className="text-[#B0B0B0] text-xs mt-1">Roll: {u.rollNumber}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {(["SUPER_ADMIN", "ADMIN", "BLOG_AUTHOR", "MEMBER"] as const).map((role) => {
                              const has = u.roles.includes(role)
                              return (
                                <button
                                  key={role}
                                  onClick={() => assignRole(u.id, role, !has)}
                                  className={`px-2 py-1 rounded text-xs border transition-colors ${
                                    has
                                      ? "bg-[#4A90E2]/20 text-[#4A90E2] border-[#4A90E2]/40"
                                      : "bg-transparent text-[#B0B0B0] border-white/10 hover:border-white/30"
                                  }`}
                                >
                                  {has ? "✓" : "+"} {role.replace("_", " ")}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============= TEAM TAB ============= */}
            <TabsContent value="team" className="space-y-6 mt-6">
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-[#4A90E2]" /> Team Members
                  </CardTitle>
                  <CardDescription className="text-[#B0B0B0]">
                    {teamMembers.length} members. Toggle visibility, reorder, edit details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
                    {teamMembers.map((m, idx) => (
                      <div key={m.id} className="p-3 rounded-lg bg-[#1A1F2E]/50 border border-white/5">
                        {editingTeam === m.id ? (
                          <TeamMemberEditor
                            member={m}
                            categories={["Secretary", "Joint Secretary", "Executive Member", "Volunteer"]}
                            onSave={(updates) => saveTeamMember(m.id, updates)}
                            onCancel={() => setEditingTeam(null)}
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <button
                                onClick={() => moveTeamMember(m.id, "up")}
                                disabled={idx === 0}
                                className="text-[#B0B0B0] hover:text-[#4A90E2] disabled:opacity-30"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => moveTeamMember(m.id, "down")}
                                disabled={idx === teamMembers.length - 1}
                                className="text-[#B0B0B0] hover:text-[#4A90E2] disabled:opacity-30"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                            </div>
                            {m.profileImage && (
                               
                              <img src={m.profileImage} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[#E0E0E0] font-medium truncate">{m.name}</p>
                              <p className="text-[#B0B0B0] text-sm truncate">{m.category}</p>
                            </div>
                            <Badge className="bg-[#1A1F2E] text-[#B0B0B0] border-white/10">#{m.displayOrder}</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleTeamMemberActive(m.id, m.isActive)}
                              className={m.isActive ? "text-[#50C878]" : "text-[#B0B0B0]"}
                            >
                              {m.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingTeam(m.id)}
                              className="text-[#4A90E2] hover:bg-[#4A90E2]/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTeamMember(m.id, m.name)}
                              className="text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============= BLOGS TAB ============= */}
            <TabsContent value="blogs" className="space-y-6 mt-6">
              {/* Create new blog */}
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="h-5 w-5 text-[#50C878]" /> Create New Blog Post
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[#E0E0E0] text-sm">Title</Label>
                      <Input
                        value={newBlog.title}
                        onChange={(e) => {
                          setNewBlog({ ...newBlog, title: e.target.value, slug: slugify(e.target.value) })
                        }}
                        className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#E0E0E0] text-sm">Slug</Label>
                      <Input
                        value={newBlog.slug}
                        onChange={(e) => setNewBlog({ ...newBlog, slug: e.target.value })}
                        className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[#E0E0E0] text-sm">Excerpt</Label>
                    <Input
                      value={newBlog.excerpt}
                      onChange={(e) => setNewBlog({ ...newBlog, excerpt: e.target.value })}
                      className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]"
                    />
                  </div>
                  <div>
                    <Label className="text-[#E0E0E0] text-sm">Content</Label>
                    <TipTapEditor
                      content={newBlog.content}
                      onChange={(html) => setNewBlog({ ...newBlog, content: html })}
                      placeholder="Start writing your story..."
                      className="bg-[#0B1120]"
                      onImageUpload={async (file) => uploadFile(file, "blog")}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-[#E0E0E0] text-sm">Category</Label>
                      <select
                        value={newBlog.categoryId}
                        onChange={(e) => setNewBlog({ ...newBlog, categoryId: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1A1F2E] border border-white/10 rounded-lg text-[#E0E0E0]"
                      >
                        <option value="">— Select —</option>
                        {data.categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-[#E0E0E0] text-sm">Read Time</Label>
                      <Input
                        value={newBlog.readTime}
                        onChange={(e) => setNewBlog({ ...newBlog, readTime: e.target.value })}
                        className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#E0E0E0] text-sm">Cover Image</Label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const url = await uploadFile(file, "blog")
                            setNewBlog({ ...newBlog, coverImage: url })
                            toast({ title: "Cover image uploaded" })
                          } catch {
                            toast({ title: "Upload failed", variant: "destructive" })
                          }
                        }}
                        className="block w-full text-sm text-[#B0B0B0] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#4A90E2] file:text-white file:cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[#E0E0E0] text-sm">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newBlogTag}
                        onChange={(e) => setNewBlogTag(e.target.value)}
                        placeholder="Type tag name and press Enter"
                        className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            const t = newBlogTag.trim()
                            if (t && !newBlog.tags.includes(t)) {
                              setNewBlog({ ...newBlog, tags: [...newBlog.tags, t] })
                              setNewBlogTag("")
                            }
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        className="border-[#4A90E2]/30 text-[#4A90E2]"
                        onClick={() => {
                          const t = newBlogTag.trim()
                          if (t && !newBlog.tags.includes(t)) {
                            setNewBlog({ ...newBlog, tags: [...newBlog.tags, t] })
                            setNewBlogTag("")
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newBlog.tags.map((t) => (
                        <Badge key={t} className="bg-[#4A90E2]/20 text-[#4A90E2] border-[#4A90E2]/30">
                          {t} <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setNewBlog({ ...newBlog, tags: newBlog.tags.filter((x) => x !== t) })} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-[#E0E0E0] text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newBlog.featured}
                        onChange={(e) => setNewBlog({ ...newBlog, featured: e.target.checked })}
                        className="accent-[#4A90E2]"
                      />
                      Featured post
                    </label>
                    <Button onClick={createBlog} className="bg-[#50C878] hover:bg-[#5DD988]">
                      <Plus className="h-4 w-4 mr-2" /> Create Draft
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Blog list */}
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#4A90E2]" /> All Blog Posts
                  </CardTitle>
                  <CardDescription className="text-[#B0B0B0]">
                    {data.stats.publishedBlogs} published / {data.stats.blogs} total.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
                    {blogs.map((b) => (
                      <div key={b.id} className="p-3 rounded-lg bg-[#1A1F2E]/50 border border-white/5">
                        {editingBlog === b.id ? (
                          <BlogEditor
                            blog={b}
                            categories={data.categories}
                            tags={data.tags}
                            onSave={(updates) => saveBlog(b.id, updates)}
                            onCancel={() => setEditingBlog(null)}
                            onUpload={uploadFile}
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            {b.coverImage && (
                               
                              <img src={b.coverImage} alt={b.title} className="w-12 h-12 rounded object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[#E0E0E0] font-medium truncate">{b.title}</p>
                              <p className="text-[#B0B0B0] text-sm truncate">
                                {b.authorName} · {b.categoryName} · {b.viewCount} views
                              </p>
                            </div>
                            {b.featured && <Badge className="bg-[#50C878]/20 text-[#50C878] border-[#50C878]/30">Featured</Badge>}
                            <Badge
                              className={
                                b.published
                                  ? "bg-[#50C878]/20 text-[#50C878] border-[#50C878]/30"
                                  : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              }
                            >
                              {b.published ? "Published" : "Draft"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleBlogPublish(b.id, b.published)}
                              className="text-[#4A90E2] hover:bg-[#4A90E2]/10"
                              title={b.published ? "Unpublish" : "Publish"}
                            >
                              {b.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingBlog(b.id)}
                              className="text-[#4A90E2] hover:bg-[#4A90E2]/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteBlog(b.id, b.title)}
                              className="text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============= AUTHORS TAB ============= */}
            <TabsContent value="authors" className="space-y-6 mt-6">
              {/* Section 1: Pending Applications */}
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PenSquare className="h-5 w-5 text-yellow-400" /> Pending Author Requests
                  </CardTitle>
                  <CardDescription className="text-[#B0B0B0]">
                    Review member applications requesting permission to write and publish blog articles.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {blogAuthors.filter((a) => !a.isApproved).length === 0 ? (
                      <p className="text-[#B0B0B0] text-sm text-center py-4">No pending author applications.</p>
                    ) : (
                      blogAuthors
                        .filter((a) => !a.isApproved)
                        .map((a) => (
                          <div key={a.id} className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {a.avatar ? (
                                <img src={a.avatar} alt={a.displayName} className="w-10 h-10 rounded-full object-cover ring-2 ring-yellow-500/30" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-300 font-bold flex items-center justify-center">
                                  {a.displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="text-white font-semibold flex items-center gap-2">
                                  {a.displayName}
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                    Pending Review
                                  </Badge>
                                </p>
                                <p className="text-gray-400 text-xs">{a.userEmail || "No linked email"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4"
                                onClick={() => toggleBlogAuthorApproval(a.id, false)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-medium px-4"
                                onClick={() => rejectBlogAuthorRequest(a.id, a.displayName)}
                              >
                                <Trash2 className="h-4 w-4 mr-1.5" /> Reject
                              </Button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Approved Blog Authors */}
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-[#50C878]" /> Approved Blog Authors
                  </CardTitle>
                  <CardDescription className="text-[#B0B0B0]">
                    Members authorized to write articles. To grant author access to a user directly, assign the BLOG_AUTHOR role in the Members tab.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
                    {blogAuthors.filter((a) => a.isApproved).length === 0 ? (
                      <p className="text-[#B0B0B0] text-sm text-center py-4">No approved blog authors yet.</p>
                    ) : (
                      blogAuthors
                        .filter((a) => a.isApproved)
                        .map((a) => (
                          <div key={a.id} className="p-3 rounded-lg bg-[#1A1F2E]/50 border border-white/5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {a.avatar ? (
                                <img src={a.avatar} alt={a.displayName} className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center">
                                  {a.displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-[#E0E0E0] font-medium truncate">{a.displayName}</p>
                                <p className="text-[#B0B0B0] text-xs truncate">{a.userEmail || "(no linked user)"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className="bg-[#50C878]/20 text-[#50C878] border-[#50C878]/30">
                                Approved Author
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleBlogAuthorApproval(a.id, true)}
                                className="text-red-400 hover:bg-red-500/10 text-xs"
                                title="Revoke Author Privileges"
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Revoke
                              </Button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============= CONTENT TAB ============= */}
            <TabsContent value="content" className="space-y-6 mt-6">
              <ContentTab
                siteSettings={data.siteSettings}
                pillars={data.pillars}
                domains={data.domains}
                heroStats={data.heroStats}
                events={data.events}
                missions={data.missions}
                resourceRoadmaps={data.resourceRoadmaps}
                resourceToolkits={data.resourceToolkits}
                resourceProjects={data.resourceProjects}
                resourceLinkCategories={data.resourceLinkCategories}
                footerSocial={data.footerSocial}
                footerQuickLinks={data.footerQuickLinks}
                footerContacts={data.footerContacts}
              />
            </TabsContent>

            {/* ============= AUDIT TAB ============= */}
            <TabsContent value="audit" className="space-y-6 mt-6">
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#FF6B6B]" /> Audit Logs
                  </CardTitle>
                  <CardDescription className="text-[#B0B0B0]">
                    Last {auditLogs.length} actions across the system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[600px] overflow-y-auto space-y-1 pr-2">
                    {auditLogs.length === 0 && (
                      <p className="text-[#B0B0B0] text-sm text-center py-4">No audit logs yet.</p>
                    )}
                    {auditLogs.map((l) => (
                      <div key={l.id} className="p-2 rounded text-sm bg-[#1A1F2E]/30 border border-white/5 flex items-start gap-3">
                        <Badge variant="outline" className="border-white/10 text-[#B0B0B0] font-mono text-[10px]">
                          {l.action}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#E0E0E0] text-xs">
                            <span className="font-medium">{l.actorName}</span> · {l.entityType}
                            {l.entityId && <span className="text-[#B0B0B0]"> · {l.entityId.slice(-8)}</span>}
                          </p>
                          {l.metadata && (
                            <p className="text-[#B0B0B0] text-xs font-mono break-all">{l.metadata.slice(0, 200)}</p>
                          )}
                          <p className="text-[#B0B0B0] text-[10px] mt-1">
                            {new Date(l.createdAt).toLocaleString()}
                            {l.ipAddress && ` · ${l.ipAddress}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Analytics */}
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-[#4A90E2]" /> Analytics
                  </CardTitle>
                  <CardDescription className="text-[#B0B0B0]">Top viewed blog posts.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.topBlogs.length === 0 && (
                      <p className="text-[#B0B0B0] text-sm text-center py-4">No published blogs yet.</p>
                    )}
                    {data.topBlogs.map((b, idx) => (
                      <div key={b.id} className="flex items-center gap-3 p-2 rounded bg-[#1A1F2E]/30">
                        <span className="text-[#4A90E2] font-bold text-lg w-6">#{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#E0E0E0] text-sm truncate">{b.title}</p>
                          <p className="text-[#B0B0B0] text-xs">{b.viewCount} views</p>
                        </div>
                        <Link href={`/blog/${b.slug}`} target="_blank">
                          <Button size="sm" variant="ghost" className="text-[#4A90E2]">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* ============= ANALYTICS TAB ============= */}
            <TabsContent value="analytics" className="space-y-6 mt-6">
              <BlogAnalyticsTab />
            </TabsContent>

          </Tabs>
        </div>
      </section>

      <Footer />
    </main>
  )
}

// ============= Inline editors =============

function TeamMemberEditor({
  member,
  categories,
  onSave,
  onCancel,
}: {
  member: AdminData["teamMembers"][0]
  categories: string[]
  onSave: (updates: any) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(member.name)
  const [bio, setBio] = useState(member.bio)
  const [category, setCategory] = useState(member.category)
  const [displayOrder, setDisplayOrder] = useState(member.displayOrder)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]" />
        <Input
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
          placeholder="Display Order"
          className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]"
        />
      </div>
      <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" rows={3} className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]" />
      <div className="grid grid-cols-1 gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 bg-[#1A1F2E] border border-white/10 rounded-lg text-[#E0E0E0]">
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave({ name, bio, category, displayOrder })} className="bg-[#50C878] hover:bg-[#5DD988]">
          Save
        </Button>
        <Button onClick={onCancel} variant="outline" className="border-white/10 text-[#B0B0B0]">
          Cancel
        </Button>
      </div>
    </div>
  )
}

function BlogEditor({
  blog,
  categories,
  tags,
  onSave,
  onCancel,
  onUpload,
}: {
  blog: AdminData["blogs"][0]
  categories: AdminData["categories"]
  tags: AdminData["tags"]
  onSave: (updates: any) => void
  onCancel: () => void
  onUpload: (file: File, subdir: string) => Promise<string>
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState(blog.title)
  const [slug, setSlug] = useState(blog.slug)
  const [excerpt, setExcerpt] = useState(blog.excerpt)
  const [content, setContent] = useState(blog.content)
  const [categoryId, setCategoryId] = useState(blog.categoryId)
  const [coverImage, setCoverImage] = useState(blog.coverImage)
  const [readTime, setReadTime] = useState(blog.readTime)
  const [featured, setFeatured] = useState(blog.featured)
  const [selectedTags, setSelectedTags] = useState<string[]>(blog.tags)
  const [newTag, setNewTag] = useState("")

  return (
    <div className="space-y-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]" />
      <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug" className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]" />
      <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Excerpt" className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]" />
      <TipTapEditor
        content={content}
        onChange={setContent}
        placeholder="Start writing your story..."
        className="bg-[#0B1120]"
        onImageUpload={async (file) => onUpload(file, "blog")}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="px-3 py-2 bg-[#1A1F2E] border border-white/10 rounded-lg text-[#E0E0E0]">
          <option value="">— Category —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <Input value={readTime} onChange={(e) => setReadTime(e.target.value)} placeholder="Read Time" className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]" />
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            try {
              const url = await onUpload(file, "blog")
              setCoverImage(url)
              toast({ title: "Cover image uploaded" })
            } catch {
              toast({ title: "Upload failed", variant: "destructive" })
            }
          }}
          className="block w-full text-sm text-[#B0B0B0] file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#4A90E2] file:text-white file:cursor-pointer"
        />
      </div>
      <div>
        <Label className="text-[#E0E0E0] text-sm mb-2 block">Tags</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Type tag name and press Enter"
            className="bg-[#1A1F2E] border-white/10 text-[#E0E0E0]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                const t = newTag.trim()
                if (t && !selectedTags.includes(t)) {
                  setSelectedTags([...selectedTags, t])
                  setNewTag("")
                }
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="border-[#4A90E2]/30 text-[#4A90E2]"
            onClick={() => {
              const t = newTag.trim()
              if (t && !selectedTags.includes(t)) {
                setSelectedTags([...selectedTags, t])
                setNewTag("")
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => {
            const sel = selectedTags.includes(t.name)
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTags(sel ? selectedTags.filter((x) => x !== t.name) : [...selectedTags, t.name])}
                className={`px-2 py-1 rounded text-xs border ${
                  sel
                    ? "bg-[#4A90E2]/20 text-[#4A90E2] border-[#4A90E2]/40"
                    : "bg-transparent text-[#B0B0B0] border-white/10"
                }`}
              >
                {t.name}
              </button>
            )
          })}
          {selectedTags.filter((t) => !tags.some((db) => db.name === t)).map((t) => (
            <span key={t} className="px-2 py-1 rounded text-xs bg-[#50C878]/20 text-[#50C878] border border-[#50C878]/40">
              {t} <X className="h-3 w-3 ml-1 inline cursor-pointer" onClick={() => setSelectedTags(selectedTags.filter((x) => x !== t))} />
            </span>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-[#E0E0E0] text-sm cursor-pointer">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-[#4A90E2]" />
        Featured
      </label>
      <div className="flex gap-2">
        <Button onClick={() => onSave({ title, slug, excerpt, content, categoryId, coverImage, readTime, featured, tags: selectedTags })} className="bg-[#50C878] hover:bg-[#5DD988]">
          Save
        </Button>
        <Button onClick={onCancel} variant="outline" className="border-white/10 text-[#B0B0B0]">
          Cancel
        </Button>
      </div>
    </div>
  )
}
