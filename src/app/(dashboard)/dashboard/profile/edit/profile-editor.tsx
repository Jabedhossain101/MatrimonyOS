"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  saveBasicInfoAction,
  savePersonalDetailsAction,
  saveCareerInfoAction,
  saveFamilyInfoAction,
  saveLifestyleInfoAction,
  savePartnerPreferencesAction,
} from "@/server/actions/profile.actions";
import { Button } from "@/components/ui/button";
import {
  User,
  Heart,
  Briefcase,
  Users as FamilyIcon,
  Smile,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";
import type { CompleteProfile } from "@/server/utils/privacy";
import type { ProfileFor, Gender, MaritalStatus, FamilyType } from "@/generated/prisma";

type TabId = "basic" | "personal" | "career" | "family" | "lifestyle" | "preferences";

const COUNTRIES = [
  "Bangladesh",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Oman",
  "Germany",
  "Sweden",
  "Malaysia",
  "Singapore",
  "India",
  "Pakistan",
  "Other",
];

const RELIGIONS = [
  "Islam",
  "Hinduism",
  "Christianity",
  "Buddhism",
  "Sikhism",
  "Other",
];

const PROFESSIONS = [
  "Software Engineer / Tech",
  "Physician / Doctor",
  "Dentist / Healthcare Professional",
  "Accountant / Financial Analyst",
  "Chartered Accountant (CA/CPA)",
  "Business Owner / Entrepreneur",
  "Civil / Mechanical Engineer",
  "Architect",
  "University Professor / Lecturer",
  "School Teacher / Educator",
  "Lawyer / Legal Professional",
  "Civil Servant / Government Official",
  "Banking Executive",
  "Management Consultant",
  "Marketing / Advertising",
  "Creative / Designer",
  "Other",
];

const MARITAL_STATUS_OPTIONS = [
  { value: "NEVER_MARRIED", label: "Never Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
  { value: "SEPARATED", label: "Separated" },
  { value: "ANNULLED", label: "Annulled" },
];

interface ProfileEditorProps {
  initialProfile: CompleteProfile;
}

export function ProfileEditor({ initialProfile }: ProfileEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<TabId>("basic");

  const [isSaving, setIsSaving] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form states
  const [basic, setBasic] = React.useState({
    profileFor: initialProfile.profileFor || "SELF",
    fullName: initialProfile.fullName || "",
    dateOfBirth: initialProfile.dateOfBirth
      ? new Date(initialProfile.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender: initialProfile.gender || "MALE",
    maritalStatus: initialProfile.maritalStatus || "NEVER_MARRIED",
    countryOfResidence: initialProfile.countryOfResidence || "United Kingdom",
    cityOfResidence: initialProfile.cityOfResidence || "",
    nationality: initialProfile.nationality || "British",
    preferredLanguage: initialProfile.preferredLanguage || "English",
  });

  const [personal, setPersonal] = React.useState({
    heightCm: initialProfile.heightCm || 170,
    weightKg: initialProfile.weightKg || "",
    bodyType: initialProfile.bodyType || "Average",
    complexion: initialProfile.complexion || "Fair",
    religion: initialProfile.religion || "Islam",
    religiousPractice: initialProfile.religiousPractice || "Moderately Practicing",
    communityEthnicity: initialProfile.communityEthnicity || "South Asian",
    disabilityInfo: initialProfile.disabilityInfo || "",
    aboutMe: initialProfile.aboutMe || "",
  });

  const [career, setCareer] = React.useState({
    employmentStatus: initialProfile.employmentStatus || "Employed Full-Time",
    profession: initialProfile.profession || "Software Engineer / Tech",
    jobTitle: initialProfile.jobTitle || "",
    industry: initialProfile.industry || "Information Technology",
    employer: initialProfile.employer || "",
    incomeCurrency: initialProfile.incomeCurrency || "USD",
    annualIncomeRange: initialProfile.annualIncomeRange || "$75,000 - $100,000",
    workLocation: initialProfile.workLocation || "",
    careerDescription: initialProfile.careerDescription || "",
  });

  const [family, setFamily] = React.useState({
    familyType: initialProfile.familyType || "NUCLEAR",
    familyValues: initialProfile.familyValues || "Moderate",
    fatherOccupation: initialProfile.fatherOccupation || "",
    motherOccupation: initialProfile.motherOccupation || "",
    brothersCount: initialProfile.brothersCount ?? 0,
    sistersCount: initialProfile.sistersCount ?? 0,
    brothersMarriedCount: initialProfile.brothersMarriedCount ?? 0,
    sistersMarriedCount: initialProfile.sistersMarriedCount ?? 0,
    familyLocation: initialProfile.familyLocation || "",
    familyBackground: initialProfile.familyBackground || "",
  });

  const [lifestyle, setLifestyle] = React.useState({
    dietaryHabits: initialProfile.dietaryHabits || "Strictly Halal",
    smokingHabits: initialProfile.smokingHabits || "Non-Smoker",
    drinkingHabits: initialProfile.drinkingHabits || "Non-Drinker",
    exerciseHabits: initialProfile.exerciseHabits || "",
    livingArrangement: initialProfile.livingArrangement || "Lives with Family",
    hobbies: initialProfile.hobbies?.join(", ") || "Reading, Travel",
    languages: initialProfile.languages?.join(", ") || "English, Bengali",
    lifestyleDescription: initialProfile.lifestyleDescription || "",
  });

  const pref = initialProfile.partnerPreference;
  const [partnerPref, setPartnerPref] = React.useState({
    minAge: pref?.minAge ?? 22,
    maxAge: pref?.maxAge ?? 32,
    minHeightCm: pref?.minHeightCm ?? 155,
    maxHeightCm: pref?.maxHeightCm ?? 185,
    maritalStatus: pref?.maritalStatus || ["NEVER_MARRIED"],
    countries: pref?.countries || ["United Kingdom"],
    religions: pref?.religions || ["Islam"],
    additionalExpectations: pref?.additionalExpectations || "",
  });

  const handleSaveActiveSection = async () => {
    setStatusMsg(null);
    setIsSaving(true);

    try {
      if (activeTab === "basic") {
        const res = await saveBasicInfoAction({
          profileFor: basic.profileFor as ProfileFor,
          fullName: basic.fullName,
          dateOfBirth: basic.dateOfBirth,
          gender: basic.gender as Gender,
          maritalStatus: basic.maritalStatus as MaritalStatus,
          countryOfResidence: basic.countryOfResidence,
          cityOfResidence: basic.cityOfResidence,
          nationality: basic.nationality,
          preferredLanguage: basic.preferredLanguage,
        });
        if (!res.success) throw new Error(res.error);
      } else if (activeTab === "personal") {
        const res = await savePersonalDetailsAction({
          heightCm: Number(personal.heightCm),
          weightKg: personal.weightKg ? Number(personal.weightKg) : null,
          bodyType: personal.bodyType || null,
          complexion: personal.complexion || null,
          religion: personal.religion,
          religiousPractice: personal.religiousPractice || null,
          communityEthnicity: personal.communityEthnicity || null,
          disabilityInfo: personal.disabilityInfo || null,
          aboutMe: personal.aboutMe || null,
        });
        if (!res.success) throw new Error(res.error);
      } else if (activeTab === "career") {
        const res = await saveCareerInfoAction({
          employmentStatus: career.employmentStatus,
          profession: career.profession,
          jobTitle: career.jobTitle || null,
          industry: career.industry || null,
          employer: career.employer || null,
          incomeCurrency: career.incomeCurrency,
          annualIncomeRange: career.annualIncomeRange || null,
          workLocation: career.workLocation || null,
          careerDescription: career.careerDescription || null,
        });
        if (!res.success) throw new Error(res.error);
      } else if (activeTab === "family") {
        const res = await saveFamilyInfoAction({
          familyType: family.familyType as FamilyType,
          familyValues: family.familyValues,
          fatherOccupation: family.fatherOccupation || null,
          motherOccupation: family.motherOccupation || null,
          brothersCount: Number(family.brothersCount),
          sistersCount: Number(family.sistersCount),
          brothersMarriedCount: Number(family.brothersMarriedCount),
          sistersMarriedCount: Number(family.sistersMarriedCount),
          familyLocation: family.familyLocation || null,
          familyBackground: family.familyBackground || null,
        });
        if (!res.success) throw new Error(res.error);
      } else if (activeTab === "lifestyle") {
        const res = await saveLifestyleInfoAction({
          dietaryHabits: lifestyle.dietaryHabits,
          smokingHabits: lifestyle.smokingHabits,
          drinkingHabits: lifestyle.drinkingHabits,
          exerciseHabits: lifestyle.exerciseHabits || null,
          livingArrangement: lifestyle.livingArrangement || null,
          hobbies: lifestyle.hobbies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          languages: lifestyle.languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          lifestyleDescription: lifestyle.lifestyleDescription || null,
        });
        if (!res.success) throw new Error(res.error);
      } else if (activeTab === "preferences") {
        const res = await savePartnerPreferencesAction({
          minAge: Number(partnerPref.minAge),
          maxAge: Number(partnerPref.maxAge),
          minHeightCm: Number(partnerPref.minHeightCm),
          maxHeightCm: Number(partnerPref.maxHeightCm),
          maritalStatus: partnerPref.maritalStatus,
          educationLevels: [],
          professions: [],
          countries: partnerPref.countries,
          cities: [],
          nationalities: [],
          religions: partnerPref.religions,
          familyTypes: [],
          lifestyles: [],
          additionalExpectations: partnerPref.additionalExpectations || null,
        });
        if (!res.success) throw new Error(res.error);
      }

      setStatusMsg({
        type: "success",
        text: "Section updated and saved successfully.",
      });
      router.refresh();
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save updates.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "basic", label: "Basic Info", icon: User },
    { id: "personal", label: "Personal Details", icon: Heart },
    { id: "career", label: "Career", icon: Briefcase },
    { id: "family", label: "Family", icon: FamilyIcon },
    { id: "lifestyle", label: "Lifestyle", icon: Smile },
    { id: "preferences", label: "Preferences", icon: Sliders },
  ];

  return (
    <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm sm:p-8">
      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E2D5] pb-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setStatusMsg(null);
                setActiveTab(t.id);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                isActive
                  ? "bg-[#14243A] text-white shadow"
                  : "bg-[#FAF8F3] text-[#777777] hover:bg-[#EEE8DC] hover:text-[#14243A]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status Notifications */}
      {statusMsg && (
        <div
          className={`my-6 flex items-start gap-3 rounded-2xl p-4 text-xs ${
            statusMsg.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          )}
          <span className="font-medium">{statusMsg.text}</span>
        </div>
      )}

      {/* Active Tab Content */}
      <div className="mt-6 space-y-6">
        {/* BASIC TAB */}
        {activeTab === "basic" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Candidate Full Name
              </label>
              <input
                type="text"
                value={basic.fullName}
                onChange={(e) => setBasic({ ...basic, fullName: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Date of Birth
              </label>
              <input
                type="date"
                value={basic.dateOfBirth}
                onChange={(e) => setBasic({ ...basic, dateOfBirth: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Marital Status
              </label>
              <select
                value={basic.maritalStatus}
                onChange={(e) => setBasic({ ...basic, maritalStatus: e.target.value as MaritalStatus })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              >
                {MARITAL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Country of Residence
              </label>
              <select
                value={basic.countryOfResidence}
                onChange={(e) => setBasic({ ...basic, countryOfResidence: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Current City
              </label>
              <input
                type="text"
                value={basic.cityOfResidence}
                onChange={(e) => setBasic({ ...basic, cityOfResidence: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Nationality
              </label>
              <input
                type="text"
                value={basic.nationality}
                onChange={(e) => setBasic({ ...basic, nationality: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>
          </div>
        )}

        {/* PERSONAL TAB */}
        {activeTab === "personal" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Height (cm)
              </label>
              <input
                type="number"
                min="120"
                max="240"
                value={personal.heightCm}
                onChange={(e) => setPersonal({ ...personal, heightCm: Number(e.target.value) })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Religion
              </label>
              <select
                value={personal.religion}
                onChange={(e) => setPersonal({ ...personal, religion: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              >
                {RELIGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#14243A]">
                About Me / Bio
              </label>
              <textarea
                rows={5}
                value={personal.aboutMe}
                onChange={(e) => setPersonal({ ...personal, aboutMe: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#E8E2D5] bg-white p-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>
          </div>
        )}

        {/* CAREER TAB */}
        {activeTab === "career" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Profession
              </label>
              <select
                value={career.profession}
                onChange={(e) => setCareer({ ...career, profession: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              >
                {PROFESSIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Job Title
              </label>
              <input
                type="text"
                value={career.jobTitle}
                onChange={(e) => setCareer({ ...career, jobTitle: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Employer (Private by default)
              </label>
              <input
                type="text"
                value={career.employer}
                onChange={(e) => setCareer({ ...career, employer: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Annual Income Range
              </label>
              <input
                type="text"
                value={career.annualIncomeRange}
                onChange={(e) => setCareer({ ...career, annualIncomeRange: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>
          </div>
        )}

        {/* FAMILY TAB */}
        {activeTab === "family" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Family Values
              </label>
              <select
                value={family.familyValues}
                onChange={(e) => setFamily({ ...family, familyValues: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              >
                <option value="Moderate">Moderate</option>
                <option value="Traditional">Traditional</option>
                <option value="Liberal / Progressive">Liberal / Progressive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Father&apos;s Occupation
              </label>
              <input
                type="text"
                value={family.fatherOccupation}
                onChange={(e) => setFamily({ ...family, fatherOccupation: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Mother&apos;s Occupation
              </label>
              <input
                type="text"
                value={family.motherOccupation}
                onChange={(e) => setFamily({ ...family, motherOccupation: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Family Location
              </label>
              <input
                type="text"
                value={family.familyLocation}
                onChange={(e) => setFamily({ ...family, familyLocation: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>
          </div>
        )}

        {/* LIFESTYLE TAB */}
        {activeTab === "lifestyle" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Dietary Habits
              </label>
              <input
                type="text"
                value={lifestyle.dietaryHabits}
                onChange={(e) => setLifestyle({ ...lifestyle, dietaryHabits: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Hobbies (comma-separated)
              </label>
              <input
                type="text"
                value={lifestyle.hobbies}
                onChange={(e) => setLifestyle({ ...lifestyle, hobbies: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>
          </div>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === "preferences" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Preferred Age Range
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="18"
                  max="80"
                  value={partnerPref.minAge}
                  onChange={(e) => setPartnerPref({ ...partnerPref, minAge: Number(e.target.value) })}
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
                <span className="text-xs text-[#777777]">to</span>
                <input
                  type="number"
                  min="18"
                  max="80"
                  value={partnerPref.maxAge}
                  onChange={(e) => setPartnerPref({ ...partnerPref, maxAge: Number(e.target.value) })}
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#14243A]">
                Additional Partner Expectations
              </label>
              <textarea
                rows={4}
                value={partnerPref.additionalExpectations}
                onChange={(e) => setPartnerPref({ ...partnerPref, additionalExpectations: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#E8E2D5] bg-white p-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 flex items-center justify-end border-t border-[#E8E2D5] pt-6">
          <Button
            type="button"
            variant="gold"
            size="md"
            onClick={handleSaveActiveSection}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Section</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

