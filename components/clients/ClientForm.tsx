"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, Save, Upload, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  getCountries,
  getStates,
  getCities,
  type GeoOption,
} from "@/app/actions/geo";

// Common timezones list
const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Zurich",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

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
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Geo Data State
  const [allCountries, setAllCountries] = useState<GeoOption[]>([]);
  const [allStates, setAllStates] = useState<GeoOption[]>([]);
  const [allCities, setAllCities] = useState<GeoOption[]>([]);

  const [formData, setFormData] = useState<ClientData>(
    initialData || {
      name: "",
      type: "company",
      status: "active",
      defaultVisibility: "shared",
      currency: "USD",
      country: "",
      state: "",
      city: "",
      timezone: "",
    }
  );

  // Load Countries on mount
  useEffect(() => {
    getCountries().then(setAllCountries);
  }, []);

  // Find ISO codes for selected country/state labels
  const currentCountryIso = useMemo(() => {
    return allCountries.find((c) => c.label === formData.country)?.value;
  }, [allCountries, formData.country]);

  // Load States when country changes
  useEffect(() => {
    if (!currentCountryIso) {
      setAllStates([]);
      return;
    }
    getStates(currentCountryIso).then(setAllStates);
  }, [currentCountryIso]);

  const currentStateIso = useMemo(() => {
    return allStates.find((s) => s.label === formData.state)?.value;
  }, [allStates, formData.state]);

  // Load Cities when state changes
  useEffect(() => {
    if (!currentCountryIso) {
      setAllCities([]);
      return;
    }
    getCities(currentCountryIso, currentStateIso).then(setAllCities);
  }, [currentCountryIso, currentStateIso]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      // Path strategy: clients/timestamp-filename
      const filename = sanitizeFilename(file.name);
      formDataUpload.append("path", `clients/${Date.now()}-${filename}`);

      // Using the generic local upload endpoint
      const res = await fetchWithCsrf("/api/upload-local", {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setFormData((prev) => ({ ...prev, logo: data.url }));
    } catch (error) {
      console.error("Logo upload error:", error);
      alert("Failed to upload logo. Please try again.");
    } finally {
      setUploadingLogo(false);
    }
  };

  // Helper to sanitize filename for client-side usage if needed
  function sanitizeFilename(name: string) {
    return name.replace(/[^a-zA-Z0-9.-]/g, "_");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url =
        isEditing && initialData?.id
          ? `/api/clients/${initialData.id}`
          : "/api/clients";

      const method = isEditing ? "PUT" : "POST";

      // Use fetchWithCsrf for CSRF protection
      const res = await fetchWithCsrf(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save client");

      const data = await res.json();
      router.push("/projects/clients");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 max-w-5xl mx-auto pt-10 pb-20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 ">
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

              {/* Logo Upload */}
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium mb-1 block">Logo</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {formData.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={formData.logo}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                          {uploadingLogo ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            "Upload Image"
                          )}
                        </div>
                      </label>
                      {formData.logo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setFormData((p) => ({ ...p, logo: "" }))
                          }
                          title="Remove logo"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: Square JPG or PNG, max 2MB.
                    </p>
                  </div>
                </div>
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
                {/* Country Selector */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Country
                  </label>
                  <SearchableSelect
                    options={allCountries}
                    value={currentCountryIso || ""}
                    onChange={(iso) => {
                      const country = allCountries.find((c) => c.value === iso);
                      if (country) {
                        setFormData((prev) => ({
                          ...prev,
                          country: country.label,
                          state: "",
                          city: "",
                        }));
                      }
                    }}
                    placeholder="Select Country..."
                  />
                </div>
                {/* State Selector */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    State / Region
                  </label>
                  <SearchableSelect
                    options={allStates}
                    value={currentStateIso || ""}
                    onChange={(iso) => {
                      const state = allStates.find((s) => s.value === iso);
                      if (state) {
                        setFormData((prev) => ({
                          ...prev,
                          state: state.label,
                          city: "",
                        }));
                      }
                    }}
                    placeholder="Select State..."
                    disabled={!currentCountryIso}
                  />
                </div>
                {/* City Selector */}
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <SearchableSelect
                    options={allCities}
                    value={formData.city || ""}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, city: val }))
                    }
                    placeholder="Select City..."
                    disabled={!currentCountryIso}
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Timezone
                  </label>
                  <select
                    name="timezone"
                    value={formData.timezone || ""}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select Timezone</option>
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
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
