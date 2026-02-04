import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Megaphone, Users, Home, UserCheck, Trash2, Calendar, Clock, AlertTriangle } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Announcement {
    id: string;
    title: string;
    message: string;
    target_audience: string;
    priority: string;
    start_time: string;
    end_time: string | null;
    is_active: bool;
    created_at: string;
}

const AdminAnnouncements = () => {
    const navigate = useNavigate();
    const { role, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetAudience, setTargetAudience] = useState('all');
    const [priority, setPriority] = useState('normal');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [sending, setSending] = useState(false);

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        if (!authLoading && role !== 'admin') {
            navigate('/auth');
        }
    }, [role, authLoading, navigate]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await api.getAdminAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error('Failed to fetch announcement history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            toast({
                variant: 'destructive',
                title: 'Missing fields',
                description: 'Please provide both title and message',
            });
            return;
        }

        setSending(true);
        try {
            await api.createAdminAnnouncement({
                title,
                message,
                target_audience: targetAudience,
                priority,
                start_time: startTime ? new Date(startTime).toISOString() : undefined,
                end_time: endTime ? new Date(endTime).toISOString() : undefined,
            });

            toast({
                title: 'Announcement sent!',
                description: `Broadcasted to ${targetAudience} users`,
            });

            // Clear form
            setTitle('');
            setMessage('');
            setTargetAudience('all');
            setPriority('normal');
            setStartTime('');
            setEndTime('');

            // Refresh history
            fetchHistory();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to send',
                description: error.message,
            });
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        try {
            await api.deleteAdminAnnouncement(id);
            toast({ title: 'Deleted', description: 'Announcement removed successfully' });
            fetchHistory();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to delete announcement'
            });
        }
    };

    const getAudienceIcon = (audience: string) => {
        switch (audience) {
            case 'owners':
                return <Home className="h-4 w-4" />;
            case 'tenants':
                return <UserCheck className="h-4 w-4" />;
            default:
                return <Users className="h-4 w-4" />;
        }
    };

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case 'urgent': return <Badge variant="destructive">Urgent</Badge>;
            case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
            case 'low': return <Badge variant="secondary">Low</Badge>;
            default: return <Badge variant="default">Normal</Badge>;
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Megaphone className="h-6 w-6 text-primary" />
                                System Announcements
                            </h1>
                            <p className="text-muted-foreground">Manage and broadcast messages to all platform users</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Side: Create Form */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>New Broadcast</CardTitle>
                                <CardDescription>Draft a message for your users</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Headline"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Write your details here..."
                                        rows={4}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label>Target Audience</Label>
                                        <Select value={targetAudience} onValueChange={setTargetAudience}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Users</SelectItem>
                                                <SelectItem value="owners">Owners Only</SelectItem>
                                                <SelectItem value="tenants">Tenants Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Select value={priority} onValueChange={setPriority}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="urgent">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <Label className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Scheduling (Timer)
                                    </Label>
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="startTime" className="text-xs">Start Time (Optional)</Label>
                                            <Input
                                                id="startTime"
                                                type="datetime-local"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="endTime" className="text-xs">End Time / Expiry (Optional)</Label>
                                            <Input
                                                id="endTime"
                                                type="datetime-local"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-4"
                                    onClick={handleSend}
                                    disabled={sending || !title.trim() || !message.trim()}
                                >
                                    {sending ? "Sending..." : "Send Now"}
                                    <Send className="h-4 w-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side: History */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="h-full flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    Broadcast History
                                    <Badge variant="outline">{announcements.length}</Badge>
                                </CardTitle>
                                <CardDescription>View and manage previously sent messages</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                {loadingHistory ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : announcements.length === 0 ? (
                                    <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                                        <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                                        <p className="text-muted-foreground">No announcements sent yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {announcements.map((ann) => {
                                            const isExpired = ann.end_time && new Date(ann.end_time) < new Date();
                                            const isFuture = new Date(ann.start_time) > new Date();

                                            return (
                                                <Card key={ann.id} className={`${isExpired ? 'opacity-60 bg-muted/5' : ''}`}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="space-y-1 flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h3 className="font-bold">{ann.title}</h3>
                                                                    {getPriorityBadge(ann.priority)}
                                                                    <Badge variant="outline" className="flex items-center gap-1">
                                                                        {getAudienceIcon(ann.target_audience)}
                                                                        {ann.target_audience}
                                                                    </Badge>
                                                                    {isExpired && (
                                                                        <Badge variant="outline" className="text-muted-foreground">Expired</Badge>
                                                                    )}
                                                                    {isFuture && (
                                                                        <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Scheduled</Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm line-clamp-2 mt-2">{ann.message}</p>
                                                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {new Date(ann.created_at).toLocaleDateString()}
                                                                    </div>
                                                                    {ann.end_time && (
                                                                        <div className={`flex items-center gap-1 ${isExpired ? 'text-red-400' : ''}`}>
                                                                            <Clock className="h-3 w-3" />
                                                                            Exp: {new Date(ann.end_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive hover:text-white hover:bg-destructive h-8 w-8"
                                                                onClick={() => handleDelete(ann.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnnouncements;
