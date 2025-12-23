"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Building,
  MapPin,
  Globe,
  Edit,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { log } from "@/lib/logger";

type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  notes?: string;
  status: string;
  _count?: {
    projects: number;
  };
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    website: "",
    notes: "",
  });

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients?search=${search}`);
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch clients", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingClient
        ? `/api/clients/${editingClient.id}`
        : "/api/clients";
      const method = editingClient ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingClient(null);
        resetForm();
        fetchClients();
      }
    } catch (error) {
      console.error("Failed to save client", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      fetchClients();
    } catch (error) {
      console.error("Failed to delete client", error);
    }
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      companyName: client.companyName || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      country: client.country || "",
      postalCode: client.postalCode || "",
      website: client.website || "",
      notes: client.notes || "",
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      companyName: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      website: "",
      notes: "",
    });
  };

  return (
    <section className="p-4 md:p-8 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clients</h1>
            <p className="text-sm text-muted-foreground">
              Manage your client database
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingClient(null);
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-muted-foreground col-span-full text-center py-12">
            Loading clients...
          </p>
        ) : clients.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-accent/20 rounded-lg border border-dashed border-border">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium">No clients found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Add your first client to get started.
            </p>
          </div>
        ) : (
          clients.map((client) => (
            <Card
              key={client.id}
              className="p-6 hover:shadow-lg transition-all group relative"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={() => openEdit(client)}
                  className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">
                    {client.name}
                  </h3>
                  {client.companyName && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Building className="w-3.5 h-3.5" />
                      {client.companyName}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {(client.email || client.phone) && (
                  <div className="space-y-1.5 pt-2 border-t border-border/50">
                    {client.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        <a
                          href={`mailto:${client.email}`}
                          className="hover:text-primary transition-colors truncate"
                        >
                          {client.email}
                        </a>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <a
                          href={`tel:${client.phone}`}
                          className="hover:text-primary transition-colors"
                        >
                          {client.phone}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {(client.address || client.city || client.country) && (
                  <div className="flex items-start gap-2 text-muted-foreground pt-2 border-t border-border/50">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">
                      {[
                        client.address,
                        client.city,
                        client.state,
                        client.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}

                {client.website && (
                  <div className="flex items-center gap-2 text-muted-foreground pt-2 border-t border-border/50">
                    <Globe className="w-3.5 h-3.5" />
                    <a
                      href={
                        client.website.startsWith("http")
                          ? client.website
                          : `https://${client.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary transition-colors truncate"
                    >
                      {client.website}
                    </a>
                  </div>
                )}

                <div className="pt-3 mt-1 flex items-center justify-between">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent text-accent-foreground">
                    {client.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {client._count?.projects || 0} Projects
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div className="mb-4">
          <h2 className="text-xl font-bold">
            {editingClient ? "Edit Client" : "Add New Client"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <Input
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                placeholder="Acme Inc."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="New York"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State/Province</label>
              <Input
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                placeholder="NY"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <Input
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                placeholder="USA"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Postal Code</label>
              <Input
                value={formData.postalCode}
                onChange={(e) =>
                  setFormData({ ...formData, postalCode: e.target.value })
                }
                placeholder="10001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Website</label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional client details..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingClient ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
