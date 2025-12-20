"use client";
import React from "react";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  Linkedin,
  Facebook,
  Instagram,
  Music2,
  Github,
  Twitter,
} from "lucide-react";

type MemberFormProps = {
  mode: "add" | "edit";
  draftName: string;
  setDraftName: (val: string) => void;
  draftRole: string;
  setDraftRole: (val: string) => void;
  draftEmail: string;
  setDraftEmail: (val: string) => void;
  draftPassword?: string;
  setDraftPassword?: (val: string) => void;
  draftPhone: string;
  setDraftPhone: (val: string) => void;
  draftAddress: string;
  setDraftAddress: (val: string) => void;
  draftAddress2: string;
  setDraftAddress2: (val: string) => void;
  draftCity: string;
  setDraftCity: (val: string) => void;
  draftState: string;
  setDraftState: (val: string) => void;
  draftCountry: string;
  setDraftCountry: (val: string) => void;
  draftPostal: string;
  setDraftPostal: (val: string) => void;
  draftBio: string;
  setDraftBio: (val: string) => void;
  // Socials
  draftLinkedin: string;
  setDraftLinkedin: (val: string) => void;
  draftFacebook: string;
  setDraftFacebook: (val: string) => void;
  draftInstagram: string;
  setDraftInstagram: (val: string) => void;
  draftTiktok: string;
  setDraftTiktok: (val: string) => void;
  draftGithub: string;
  setDraftGithub: (val: string) => void;
  draftTwitter: string;
  setDraftTwitter: (val: string) => void;
  // Geo Data
  allCountries: any[];
  allStates: any[];
  allCities: any[];
  currentCountryIso: string;
  currentStateIso?: string;
  // Roles
  roleColors: Record<string, string>;
  isMasterAdmin: boolean;
};

export function MemberForm({
  mode,
  draftName,
  setDraftName,
  draftRole,
  setDraftRole,
  draftEmail,
  setDraftEmail,
  draftPassword,
  setDraftPassword,
  draftPhone,
  setDraftPhone,
  draftAddress,
  setDraftAddress,
  draftAddress2,
  setDraftAddress2,
  draftCity,
  setDraftCity,
  draftState,
  setDraftState,
  draftCountry,
  setDraftCountry,
  draftPostal,
  setDraftPostal,
  draftBio,
  setDraftBio,
  draftLinkedin,
  setDraftLinkedin,
  draftFacebook,
  setDraftFacebook,
  draftInstagram,
  setDraftInstagram,
  draftTiktok,
  setDraftTiktok,
  draftGithub,
  setDraftGithub,
  draftTwitter,
  setDraftTwitter,
  allCountries,
  allStates,
  allCities,
  currentCountryIso,
  currentStateIso,
  roleColors,
  isMasterAdmin,
}: MemberFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
      <div className="space-y-2">
        <label className="text-xs font-medium">
          Name {mode === "add" && "*"}
        </label>
        <Input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Full name"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium">Role</label>
        <select
          value={draftRole}
          onChange={(e) => setDraftRole(e.target.value)}
          disabled={
            (mode === "edit" && draftRole === "Master Admin") || !isMasterAdmin
          }
          className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed dark:bg-card dark:text-foreground"
        >
          <option value="" className="dark:bg-card">
            Select Role
          </option>
          {Object.keys(roleColors).map((r) => (
            <option
              key={r}
              value={r}
              disabled={r === "Master Admin" && draftRole !== "Master Admin"}
              className="dark:bg-card"
            >
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium">
          Email {mode === "add" && "*"}
        </label>
        <Input
          value={draftEmail}
          onChange={(e) => setDraftEmail(e.target.value)}
          placeholder="email@example.com"
        />
      </div>
      {mode === "add" && setDraftPassword && (
        <div className="space-y-2">
          <label className="text-xs font-medium">Password *</label>
          <Input
            type="password"
            value={draftPassword}
            onChange={(e) => setDraftPassword(e.target.value)}
            placeholder="Initial password"
          />
        </div>
      )}
      <div className="space-y-2">
        <label className="text-xs font-medium">Phone</label>
        <Input
          value={draftPhone}
          onChange={(e) => setDraftPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <label className="text-xs font-medium">Address Line 1</label>
        <Input
          value={draftAddress}
          onChange={(e) => setDraftAddress(e.target.value)}
          placeholder="Street"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <label className="text-xs font-medium">Address Line 2</label>
        <Input
          value={draftAddress2}
          onChange={(e) => setDraftAddress2(e.target.value)}
          placeholder="Apt, Suite, etc."
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium">Country</label>
        <SearchableSelect
          options={allCountries}
          value={currentCountryIso || ""}
          onChange={(iso) => {
            const country = allCountries.find((c) => c.value === iso);
            if (country) {
              setDraftCountry(country.label);
              setDraftState("");
              setDraftCity("");
            }
          }}
          placeholder="Select Country..."
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium">State</label>
        <SearchableSelect
          options={allStates}
          value={currentStateIso || ""}
          onChange={(iso) => {
            const state = allStates.find((s) => s.value === iso);
            if (state) {
              setDraftState(state.label);
              setDraftCity("");
            }
          }}
          placeholder="Select State..."
          disabled={!currentCountryIso}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium">City</label>
        <SearchableSelect
          options={allCities}
          value={draftCity}
          onChange={(val) => setDraftCity(val)}
          placeholder="Select City..."
          disabled={!currentCountryIso}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium">Postal Code</label>
        <Input
          value={draftPostal}
          onChange={(e) => setDraftPostal(e.target.value)}
          placeholder="Zip"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <label className="text-xs font-medium">Bio</label>
        <textarea
          value={draftBio}
          onChange={(e) => setDraftBio(e.target.value)}
          placeholder="Short bio"
          rows={2}
          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Social Links */}
      <div className="space-y-4 md:col-span-2 pt-2 border-t border-border mt-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          Social Links{" "}
          <span className="text-[10px] font-normal text-muted-foreground uppercase">
            (Optional)
          </span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-2">
              <Linkedin className="w-3 h-3 text-blue-600" /> LinkedIn
            </label>
            <Input
              value={draftLinkedin}
              onChange={(e) => setDraftLinkedin(e.target.value)}
              placeholder="Username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-2">
              <Facebook className="w-3 h-3 text-blue-600" /> Facebook
            </label>
            <Input
              value={draftFacebook}
              onChange={(e) => setDraftFacebook(e.target.value)}
              placeholder="Username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-2">
              <Instagram className="w-3 h-3 text-pink-500" /> Instagram
            </label>
            <Input
              value={draftInstagram}
              onChange={(e) => setDraftInstagram(e.target.value)}
              placeholder="Username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-2">
              <Music2 className="w-3 h-3 text-slate-900" /> TikTok
            </label>
            <Input
              value={draftTiktok}
              onChange={(e) => setDraftTiktok(e.target.value)}
              placeholder="Username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-2">
              <Github className="w-3 h-3 text-gray-700 dark:text-gray-300" />{" "}
              GitHub
            </label>
            <Input
              value={draftGithub}
              onChange={(e) => setDraftGithub(e.target.value)}
              placeholder="Username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-2">
              <Twitter className="w-3 h-3 text-sky-500" /> Twitter/X
            </label>
            <Input
              value={draftTwitter}
              onChange={(e) => setDraftTwitter(e.target.value)}
              placeholder="Username"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
