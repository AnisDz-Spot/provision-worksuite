"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";

type ClientData = {
  id?: string;
  name: string;
  logo?: string;
  type: string;
  status: string;
  primaryEmail?: string;
  secondaryEmail?: string;
  phone?: string;
  website?: string;
  primaryContact?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  timezone?: string;
  language?: string;
  billingEmail?: string;
  vatNumber?: string;
  currency?: string;
  hourlyRate?: number;
  paymentTerms?: string;
  defaultVisibility?: string;
  tags?: string[];
  notes?: string;
};

export default function ClientForm({
  initialData,
  isEditing = false,
}: {
  initialData?: ClientData;
  isEditing?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ClientData>(
    initialData || {
      name: "",
      type: "company",
      status: "active",
      defaultVisibility: "shared",
      currency: "USD",
    }
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url =
        isEditing && initialData?.id
          ? `/api/clients/${initialData.id}`
          : "/api/clients";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save client");

      const data = await res.json();
      router.push("/projects/clients");
      router.refresh();
      // toast.success("Client saved successfully");
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/projects/clients"
            className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Edit Client" : "New Client"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "Update client information and settings"
                : "Add a new client to your workspace"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} variant="primary">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Client"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Core Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">
                  Client Name *
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="company">Company</option>
                  <option value="individual">Individual</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">
                  Logo URL
                </label>
                <Input
                  name="logo"
                  value={formData.logo || ""}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4">
              Contact Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Primary Email
                </label>
                <Input
                  type="email"
                  name="primaryEmail"
                  value={formData.primaryEmail || ""}
                  onChange={handleChange}
                  placeholder="contact@acme.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Secondary Email
                </label>
                <Input
                  type="email"
                  name="secondaryEmail"
                  value={formData.secondaryEmail || ""}
                  onChange={handleChange}
                  placeholder="billing@acme.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Website
                </label>
                <Input
                  type="url"
                  name="website"
                  value={formData.website || ""}
                  onChange={handleChange}
                  placeholder="https://acme.com"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">
                  Primary Contact Person
                </label>
                <Input
                  name="primaryContact"
                  value={formData.primaryContact || ""}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4">
              Address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Street Address
                </label>
                <Input
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  placeholder="1234 Market St, Suite 500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <Input
                    name="city"
                    value={formData.city || ""}
                    onChange={handleChange}
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    State / Region
                  </label>
                  <Input
                    name="state"
                    value={formData.state || ""}
                    onChange={handleChange}
                    placeholder="CA"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Postal Code
                  </label>
                  <Input
                    name="postalCode"
                    value={formData.postalCode || ""}
                    onChange={handleChange}
                    placeholder="94103"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Country
                  </label>
                  <Input
                    name="country"
                    value={formData.country || ""}
                    onChange={handleChange}
                    placeholder="USA"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Timezone
                  </label>
                  <Input
                    name="timezone"
                    value={formData.timezone || ""}
                    onChange={handleChange}
                    placeholder="America/Los_Angeles"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Language
                  </label>
                  <Input
                    name="language"
                    value={formData.language || ""}
                    onChange={handleChange}
                    placeholder="English"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Billing & Settings */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4">
              Billing Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Billing Email
                </label>
                <Input
                  type="email"
                  name="billingEmail"
                  value={formData.billingEmail || ""}
                  onChange={handleChange}
                  placeholder="invoice@acme.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  VAT / Tax ID
                </label>
                <Input
                  name="vatNumber"
                  value={formData.vatNumber || ""}
                  onChange={handleChange}
                  placeholder="US123456789"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Currency
                  </label>
                  <Input
                    name="currency"
                    value={formData.currency || "USD"}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Hourly Rate
                  </label>
                  <Input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate || ""}
                    onChange={handleChange}
                    placeholder="150"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Payment Terms
                </label>
                <Input
                  name="paymentTerms"
                  value={formData.paymentTerms || ""}
                  onChange={handleChange}
                  placeholder="Net 30"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4">
              Settings & Notes
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Default Visibility
                </label>
                <select
                  name="defaultVisibility"
                  value={formData.defaultVisibility}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="shared">Shared (Team)</option>
                  <option value="private">Private (Admins Only)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Internal Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleChange}
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="internal client notes..."
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
