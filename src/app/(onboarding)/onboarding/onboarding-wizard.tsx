"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  saveBasicInfoAction,
  savePersonalDetailsAction,
  saveEducationsAction,
  saveCareerInfoAction,
  saveFamilyInfoAction,
  saveLifestyleInfoAction,
  savePartnerPreferencesAction,
} from "@/server/actions/profile.actions";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  User,
  Heart,
  GraduationCap,
  Briefcase,
  Users,
  Smile,
  Sliders,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import type { CompleteProfile } from "@/server/utils/privacy";
import type { ProfileFor, Gender, MaritalStatus, FamilyType } from "@/generated/prisma";

const MAX_ADULT_DATE = new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000)
  .toISOString()
  .split("T")[0];

// Reference data
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
  "Judaism",
  "Spiritual",
  "Other",
];

const RELIGIOUS_PRACTICES = [
  "Very Practicing",
  "Moderately Practicing",
  "Practicing / Pray Regularly",
  "Cultural / Progressive",
  "Non-Practicing",
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
  "Data Scientist / AI Specialist",
  "Creative / Designer",
  "Pharmacist",
  "Researcher / Scientist",
  "Student / Postgraduate",
  "Other",
];

const EDUCATION_LEVELS = [
  "Doctorate / PhD",
  "Master's Degree (MS/MA/MBA/MSc)",
  "Bachelor's Degree (BS/BA/BSc/BBA)",
  "Medical Degree (MBBS/MD/BDS)",
  "Law Degree (LLB/JD/LLM)",
  "Engineering Degree (BEng/BTech)",
  "Associate Degree / Diploma",
  "Higher Secondary (A-Levels/HSC)",
  "Secondary School (O-Levels/SSC)",
  "Other Professional Qualification",
];

const CURRENCIES = ["USD", "GBP", "EUR", "CAD", "AUD", "BDT", "AED", "SAR", "QAR"];

const INCOME_RANGES = [
  "Under $25,000",
  "$25,000 - $50,000",
  "$50,000 - $75,000",
  "$75,000 - $100,000",
  "$100,000 - $150,000",
  "$150,000 - $200,000",
  "$200,000 - $300,000",
  "$300,000+",
  "Prefer not to disclose",
];

const DIETARY_OPTIONS = [
  "Strictly Halal",
  "Halal & Kosher",
  "Vegetarian",
  "Non-Vegetarian",
  "Vegan",
  "Other",
];

const SMOKING_OPTIONS = ["Non-Smoker", "Occasionally", "Smoker"];
const DRINKING_OPTIONS = ["Non-Drinker", "Occasionally / Socially", "Drinker"];

const MARITAL_STATUS_OPTIONS = [
  { value: "NEVER_MARRIED", label: "Never Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
  { value: "SEPARATED", label: "Separated" },
  { value: "ANNULLED", label: "Annulled" },
];

const PROFILE_FOR_OPTIONS = [
  { value: "SELF", label: "Myself" },
  { value: "SON", label: "My Son" },
  { value: "DAUGHTER", label: "My Daughter" },
  { value: "BROTHER", label: "My Brother" },
  { value: "SISTER", label: "My Sister" },
  { value: "RELATIVE", label: "My Relative" },
  { value: "FRIEND", label: "My Friend" },
];

interface OnboardingWizardProps {
  initialProfile: CompleteProfile;
}

export function OnboardingWizard({ initialProfile }: OnboardingWizardProps) {
  const router = useRouter();

  // Wizard Step State (1 to 7)
  const [currentStep, setCurrentStep] = React.useState<number>(
    Math.min(7, Math.max(1, initialProfile.onboardingStep || 1))
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [completion, setCompletion] = React.useState<number>(
    initialProfile.completionPercentage || 0
  );

  // Form State: Step 1 (Basic)
  const [step1, setStep1] = React.useState({
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

  // Form State: Step 2 (Personal)
  const [step2, setStep2] = React.useState({
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

  // Form State: Step 3 (Education)
  const [educations, setEducations] = React.useState(
    initialProfile.educations && initialProfile.educations.length > 0
      ? initialProfile.educations.map((e) => ({
          educationLevel: e.educationLevel,
          degree: e.degree,
          fieldOfStudy: e.fieldOfStudy,
          institution: e.institution,
          country: e.country,
          graduationYear: e.graduationYear,
          additionalQualifications: e.additionalQualifications || "",
          isHighest: e.isHighest,
        }))
      : [
          {
            educationLevel: "Bachelor's Degree (BS/BA/BSc/BBA)",
            degree: "Bachelor of Science",
            fieldOfStudy: "Computer Science",
            institution: "",
            country: "United Kingdom",
            graduationYear: 2020,
            additionalQualifications: "",
            isHighest: true,
          },
        ]
  );

  // Form State: Step 4 (Career)
  const [step4, setStep4] = React.useState({
    employmentStatus: initialProfile.employmentStatus || "Employed Full-Time",
    profession: initialProfile.profession || "Software Engineer / Tech",
    jobTitle: initialProfile.jobTitle || "",
    industry: initialProfile.industry || "Information Technology",
    employer: initialProfile.employer || "",
    incomeCurrency: initialProfile.incomeCurrency || "GBP",
    annualIncomeRange: initialProfile.annualIncomeRange || "$75,000 - $100,000",
    workLocation: initialProfile.workLocation || "",
    careerDescription: initialProfile.careerDescription || "",
  });

  // Form State: Step 5 (Family)
  const [step5, setStep5] = React.useState({
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

  // Form State: Step 6 (Lifestyle)
  const [step6, setStep6] = React.useState({
    dietaryHabits: initialProfile.dietaryHabits || "Strictly Halal",
    smokingHabits: initialProfile.smokingHabits || "Non-Smoker",
    drinkingHabits: initialProfile.drinkingHabits || "Non-Drinker",
    exerciseHabits: initialProfile.exerciseHabits || "Regular (3-4 times/week)",
    livingArrangement: initialProfile.livingArrangement || "Lives with Family",
    hobbies: initialProfile.hobbies || ["Reading", "Travel", "Fitness"],
    languages: initialProfile.languages || ["English", "Bengali"],
    lifestyleDescription: initialProfile.lifestyleDescription || "",
  });

  // Form State: Step 7 (Partner Preferences)
  const pref = initialProfile.partnerPreference;
  const [step7, setStep7] = React.useState({
    minAge: pref?.minAge ?? 22,
    maxAge: pref?.maxAge ?? 32,
    minHeightCm: pref?.minHeightCm ?? 155,
    maxHeightCm: pref?.maxHeightCm ?? 185,
    maritalStatus: pref?.maritalStatus?.length ? pref.maritalStatus : ["NEVER_MARRIED"],
    educationLevels: pref?.educationLevels || [],
    professions: pref?.professions || [],
    countries: pref?.countries?.length ? pref.countries : ["United Kingdom"],
    cities: pref?.cities || [],
    nationalities: pref?.nationalities || [],
    religions: pref?.religions?.length ? pref.religions : ["Islam"],
    familyTypes: pref?.familyTypes || [],
    lifestyles: pref?.lifestyles || [],
    additionalExpectations: pref?.additionalExpectations || "",
  });

  // Steps Configuration
  const stepsConfig = [
    { number: 1, title: "Basic Info", icon: User },
    { number: 2, title: "Personal Details", icon: Heart },
    { number: 3, title: "Education", icon: GraduationCap },
    { number: 4, title: "Career", icon: Briefcase },
    { number: 5, title: "Family", icon: Users },
    { number: 6, title: "Lifestyle", icon: Smile },
    { number: 7, title: "Preferences", icon: Sliders },
  ];

  // Handlers for Step Transitions
  const handleNext = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (currentStep === 1) {
        // Validate & Save Step 1
        const res = await saveBasicInfoAction({
          profileFor: step1.profileFor as ProfileFor,
          fullName: step1.fullName,
          dateOfBirth: step1.dateOfBirth,
          gender: step1.gender as Gender,
          maritalStatus: step1.maritalStatus as MaritalStatus,
          countryOfResidence: step1.countryOfResidence,
          cityOfResidence: step1.cityOfResidence,
          nationality: step1.nationality,
          preferredLanguage: step1.preferredLanguage,
        });
        if (!res.success) throw new Error(res.error);
        const d = res.data as { completionPercentage?: number } | undefined;
        if (d?.completionPercentage) setCompletion(d.completionPercentage);
      } else if (currentStep === 2) {
        // Validate & Save Step 2
        const res = await savePersonalDetailsAction({
          heightCm: Number(step2.heightCm),
          weightKg: step2.weightKg ? Number(step2.weightKg) : null,
          bodyType: step2.bodyType || null,
          complexion: step2.complexion || null,
          religion: step2.religion,
          religiousPractice: step2.religiousPractice || null,
          communityEthnicity: step2.communityEthnicity || null,
          disabilityInfo: step2.disabilityInfo || null,
          aboutMe: step2.aboutMe || null,
        });
        if (!res.success) throw new Error(res.error);
        const d = res.data as { completionPercentage?: number } | undefined;
        if (d?.completionPercentage) setCompletion(d.completionPercentage);
      } else if (currentStep === 3) {
        // Validate & Save Step 3
        const res = await saveEducationsAction({
          educations: educations.map((e) => ({
            educationLevel: e.educationLevel,
            degree: e.degree,
            fieldOfStudy: e.fieldOfStudy,
            institution: e.institution,
            country: e.country,
            graduationYear: Number(e.graduationYear),
            additionalQualifications: e.additionalQualifications || null,
            isHighest: e.isHighest,
          })),
        });
        if (!res.success) throw new Error(res.error);
      } else if (currentStep === 4) {
        // Validate & Save Step 4
        const res = await saveCareerInfoAction({
          employmentStatus: step4.employmentStatus,
          profession: step4.profession,
          jobTitle: step4.jobTitle || null,
          industry: step4.industry || null,
          employer: step4.employer || null,
          incomeCurrency: step4.incomeCurrency,
          annualIncomeRange: step4.annualIncomeRange || null,
          workLocation: step4.workLocation || null,
          careerDescription: step4.careerDescription || null,
        });
        if (!res.success) throw new Error(res.error);
        const d = res.data as { completionPercentage?: number } | undefined;
        if (d?.completionPercentage) setCompletion(d.completionPercentage);
      } else if (currentStep === 5) {
        // Validate & Save Step 5
        const res = await saveFamilyInfoAction({
          familyType: step5.familyType as FamilyType,
          familyValues: step5.familyValues,
          fatherOccupation: step5.fatherOccupation || null,
          motherOccupation: step5.motherOccupation || null,
          brothersCount: Number(step5.brothersCount),
          sistersCount: Number(step5.sistersCount),
          brothersMarriedCount: Number(step5.brothersMarriedCount),
          sistersMarriedCount: Number(step5.sistersMarriedCount),
          familyLocation: step5.familyLocation || null,
          familyBackground: step5.familyBackground || null,
        });
        if (!res.success) throw new Error(res.error);
        const d = res.data as { completionPercentage?: number } | undefined;
        if (d?.completionPercentage) setCompletion(d.completionPercentage);
      } else if (currentStep === 6) {
        // Validate & Save Step 6
        const res = await saveLifestyleInfoAction({
          dietaryHabits: step6.dietaryHabits,
          smokingHabits: step6.smokingHabits,
          drinkingHabits: step6.drinkingHabits,
          exerciseHabits: step6.exerciseHabits || null,
          livingArrangement: step6.livingArrangement || null,
          hobbies: step6.hobbies,
          languages: step6.languages,
          lifestyleDescription: step6.lifestyleDescription || null,
        });
        if (!res.success) throw new Error(res.error);
        const d = res.data as { completionPercentage?: number } | undefined;
        if (d?.completionPercentage) setCompletion(d.completionPercentage);
      } else if (currentStep === 7) {
        // Validate & Save Step 7 (Final Step)
        const res = await savePartnerPreferencesAction({
          minAge: step7.minAge ? Number(step7.minAge) : null,
          maxAge: step7.maxAge ? Number(step7.maxAge) : null,
          minHeightCm: step7.minHeightCm ? Number(step7.minHeightCm) : null,
          maxHeightCm: step7.maxHeightCm ? Number(step7.maxHeightCm) : null,
          maritalStatus: step7.maritalStatus,
          educationLevels: step7.educationLevels,
          professions: step7.professions,
          countries: step7.countries,
          cities: step7.cities,
          nationalities: step7.nationalities,
          religions: step7.religions,
          familyTypes: step7.familyTypes,
          lifestyles: step7.lifestyles,
          additionalExpectations: step7.additionalExpectations || null,
        });
        if (!res.success) throw new Error(res.error);

        // Completion achieved, redirect to photo upload or dashboard
        router.push("/dashboard?onboarding=complete");
        router.refresh();
        return;
      }

      // Advance step
      if (currentStep < 7) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Please verify your input and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setErrorMsg(null);
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Helper for adding/removing education items
  const addEducation = () => {
    setEducations((prev) => [
      ...prev,
      {
        educationLevel: "Master's Degree (MS/MA/MBA/MSc)",
        degree: "",
        fieldOfStudy: "",
        institution: "",
        country: step1.countryOfResidence || "United Kingdom",
        graduationYear: new Date().getFullYear(),
        additionalQualifications: "",
        isHighest: false,
      },
    ]);
  };

  const removeEducation = (index: number) => {
    if (educations.length <= 1) {
      setErrorMsg("Please keep at least one education record.");
      return;
    }
    setEducations((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Top Progress Header */}
      <div className="mb-8 rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B89A63]/15 px-3 py-1 text-xs font-semibold text-[#B89A63]">
              <Sparkles className="h-3.5 w-3.5" />
              Profile Onboarding
            </span>
            <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#14243A]">
              Step {currentStep} of 7: {stepsConfig[currentStep - 1].title}
            </h1>
            <p className="mt-1 text-xs text-[#777777]">
              Provide verified details to build your discreet, trustworthy profile.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-[#777777]">Profile Strength</span>
              <p className="font-serif text-xl font-bold text-[#14243A]">
                {completion}%
              </p>
            </div>
            <div className="h-10 w-24 overflow-hidden rounded-full bg-[#FAF8F3] p-1 border border-[#E8E2D5]">
              <div
                className="h-full rounded-full bg-[#B89A63] transition-all duration-500"
                style={{ width: `${Math.max(10, completion)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Indicator Badges */}
        <div className="mt-6 grid grid-cols-7 gap-1 sm:gap-2">
          {stepsConfig.map((s) => {
            const isDone = s.number < currentStep;
            const isCurrent = s.number === currentStep;

            return (
              <button
                key={s.number}
                type="button"
                onClick={() => {
                  if (s.number <= currentStep) setCurrentStep(s.number);
                }}
                disabled={s.number > currentStep}
                className={`group flex flex-col items-center gap-1.5 rounded-xl py-2.5 transition ${
                  isCurrent
                    ? "bg-[#14243A] text-white shadow"
                    : isDone
                      ? "bg-[#FAF8F3] text-[#B89A63] hover:bg-[#EEE8DC]"
                      : "cursor-not-allowed bg-transparent text-[#777777]/40"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                    isCurrent
                      ? "bg-[#B89A63] text-white"
                      : isDone
                        ? "bg-[#B89A63]/20 text-[#B89A63]"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.number}
                </div>
                <span className="hidden text-[10px] font-medium sm:inline">
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Step Forms */}
      <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm sm:p-8">
        {/* ================= STEP 1: BASIC INFORMATION ================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8E2D5] pb-4">
              <h2 className="font-serif text-xl font-bold text-[#14243A]">
                Basic Identity & Background
              </h2>
              <p className="mt-1 text-xs text-[#777777]">
                Identity-critical fields. MatrimonyOS enforces a strict minimum age of 18.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Profile Created For *
                </label>
                <select
                  value={step1.profileFor}
                  onChange={(e) => setStep1({ ...step1, profileFor: e.target.value as ProfileFor })}
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                >
                  {PROFILE_FOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Candidate Full Name *
                </label>
                <input
                  type="text"
                  value={step1.fullName}
                  onChange={(e) => setStep1({ ...step1, fullName: e.target.value })}
                  placeholder="e.g. Dr. Tariq Rahman"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Date of Birth (Must be 18+) *
                </label>
                <input
                  type="date"
                  value={step1.dateOfBirth}
                  onChange={(e) => setStep1({ ...step1, dateOfBirth: e.target.value })}
                  max={MAX_ADULT_DATE}
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
                <span className="mt-1 block text-[10px] text-[#777777]">
                  Your exact birthdate is kept private by default. Only your age is displayed.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Gender *
                </label>
                <select
                  value={step1.gender}
                  onChange={(e) => setStep1({ ...step1, gender: e.target.value as Gender })}
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                >
                  <option value="MALE">Male (Groom)</option>
                  <option value="FEMALE">Female (Bride)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Marital Status *
                </label>
                <select
                  value={step1.maritalStatus}
                  onChange={(e) =>
                    setStep1({ ...step1, maritalStatus: e.target.value as MaritalStatus })
                  }
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
                  Country of Residence *
                </label>
                <select
                  value={step1.countryOfResidence}
                  onChange={(e) =>
                    setStep1({ ...step1, countryOfResidence: e.target.value })
                  }
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
                  Current City *
                </label>
                <input
                  type="text"
                  value={step1.cityOfResidence}
                  onChange={(e) =>
                    setStep1({ ...step1, cityOfResidence: e.target.value })
                  }
                  placeholder="e.g. London, Toronto, Dhaka, New York"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Nationality *
                </label>
                <input
                  type="text"
                  value={step1.nationality}
                  onChange={(e) => setStep1({ ...step1, nationality: e.target.value })}
                  placeholder="e.g. British, Bangladeshi, American"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Preferred Mother Tongue / Language *
                </label>
                <input
                  type="text"
                  value={step1.preferredLanguage}
                  onChange={(e) =>
                    setStep1({ ...step1, preferredLanguage: e.target.value })
                  }
                  placeholder="e.g. English, Bengali, Urdu"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PERSONAL DETAILS ================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8E2D5] pb-4">
              <h2 className="font-serif text-xl font-bold text-[#14243A]">
                Personal Attributes & Background
              </h2>
              <p className="mt-1 text-xs text-[#777777]">
                Share details about your lifestyle, spiritual outlook, and personality.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Height (cm) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="120"
                    max="240"
                    value={step2.heightCm}
                    onChange={(e) =>
                      setStep2({ ...step2, heightCm: Number(e.target.value) })
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                  />
                  <span className="text-xs font-medium text-[#777777] shrink-0">
                    {Math.floor(step2.heightCm / 30.48)}&apos;
                    {Math.round((step2.heightCm % 30.48) / 2.54)}&quot;
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Weight (kg) - Optional
                </label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={step2.weightKg}
                  onChange={(e) => setStep2({ ...step2, weightKg: e.target.value })}
                  placeholder="e.g. 70"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Religion *
                </label>
                <select
                  value={step2.religion}
                  onChange={(e) => setStep2({ ...step2, religion: e.target.value })}
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                >
                  {RELIGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Religious Practice
                </label>
                <select
                  value={step2.religiousPractice}
                  onChange={(e) =>
                    setStep2({ ...step2, religiousPractice: e.target.value })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                >
                  {RELIGIOUS_PRACTICES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Community / Ethnicity
                </label>
                <input
                  type="text"
                  value={step2.communityEthnicity}
                  onChange={(e) =>
                    setStep2({ ...step2, communityEthnicity: e.target.value })
                  }
                  placeholder="e.g. Bengali Sunni, Sylheti, Punjabi"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Disability Information (Strictly Confidential)
                </label>
                <input
                  type="text"
                  value={step2.disabilityInfo}
                  onChange={(e) =>
                    setStep2({ ...step2, disabilityInfo: e.target.value })
                  }
                  placeholder="None, or detail any physical condition"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
                <span className="text-[10px] text-[#777777]">
                  Never shown publicly. Used solely for sensitive mutual consent.
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#14243A]">
                  About Me / Personal Bio *
                </label>
                <textarea
                  rows={4}
                  value={step2.aboutMe}
                  onChange={(e) => setStep2({ ...step2, aboutMe: e.target.value })}
                  placeholder="Tell prospective families about yourself, your worldview, passions, values, and vision for marriage..."
                  className="mt-1 w-full rounded-xl border border-[#E8E2D5] bg-white p-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
                <span className="text-[10px] text-[#777777]">
                  Min 10 characters. A thoughtful, articulate introduction significantly increases quality matches.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: EDUCATION ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#14243A]">
                  Educational Qualifications
                </h2>
                <p className="mt-1 text-xs text-[#777777]">
                  Add your university degrees, diplomas, or professional certifications.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEducation}
                className="gap-1.5 border-[#B89A63] text-[#B89A63] hover:bg-[#B89A63]/10"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Degree</span>
              </Button>
            </div>

            <div className="space-y-6">
              {educations.map((edu, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-5 transition hover:border-[#B89A63]/50"
                >
                  <div className="mb-4 flex items-center justify-between border-b border-[#E8E2D5]/70 pb-2">
                    <span className="text-xs font-bold tracking-wider text-[#14243A] uppercase">
                      Degree Record #{idx + 1}
                    </span>
                    {educations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEducation(idx)}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#14243A]">
                        Education Level *
                      </label>
                      <select
                        value={edu.educationLevel}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[idx].educationLevel = e.target.value;
                          setEducations(updated);
                        }}
                        className="mt-1 h-10 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                      >
                        {EDUCATION_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#14243A]">
                        Degree Title *
                      </label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[idx].degree = e.target.value;
                          setEducations(updated);
                        }}
                        placeholder="e.g. BEng in Software Engineering"
                        className="mt-1 h-10 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#14243A]">
                        Field of Study / Major *
                      </label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[idx].fieldOfStudy = e.target.value;
                          setEducations(updated);
                        }}
                        placeholder="e.g. Computer Science, Medicine, Law"
                        className="mt-1 h-10 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#14243A]">
                        University / Institution *
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[idx].institution = e.target.value;
                          setEducations(updated);
                        }}
                        placeholder="e.g. Imperial College London, BUET, Toronto"
                        className="mt-1 h-10 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#14243A]">
                        Country of Study *
                      </label>
                      <select
                        value={edu.country}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[idx].country = e.target.value;
                          setEducations(updated);
                        }}
                        className="mt-1 h-10 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
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
                        Graduation Year *
                      </label>
                      <input
                        type="number"
                        min="1960"
                        max="2035"
                        value={edu.graduationYear}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[idx].graduationYear = Number(e.target.value);
                          setEducations(updated);
                        }}
                        className="mt-1 h-10 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= STEP 4: CAREER ================= */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8E2D5] pb-4">
              <h2 className="font-serif text-xl font-bold text-[#14243A]">
                Career & Professional Background
              </h2>
              <p className="mt-1 text-xs text-[#777777]">
                Income and employer information remain private by default and protected under your privacy controls.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Employment Status *
                </label>
                <select
                  value={step4.employmentStatus}
                  onChange={(e) =>
                    setStep4({ ...step4, employmentStatus: e.target.value })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                >
                  <option value="Employed Full-Time">Employed Full-Time</option>
                  <option value="Employed Part-Time">Employed Part-Time</option>
                  <option value="Self-Employed / Freelancer">
                    Self-Employed / Freelancer
                  </option>
                  <option value="Business Owner / Founder">
                    Business Owner / Founder
                  </option>
                  <option value="Postgraduate / Medical Resident">
                    Postgraduate / Medical Resident
                  </option>
                  <option value="Not Currently Employed">
                    Not Currently Employed
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Profession Category *
                </label>
                <select
                  value={step4.profession}
                  onChange={(e) => setStep4({ ...step4, profession: e.target.value })}
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
                  value={step4.jobTitle}
                  onChange={(e) => setStep4({ ...step4, jobTitle: e.target.value })}
                  placeholder="e.g. Senior Cloud Architect, Consultant Physician"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Industry / Sector
                </label>
                <input
                  type="text"
                  value={step4.industry}
                  onChange={(e) => setStep4({ ...step4, industry: e.target.value })}
                  placeholder="e.g. Technology, Healthcare, Financial Services"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Employer / Company (Private by Default)
                </label>
                <input
                  type="text"
                  value={step4.employer}
                  onChange={(e) => setStep4({ ...step4, employer: e.target.value })}
                  placeholder="e.g. Google, NHS, Deloitte (Hidden from public)"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-[#14243A]">
                    Currency
                  </label>
                  <select
                    value={step4.incomeCurrency}
                    onChange={(e) =>
                      setStep4({ ...step4, incomeCurrency: e.target.value })
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-2 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#14243A]">
                    Annual Income Range
                  </label>
                  <select
                    value={step4.annualIncomeRange}
                    onChange={(e) =>
                      setStep4({ ...step4, annualIncomeRange: e.target.value })
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                  >
                    {INCOME_RANGES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: FAMILY ================= */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8E2D5] pb-4">
              <h2 className="font-serif text-xl font-bold text-[#14243A]">
                Family Structure & Values
              </h2>
              <p className="mt-1 text-xs text-[#777777]">
                Family harmony is essential in traditional matchmaking. All sensitive family details are privacy-protected.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Family Type *
                </label>
                <select
                  value={step5.familyType}
                  onChange={(e) =>
                    setStep5({ ...step5, familyType: e.target.value as FamilyType })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                >
                  <option value="NUCLEAR">Nuclear Family</option>
                  <option value="JOINT">Joint Family</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Family Values *
                </label>
                <select
                  value={step5.familyValues}
                  onChange={(e) => setStep5({ ...step5, familyValues: e.target.value })}
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
                  value={step5.fatherOccupation}
                  onChange={(e) =>
                    setStep5({ ...step5, fatherOccupation: e.target.value })
                  }
                  placeholder="e.g. Retired Government Officer, Businessman"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Mother&apos;s Occupation
                </label>
                <input
                  type="text"
                  value={step5.motherOccupation}
                  onChange={(e) =>
                    setStep5({ ...step5, motherOccupation: e.target.value })
                  }
                  placeholder="e.g. Homemaker, Professor, Doctor"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Brothers Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={step5.brothersCount}
                  onChange={(e) =>
                    setStep5({ ...step5, brothersCount: Number(e.target.value) })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Sisters Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={step5.sistersCount}
                  onChange={(e) =>
                    setStep5({ ...step5, sistersCount: Number(e.target.value) })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#14243A]">
                  Family Background Overview
                </label>
                <textarea
                  rows={3}
                  value={step5.familyBackground}
                  onChange={(e) =>
                    setStep5({ ...step5, familyBackground: e.target.value })
                  }
                  placeholder="Briefly describe your family roots, cultural traditions, ancestral hometown, and lifestyle..."
                  className="mt-1 w-full rounded-xl border border-[#E8E2D5] bg-white p-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 6: LIFESTYLE ================= */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8E2D5] pb-4">
              <h2 className="font-serif text-xl font-bold text-[#14243A]">
                Habits & Everyday Lifestyle
              </h2>
              <p className="mt-1 text-xs text-[#777777]">
                Clear lifestyle expectations avoid misunderstandings down the road.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Dietary Habits *
                </label>
                <select
                  value={step6.dietaryHabits}
                  onChange={(e) =>
                    setStep6({ ...step6, dietaryHabits: e.target.value })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                >
                  {DIETARY_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Smoking Habits *
                </label>
                <select
                  value={step6.smokingHabits}
                  onChange={(e) =>
                    setStep6({ ...step6, smokingHabits: e.target.value })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                >
                  {SMOKING_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Drinking Habits *
                </label>
                <select
                  value={step6.drinkingHabits}
                  onChange={(e) =>
                    setStep6({ ...step6, drinkingHabits: e.target.value })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                >
                  {DRINKING_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Exercise Habits
                </label>
                <input
                  type="text"
                  value={step6.exerciseHabits}
                  onChange={(e) =>
                    setStep6({ ...step6, exerciseHabits: e.target.value })
                  }
                  placeholder="e.g. Gym 4 days a week, Running, Swimming"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#14243A]">
                  Hobbies & Interests (comma-separated)
                </label>
                <input
                  type="text"
                  value={step6.hobbies.join(", ")}
                  onChange={(e) =>
                    setStep6({
                      ...step6,
                      hobbies: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g. Hiking, Culinary Arts, Classical Music, Photography, Traveling"
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 7: PARTNER PREFERENCES ================= */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8E2D5] pb-4">
              <h2 className="font-serif text-xl font-bold text-[#14243A]">
                Partner Preferences & Expectations
              </h2>
              <p className="mt-1 text-xs text-[#777777]">
                Define your core expectations so we can highlight compatible profiles.
              </p>
            </div>

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
                    value={step7.minAge}
                    onChange={(e) =>
                      setStep7({ ...step7, minAge: Number(e.target.value) })
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                  />
                  <span className="text-xs text-[#777777]">to</span>
                  <input
                    type="number"
                    min="18"
                    max="80"
                    value={step7.maxAge}
                    onChange={(e) =>
                      setStep7({ ...step7, maxAge: Number(e.target.value) })
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Preferred Height Range (cm)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="120"
                    max="240"
                    value={step7.minHeightCm}
                    onChange={(e) =>
                      setStep7({ ...step7, minHeightCm: Number(e.target.value) })
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                  />
                  <span className="text-xs text-[#777777]">to</span>
                  <input
                    type="number"
                    min="120"
                    max="240"
                    value={step7.maxHeightCm}
                    onChange={(e) =>
                      setStep7({ ...step7, maxHeightCm: Number(e.target.value) })
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#14243A]">
                  Acceptable Marital Statuses
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MARITAL_STATUS_OPTIONS.map((opt) => {
                    const isChecked = step7.maritalStatus.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          const updated = isChecked
                            ? step7.maritalStatus.filter((s) => s !== opt.value)
                            : [...step7.maritalStatus, opt.value];
                          setStep7({ ...step7, maritalStatus: updated });
                        }}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                          isChecked
                            ? "border-[#B89A63] bg-[#B89A63]/15 text-[#14243A]"
                            : "border-[#E8E2D5] bg-white text-[#777777] hover:border-[#B89A63]/40"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Preferred Country of Residence
                </label>
                <select
                  value={step7.countries[0] || "United Kingdom"}
                  onChange={(e) =>
                    setStep7({ ...step7, countries: [e.target.value] })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                >
                  <option value="Any Country">Any Country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243A]">
                  Preferred Religion
                </label>
                <select
                  value={step7.religions[0] || "Islam"}
                  onChange={(e) =>
                    setStep7({ ...step7, religions: [e.target.value] })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                >
                  <option value="Any Religion">Any Religion</option>
                  {RELIGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#14243A]">
                  Additional Expectations & Values
                </label>
                <textarea
                  rows={4}
                  value={step7.additionalExpectations}
                  onChange={(e) =>
                    setStep7({ ...step7, additionalExpectations: e.target.value })
                  }
                  placeholder="Detail any specific qualities, educational goals, relocation preferences, or personal ethics you value most in a partner..."
                  className="mt-1 w-full rounded-xl border border-[#E8E2D5] bg-white p-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-[#E8E2D5] pt-6">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handlePrev}
            disabled={currentStep === 1 || isSubmitting}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <Button
            type="button"
            variant="gold"
            size="md"
            onClick={handleNext}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Progress...</span>
              </>
            ) : currentStep === 7 ? (
              <>
                <span>Complete Onboarding</span>
                <CheckCircle2 className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Save & Continue</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
