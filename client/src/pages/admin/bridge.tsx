import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash2, Plus, Star, Zap, MessageSquare, GitBranch,
  CheckCircle, Clock, XCircle, Loader2, ArrowUpCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Proposal {
  id: string;
  title: string;
  description: string;
  submittedBy: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface Review {
  id: string;
  comment: string;
  rating: number;
  reviewer: string;
  createdAt: string;
}

interface FeatureRequest {
  id: string;
  title: string;
  details: string;
  requestedBy: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in-progress" | "done";
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAdminHeaders() {
  const pwd = sessionStorage.getItem("adminPassword");
  return { "x-admin-password": pwd || "" };
}

const statusColors: Record<string, string> = {
  pending:     "bg-yellow-900/30 text-yellow-400 border-yellow-700",
  accepted:    "bg-green-900/30 text-green-400 border-green-700",
  rejected:    "bg-red-900/30 text-red-400 border-red-700",
  open:        "bg-blue-900/30 text-blue-400 border-blue-700",
  "in-progress": "bg-purple-900/30 text-purple-400 border-purple-700",
  done:        "bg-green-900/30 text-green-400 border-green-700",
};

const priorityColors: Record<string, string> = {
  low:    "bg-zinc-800 text-zinc-400 border-zinc-700",
  medium: "bg-yellow-900/30 text-yellow-400 border-yellow-700",
  high:   "bg-red-900/30 text-red-400 border-red-700",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"}`}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BridgePage() {
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Proposal form
  const [proposalForm, setProposalForm] = useState({ title: "", description: "", submittedBy: "Admin" });
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);

  // Review form
  const [reviewForm, setReviewForm] = useState({ comment: "", rating: "5", reviewer: "" });
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // Feature form
  const [featureForm, setFeatureForm] = useState({ title: "", details: "", requestedBy: "", priority: "medium" });
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);

  const notify = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: proposals = [], isLoading: loadingProposals } = useQuery<Proposal[]>({
    queryKey: ["/api/admin/bridge/proposals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/bridge/proposals", undefined, getAdminHeaders());
      return res.json();
    },
  });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery<Review[]>({
    queryKey: ["/api/admin/bridge/reviews"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/bridge/reviews", undefined, getAdminHeaders());
      return res.json();
    },
  });

  const { data: features = [], isLoading: loadingFeatures } = useQuery<FeatureRequest[]>({
    queryKey: ["/api/admin/bridge/features"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/bridge/features", undefined, getAdminHeaders());
      return res.json();
    },
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createProposalMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/bridge/proposals", data, getAdminHeaders());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bridge/proposals"] });
      setProposalForm({ title: "", description: "", submittedBy: "Admin" });
      setProposalDialogOpen(false);
      notify("success", "Proposal submitted!");
    },
    onError: () => notify("error", "Failed to submit proposal"),
  });

  const updateProposalStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/bridge/proposals/${id}`, { status }, getAdminHeaders());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bridge/proposals"] });
      notify("success", "Status updated");
    },
  });

  const deleteProposalMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/bridge/proposals/${id}`, undefined, getAdminHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bridge/proposals"] });
      notify("success", "Proposal deleted");
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/bridge/reviews", data, getAdminHeaders());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bridge/reviews"] });
      setReviewForm({ comment: "", rating: "5", reviewer: "" });
      setReviewDialogOpen(false);
      notify("success", "Review submitted!");
    },
    onError: () => notify("error", "Failed to submit review"),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/bridge/reviews/${id}`, undefined, getAdminHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bridge/reviews"] });
      notify("success", "Review deleted");
    },
  });

  const createFeatureMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/bridge/features", data, getAdminHeaders());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bridge/features"] });
      setFeatureForm({ title: "", details: "", requestedBy: "", priority: "medium" });
      setFeatureDialogOpen(false);
      notify("success", "Feature request submitted!");
    },
    onError: () => notify("error", "Failed to submit feature request"),
  });

  const updateFeatureStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/bridge/features/${id}`, { status }, getAdminHeaders());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bridge/features"] });
      notify("success", "Status updated");
    },
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/bridge/features/${id}`, undefined, getAdminHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bridge/features"] });
      notify("success", "Feature request deleted");
    },
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 border
          ${notification.type === "success"
            ? "bg-green-900/90 border-green-700 text-green-200"
            : "bg-red-900/90 border-red-700 text-red-200"}`}>
          {notification.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 via-zinc-900/80 to-blue-900/20 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.15),transparent_60%)]" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <GitBranch className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Bridge</h2>
            <p className="text-zinc-400 mt-1">
              A channel between admins and users — protocol proposals, reviews, and feature requests.
            </p>
          </div>
          <div className="ml-auto flex gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{proposals.length}</div>
              <div className="text-xs text-zinc-500">Proposals</div>
            </div>
            <div className="w-px bg-zinc-700" />
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{reviews.length}</div>
              <div className="text-xs text-zinc-500">Reviews</div>
            </div>
            <div className="w-px bg-zinc-700" />
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{features.length}</div>
              <div className="text-xs text-zinc-500">Requests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="proposals" className="w-full">
        <TabsList className="bg-zinc-900/80 border border-zinc-800 mb-6">
          <TabsTrigger value="proposals" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-2">
            <Zap className="w-4 h-4" /> Protocol Upgrades
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white gap-2">
            <Star className="w-4 h-4" /> Reviews
          </TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
            <MessageSquare className="w-4 h-4" /> Feature Requests
          </TabsTrigger>
        </TabsList>

        {/* ── PROPOSALS TAB ───────────────────────────────────────────────── */}
        <TabsContent value="proposals">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Protocol Upgrade Proposals</h3>
              <p className="text-sm text-zinc-500">Proposed changes to the Ascension Protocol system.</p>
            </div>
            <Dialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                  <Plus className="w-4 h-4" /> New Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-400" /> Submit Protocol Upgrade
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-zinc-300 mb-1 block">Title *</Label>
                    <Input
                      placeholder="e.g. Add XP Decay System"
                      value={proposalForm.title}
                      onChange={e => setProposalForm(f => ({ ...f, title: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-300 mb-1 block">Description *</Label>
                    <Textarea
                      placeholder="Describe the proposed change in detail..."
                      value={proposalForm.description}
                      onChange={e => setProposalForm(f => ({ ...f, description: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-300 mb-1 block">Submitted By</Label>
                    <Input
                      placeholder="Admin name"
                      value={proposalForm.submittedBy}
                      onChange={e => setProposalForm(f => ({ ...f, submittedBy: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <Button
                    onClick={() => createProposalMutation.mutate(proposalForm)}
                    disabled={createProposalMutation.isPending || !proposalForm.title || !proposalForm.description}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {createProposalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit Proposal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingProposals ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
          ) : proposals.length === 0 ? (
            <EmptyState icon={<Zap className="w-10 h-10 text-purple-400/40" />} label="No proposals yet. Be the first to submit a protocol upgrade!" />
          ) : (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-zinc-900">
                    <TableHead className="text-zinc-400">Title</TableHead>
                    <TableHead className="text-zinc-400">Description</TableHead>
                    <TableHead className="text-zinc-400">By</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Date</TableHead>
                    <TableHead className="text-right text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map(p => (
                    <TableRow key={p.id} className="border-zinc-800 hover:bg-zinc-800/40">
                      <TableCell className="font-medium text-white max-w-[160px]">
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="truncate">{p.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 max-w-[260px]">
                        <span className="line-clamp-2 text-sm">{p.description}</span>
                      </TableCell>
                      <TableCell className="text-zinc-300 text-sm">{p.submittedBy}</TableCell>
                      <TableCell>
                        <Select
                          value={p.status}
                          onValueChange={val => updateProposalStatusMutation.mutate({ id: p.id, status: val })}
                        >
                          <SelectTrigger className={`w-32 h-7 text-xs border ${statusColors[p.status] || "bg-zinc-800"}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-zinc-500 text-xs">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => deleteProposalMutation.mutate(p.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── REVIEWS TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="reviews">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Protocol Reviews</h3>
              <p className="text-sm text-zinc-500">User and admin feedback on the Ascension Protocol.</p>
            </div>
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-yellow-600 hover:bg-yellow-700 gap-2">
                  <Star className="w-4 h-4" /> Share Review
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" /> Share Your Review
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-zinc-300 mb-1 block">Rating</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setReviewForm(f => ({ ...f, rating: String(n) }))}
                          className="p-1 transition-transform hover:scale-125"
                        >
                          <Star className={`w-6 h-6 transition-colors ${n <= Number(reviewForm.rating) ? "text-yellow-400 fill-yellow-400" : "text-zinc-600"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-zinc-300 mb-1 block">Comment *</Label>
                    <Textarea
                      placeholder="Share your experience with the protocol..."
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-300 mb-1 block">Reviewer Name</Label>
                    <Input
                      placeholder="Your name (optional)"
                      value={reviewForm.reviewer}
                      onChange={e => setReviewForm(f => ({ ...f, reviewer: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <Button
                    onClick={() => createReviewMutation.mutate({ ...reviewForm, rating: Number(reviewForm.rating) })}
                    disabled={createReviewMutation.isPending || !reviewForm.comment}
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                  >
                    {createReviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit Review
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-yellow-500" /></div>
          ) : reviews.length === 0 ? (
            <EmptyState icon={<Star className="w-10 h-10 text-yellow-400/40" />} label="No reviews yet. Share your thoughts on the protocol!" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map(r => (
                <Card key={r.id} className="bg-zinc-900/60 border-zinc-800 hover:border-yellow-500/30 transition-colors group">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-base text-white">{r.reviewer}</CardTitle>
                      <StarRating rating={r.rating} />
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => deleteReviewMutation.mutate(r.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-300 text-sm leading-relaxed">"{r.comment}"</p>
                    <p className="text-zinc-600 text-xs mt-3">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── FEATURE REQUESTS TAB ────────────────────────────────────────── */}
        <TabsContent value="features">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Feature Requests</h3>
              <p className="text-sm text-zinc-500">Ideas and requests from users for new features.</p>
            </div>
            <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                  <Plus className="w-4 h-4" /> Ask for New Feature
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" /> Request a New Feature
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-zinc-300 mb-1 block">Feature Title *</Label>
                    <Input
                      placeholder="e.g. Dark Mode for Profile Page"
                      value={featureForm.title}
                      onChange={e => setFeatureForm(f => ({ ...f, title: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-300 mb-1 block">Details *</Label>
                    <Textarea
                      placeholder="Describe the feature you'd like to see..."
                      value={featureForm.details}
                      onChange={e => setFeatureForm(f => ({ ...f, details: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-300 mb-1 block">Your Name</Label>
                      <Input
                        placeholder="Name (optional)"
                        value={featureForm.requestedBy}
                        onChange={e => setFeatureForm(f => ({ ...f, requestedBy: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300 mb-1 block">Priority</Label>
                      <Select value={featureForm.priority} onValueChange={val => setFeatureForm(f => ({ ...f, priority: val }))}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={() => createFeatureMutation.mutate(featureForm)}
                    disabled={createFeatureMutation.isPending || !featureForm.title || !featureForm.details}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {createFeatureMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingFeatures ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : features.length === 0 ? (
            <EmptyState icon={<MessageSquare className="w-10 h-10 text-blue-400/40" />} label="No feature requests yet. Ask for a new feature!" />
          ) : (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-zinc-900">
                    <TableHead className="text-zinc-400">Feature</TableHead>
                    <TableHead className="text-zinc-400">Details</TableHead>
                    <TableHead className="text-zinc-400">By</TableHead>
                    <TableHead className="text-zinc-400">Priority</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Date</TableHead>
                    <TableHead className="text-right text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.map(f => (
                    <TableRow key={f.id} className="border-zinc-800 hover:bg-zinc-800/40">
                      <TableCell className="font-medium text-white max-w-[150px]">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="truncate">{f.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 max-w-[220px]">
                        <span className="line-clamp-2 text-sm">{f.details}</span>
                      </TableCell>
                      <TableCell className="text-zinc-300 text-sm">{f.requestedBy}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${priorityColors[f.priority]}`}>
                          {f.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={f.status}
                          onValueChange={val => updateFeatureStatusMutation.mutate({ id: f.id, status: val })}
                        >
                          <SelectTrigger className={`w-32 h-7 text-xs border ${statusColors[f.status] || "bg-zinc-800"}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-zinc-500 text-xs">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => deleteFeatureMutation.mutate(f.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
      <div className="mb-4 opacity-50">{icon}</div>
      <p className="text-zinc-500 text-sm max-w-xs">{label}</p>
    </div>
  );
}
