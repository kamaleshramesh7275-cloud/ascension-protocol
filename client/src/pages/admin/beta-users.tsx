import { useState, useEffect } from "react";
import { getAllBetaCodes, generateBetaCodes, resetBetaCode, BetaCode } from "@/lib/beta-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Plus, Trash2 } from "lucide-react";

export default function BetaAdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [codes, setCodes] = useState<BetaCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple hardcoded check for demo purposes
        if (password === "admin123") {
            setIsAuthenticated(true);
            fetchCodes();
        } else {
            alert("Invalid password");
        }
    };

    const fetchCodes = async () => {
        setLoading(true);
        try {
            const data = await getAllBetaCodes();
            setCodes(data.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));
        } catch (error) {
            console.error("Failed to fetch codes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await generateBetaCodes(10); // Generate 10 at a time for safety
            await fetchCodes();
        } catch (error) {
            console.error("Failed to generate codes", error);
        } finally {
            setGenerating(false);
        }
    };

    const handleReset = async (code: string) => {
        if (!confirm("Are you sure you want to reset this code?")) return;
        try {
            await resetBetaCode(code);
            await fetchCodes();
        } catch (error) {
            console.error("Failed to reset code", error);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle>Admin Access</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Enter admin password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-black border-zinc-700"
                            />
                            <Button type="submit" className="w-full">Login</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Beta Access Management</h1>
                    <div className="flex gap-4">
                        <Button onClick={fetchCodes} variant="outline" disabled={loading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button onClick={handleGenerate} disabled={generating}>
                            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            Generate 10 Codes
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Total Codes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{codes.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Claimed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">
                                {codes.filter(c => c.isUsed).length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Available</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-500">
                                {codes.filter(c => !c.isUsed).length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                                    <TableHead className="text-zinc-400">Code</TableHead>
                                    <TableHead className="text-zinc-400">Status</TableHead>
                                    <TableHead className="text-zinc-400">Claimed By</TableHead>
                                    <TableHead className="text-zinc-400">Created At</TableHead>
                                    <TableHead className="text-zinc-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {codes.map((code) => (
                                    <TableRow key={code.code} className="border-zinc-800 hover:bg-zinc-800/50">
                                        <TableCell className="font-mono">{code.code}</TableCell>
                                        <TableCell>
                                            <Badge variant={code.isUsed ? "secondary" : "default"} className={code.isUsed ? "bg-green-900 text-green-200" : "bg-blue-900 text-blue-200"}>
                                                {code.isUsed ? "Claimed" : "Available"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm text-zinc-400">
                                            {code.claimedBy || "-"}
                                        </TableCell>
                                        <TableCell className="text-zinc-400">
                                            {code.createdAt?.toDate().toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {code.isUsed && (
                                                <Button variant="ghost" size="sm" onClick={() => handleReset(code.code)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
