import { useState } from "react";
import { useContacts, useCreateContact, useUpdateContactStatus } from "@/hooks/use-contacts";
import { 
  Search, RefreshCw, Filter, Plus, 
  CheckCircle, AlertCircle, Clock, XCircle,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Contacts() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  
  const limit = 50;
  const { data, isLoading, refetch } = useContacts({ 
    status: activeTab === 'all' ? undefined : activeTab, 
    search,
    page,
    limit
  });

  const { mutate: updateStatus } = useUpdateContactStatus();
  const { mutate: createContact, isPending: isCreating } = useCreateContact();

  const handleStatusChange = (id: number, newStatus: string) => {
    updateStatus({ id, status: newStatus }, {
      onSuccess: () => toast({ title: "Status Updated" }),
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createContact({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      source: 'manual',
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        toast({ title: "Success", description: "Contact added successfully" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Contacts</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your contact list.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" required />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Adding..." : "Save Contact"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sent">Sended</TabsTrigger>
            <TabsTrigger value="pending">Not Sended</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 text-xs uppercase font-medium text-muted-foreground">
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Sent At</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin inline-block w-6 h-6 border-b-2 border-primary rounded-full"></div>
                  </td>
                </tr>
              ) : data?.contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No contacts found.
                  </td>
                </tr>
              ) : (
                data?.contacts.map((contact, index) => (
                  <motion.tr 
                    key={contact.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{contact.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{contact.email}</td>
                    <td className="px-6 py-4">
                      <select 
                        value={contact.status}
                        onChange={(e) => handleStatusChange(contact.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border ${
                          contact.status === 'sent' ? 'bg-green-50 text-green-700 border-green-200' :
                          contact.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                          contact.status === 'skipped' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="sent">Sent</option>
                        <option value="failed">Failed</option>
                        <option value="skipped">Skipped</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {contact.sentAt ? format(new Date(contact.sentAt), 'PP p') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-muted-foreground font-mono">
                        {contact.source?.startsWith('csv:') ? 'CSV' : 'Manual'}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10">
            <div className="text-sm text-muted-foreground">
              Showing page {page} of {data.pages} ({data.total} total)
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === data.pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
