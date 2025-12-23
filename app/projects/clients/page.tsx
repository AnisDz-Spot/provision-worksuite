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
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { log } from "@/lib/logger";

type Client = {
  id: string;
  name: string;
  logo?: string;
  primaryEmail?: string;
  phone?: string;
  website?: string;
  primaryContact?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  status: string;
  tags?: string[];
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
      email: client.primaryEmail || "",
      phone: client.phone || "",
      companyName: "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      country: client.country || "",
      postalCode: client.postalCode || "",
      website: client.website || "",
      notes: "",
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
        <Link href="/projects/clients/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </Link>
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
              className="group relative overflow-hidden flex flex-col hover:shadow-xl transition-all border-border/50 hover:border-primary/20 bg-card"
            >
              <div className="p-5 flex-1 space-y-4">
                {/* Header: Logo & Name */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {client.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={client.logo}
                          alt={client.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-lg font-bold text-primary">
                          {client.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base leading-tight">
                        {client.name}
                      </h3>
                      {client.primaryContact && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <Users className="w-3 h-3" />
                          {client.primaryContact}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${
                      client.status === "active"
                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30"
                        : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
                    }`}
                  >
                    {client.status}
                  </div>
                </div>

                {/* Contact Info Grid */}
                <div className="grid gap-2 text-sm text-muted-foreground pt-2">
                  {client.primaryEmail && (
                    <a
                      href={`mailto:${client.primaryEmail}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors truncate"
                      title={client.primaryEmail}
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{client.primaryEmail}</span>
                    </a>
                  )}
                  {client.phone && (
                    <a
                      href={`tel:${client.phone}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors truncate"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{client.phone}</span>
                    </a>
                  )}
                  {client.website && (
                    <a
                      href={
                        client.website.startsWith("http")
                          ? client.website
                          : `https://${client.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 hover:text-primary transition-colors truncate"
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {client.website.replace(/^https?:\/\//, "")}
                      </span>
                    </a>
                  )}
                  {(client.city || client.country) && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {[client.city, client.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {client.tags && client.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {client.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {client.tags.length > 3 && (
                      <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        +{client.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="bg-muted/30 p-3 flex items-center justify-between border-t border-border/50">
                <span className="text-xs text-muted-foreground font-medium">
                  {client._count?.projects || 0} Project
                  {(client._count?.projects || 0) !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/projects/clients/${client.id}/edit`}
                    className="p-1.5 hover:bg-background rounded-md shadow-sm border border-transparent hover:border-border text-muted-foreground hover:text-foreground transition-all"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-1.5 hover:bg-destructive/10 rounded-md shadow-sm border border-transparent hover:border-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
