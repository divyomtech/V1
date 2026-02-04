import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Settings, Wrench, Loader2 } from "lucide-react";

const Maintenance = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRaiseTicketOpen, setIsRaiseTicketOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium', property_id: '' });
    const [isRaising, setIsRaising] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [ticketsData, bookingsData] = await Promise.all([
                api.getMyTickets(),
                api.getBookings()
            ]);
            setTickets(ticketsData || []);
            setBookings(bookingsData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRaiseTicket = async () => {
        if (!newTicket.title || !newTicket.description || !newTicket.property_id) {
            toast.error("Please fill in all fields and select a property");
            return;
        }

        setIsRaising(true);
        try {
            await api.raiseTicket(newTicket);
            toast.success("Maintenance ticket raised successfully!");
            setIsRaiseTicketOpen(false);
            setNewTicket({ title: '', description: '', priority: 'medium', property_id: '' });
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to raise ticket");
        } finally {
            setIsRaising(false);
        }
    };

    if (!user) {
        navigate('/auth');
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background pb-24">
                <Header />
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <Header />
            <div className="container py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <Settings className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Maintenance Tickets</h1>
                                <p className="text-sm text-muted-foreground">Raise and track issues with your PG facilities</p>
                            </div>
                        </div>

                        <Dialog open={isRaiseTicketOpen} onOpenChange={setIsRaiseTicketOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                                    <Plus className="h-4 w-4" />
                                    Raise Ticket
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Raise Maintenance Ticket</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Select Property</label>
                                        <Select
                                            value={newTicket.property_id}
                                            onValueChange={(val) => setNewTicket({ ...newTicket, property_id: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Which PG is this for?" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {/* Filter for unique properties */}
                                                {bookings
                                                    .filter((booking, index, self) =>
                                                        index === self.findIndex(b => b.property_id === booking.property_id)
                                                    )
                                                    .map((b) => (
                                                        <SelectItem key={b.property_id} value={b.property_id}>
                                                            {b.property?.title || 'Active PG'}
                                                        </SelectItem>
                                                    ))}
                                                {bookings.length === 0 && (
                                                    <div className="p-2 text-sm text-muted-foreground">No active bookings found</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Issue Title</label>
                                        <Input
                                            placeholder="e.g. WiFi not working, Fan making noise"
                                            value={newTicket.title}
                                            onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Description</label>
                                        <textarea
                                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Describe the issue in detail..."
                                            value={newTicket.description}
                                            onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Priority</label>
                                        <Select
                                            value={newTicket.priority}
                                            onValueChange={(val) => setNewTicket({ ...newTicket, priority: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Priority level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low - Not urgent</SelectItem>
                                                <SelectItem value="medium">Medium - Standard</SelectItem>
                                                <SelectItem value="high">High - Urgent</SelectItem>
                                                <SelectItem value="urgent">Urgent - Immediate attention</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button
                                    className="w-full bg-orange-600 hover:bg-orange-700"
                                    onClick={handleRaiseTicket}
                                    disabled={isRaising}
                                >
                                    {isRaising ? "Submitting..." : "Submit Ticket"}
                                </Button>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {tickets.length === 0 ? (
                        <Card className="text-center py-16 border-2 border-dashed border-orange-200 bg-orange-50/50">
                            <CardContent>
                                <Wrench className="h-16 w-16 text-orange-200 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Maintenance Tickets</h3>
                                <p className="text-muted-foreground mb-4">You haven't raised any maintenance tickets yet</p>
                                <Button onClick={() => setIsRaiseTicketOpen(true)} className="gap-2 bg-orange-600 hover:bg-orange-700">
                                    <Plus className="h-4 w-4" />
                                    Raise Your First Ticket
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {tickets.map((ticket) => (
                                <Card key={ticket.id} className="overflow-hidden border-orange-100 hover:shadow-lg transition-all">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant={
                                                        ticket.status === 'open' ? "outline" :
                                                            ticket.status === 'in_progress' ? "secondary" :
                                                                "default"
                                                    } className="bg-orange-50 text-orange-700 border-orange-200 text-xs uppercase">
                                                        {ticket.status.replace('_', ' ')}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(ticket.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-base mb-1">{ticket.title}</h4>
                                                <p className="text-sm text-muted-foreground">{ticket.description}</p>
                                            </div>
                                            <Badge variant="outline" className={`text-xs ${ticket.priority === 'urgent' ? 'border-red-500 text-red-500' :
                                                ticket.priority === 'high' ? 'border-orange-500 text-orange-500' :
                                                    'border-slate-300 text-slate-500'
                                                }`}>
                                                {ticket.priority}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
