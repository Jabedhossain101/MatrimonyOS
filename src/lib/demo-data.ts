/**
 * MatrimonyOS Demonstration & Static Sample Datasets
 * Note: All profiles and stories in this file are strictly illustrative demonstration data.
 * No real user identities, photographs, or fabricated reviews are used.
 */

export interface DemoProfile {
  id: string;
  codename: string;
  age: number;
  profession: string;
  education: string;
  location: string;
  origin: string;
  bioSnippet: string;
  values: string[];
  privacyTier: "Standard" | "Protected" | "Guardian Assisted";
  accentColor: string;
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "demo-1",
    codename: "Architectural Lead",
    age: 29,
    profession: "Senior Architectural Designer",
    education: "M.Arch, University of Bath",
    location: "London, United Kingdom",
    origin: "Dhaka, Bangladesh",
    bioSnippet:
      "Passionate about sustainable urban spaces, family traditions, and weekend literature circles. Seeking a collaborative partner with shared cultural foundations.",
    values: ["Family First", "Intellectual Curiosity", "Deen & Culture"],
    privacyTier: "Protected",
    accentColor: "#14243A",
  },
  {
    id: "demo-2",
    codename: "Biomedical Researcher",
    age: 28,
    profession: "Postdoctoral Research Fellow",
    education: "Ph.D. in Cellular Biology, McGill",
    location: "Toronto, Canada",
    origin: "Sylhet, Bangladesh",
    bioSnippet:
      "Focused on oncology therapeutics. Enjoys classical sitar, mountain trails, and balanced modern living grounded in gentle spiritual values.",
    values: ["Scientific Integrity", "Gentle Temperament", "Global Outlook"],
    privacyTier: "Guardian Assisted",
    accentColor: "#0B1728",
  },
  {
    id: "demo-3",
    codename: "Fintech Product Director",
    age: 32,
    profession: "Director of Product Management",
    education: "B.S. & MBA, Columbia University",
    location: "New York, United States",
    origin: "Chittagong, Bangladesh",
    bioSnippet:
      "Building inclusive payment systems. Values family dinners, quiet seaside retreats, and thoughtful discussions on contemporary history.",
    values: ["Mutual Respect", "Community Engagement", "Tradition"],
    privacyTier: "Standard",
    accentColor: "#B89A63",
  },
  {
    id: "demo-4",
    codename: "Clinical Pharmacist",
    age: 27,
    profession: "Lead Clinical Specialist",
    education: "Pharm.D., King's College London",
    location: "Manchester, United Kingdom",
    origin: "Rajshahi, Bangladesh",
    bioSnippet:
      "Dedicated healthcare professional who loves baking artisan sourdough, travel photography, and strong family ties across borders.",
    values: ["Compassion", "Modesty", "Continuous Learning"],
    privacyTier: "Protected",
    accentColor: "#14243A",
  },
];

export interface DemoStory {
  id: string;
  title: string;
  coupleSubtitle: string;
  corridor: string;
  year: string;
  quote: string;
  summary: string;
  journeyPoints: string[];
}

export const DEMO_STORIES: DemoStory[] = [
  {
    id: "story-london-dhaka",
    title: "Bridging Continents with Shared Purpose",
    coupleSubtitle: "Tariq & Farah (Illustrative Demo)",
    corridor: "London, UK ⇄ Dhaka, BD",
    year: "2025 Match Simulation",
    quote:
      "The privacy tiers meant our families could review compatibility at a dignified pace without public exposure.",
    summary:
      "A demonstration of how cross-border cultural compatibility and family-assisted involvement enable seamless communication between diaspora professionals and homeland roots.",
    journeyPoints: [
      "Initial connection through verified educational & value filters",
      "Guardian-coordinated introductory conversation",
      "Mutual consent granted for detailed biodata exchange",
      "Family meeting in London leading to formal engagement",
    ],
  },
  {
    id: "story-toronto-ny",
    title: "Parallel Careers, Shared Spiritual Foundations",
    coupleSubtitle: "Zayed & Sumaiya (Illustrative Demo)",
    corridor: "Toronto, CA ⇄ New York, USA",
    year: "2025 Match Simulation",
    quote:
      "Unlike mass apps, every step felt respectful, deliberate, and curated around our actual life values.",
    summary:
      "Demonstrating how North American metropolitan professionals coordinate busy careers with family involvement and shared ethical principles.",
    journeyPoints: [
      "Discovery based on balanced lifestyle and community priorities",
      "Asynchronous curated questions exchanged via secure thread",
      "In-person weekend meeting with family blessing",
      "Seamless alignment on relocated career goals",
    ],
  },
  {
    id: "story-dubai-sylhet",
    title: "Respecting Heritage with Modern Convenience",
    coupleSubtitle: "Arman & Nusrat (Illustrative Demo)",
    corridor: "Dubai, UAE ⇄ Sylhet, BD",
    year: "2025 Match Simulation",
    quote:
      "The photo-reveal consent gate gave my daughter complete peace of mind throughout the matchmaking journey.",
    summary:
      "Showcasing the peace-of-mind provided by consent-driven photograph releases and multi-currency international membership.",
    journeyPoints: [
      "Verified family representative profile creation",
      "Detailed lifestyle, deen, and dietary alignment verification",
      "Two-stage progressive photo access authorization",
      "Traditional wedding ceremony held in Sylhet",
    ],
  },
];

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category:
    | "Privacy & Safety"
    | "Matchmaking Guides"
    | "Cultural Insights"
    | "Family & Deen";
  publishedAt: string;
  readingTime: string;
  author: {
    name: string;
    role: string;
  };
  content: string[];
  keyTakeaways: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "privacy-first-matrimony-rethinking-biodata-security",
    title:
      "Privacy-First Matrimony: Why Public Directories Fail Modern Families",
    excerpt:
      "Traditional matrimonial sites treat sensitive biodata like an open catalog. Here is how modern cryptography and consent tiers restore dignity to matchmaking.",
    category: "Privacy & Safety",
    publishedAt: "October 28, 2026",
    readingTime: "5 min read",
    author: {
      name: "Sabrina Rahman",
      role: "Head of Privacy & Governance",
    },
    keyTakeaways: [
      "Public matrimonial directories expose personal data to scraping, identity theft, and unwanted solicitation.",
      "Progressive consent gates ensure photos and contact information are revealed only to approved candidates.",
      "Family guardians can participate transparently without compromising individual autonomy.",
    ],
    content: [
      "For decades, commercial matrimonial platforms operated on a flawed assumption: that finding a life partner requires broadcasting intimate personal details, contact numbers, and photographs to any stranger with an internet connection.",
      "This outdated model has created widespread anxiety among conscious individuals and families. Women in particular face persistent harassment, unauthorized distribution of photographs, and privacy violations.",
      "MatrimonyOS was conceived from an uncompromising principle: matchmaking should never come at the cost of personal dignity. By implementing zero-public-index profiles and progressive consent tiers, candidates retain full sovereignty over their identity.",
      "Under this architecture, your profile is discoverable based on core values, educational milestones, and lifestyle preferences. However, specific identifying biodata—such as current employer, family addresses, and high-resolution photographs—remains locked until both parties explicitly grant mutual consent.",
      "The result is a serene, dignified matchmaking environment where families and candidates can converse with confidence, knowing their boundaries are respected by design.",
    ],
  },
  {
    slug: "navigating-cross-border-diaspora-matchmaking",
    title:
      "Navigating Cross-Border Matchmaking: Connecting the Diaspora with Home",
    excerpt:
      "Living between London, New York, Toronto, and South Asia brings rich perspective. How modern platforms bridge cultural nuances and geographical distance.",
    category: "Cultural Insights",
    publishedAt: "October 15, 2026",
    readingTime: "6 min read",
    author: {
      name: "Dr. K. Alam",
      role: "Cultural Advisory Lead",
    },
    keyTakeaways: [
      "Second-generation diaspora professionals desire partners who understand both international careers and heritage traditions.",
      "Asynchronous guided questions help address lifestyle expectations before family travel commitments.",
      "Transparency regarding relocation, career flexibility, and cultural expectations prevents future friction.",
    ],
    content: [
      "For South Asians living in the UK, North America, and the Middle East, the search for a life partner often involves navigating dual cultural spheres. There is deep pride in heritage, language, and spiritual grounding, paired with modern professional ambitions.",
      "Traditional family networks, while deeply loving, are often geographically constrained. Meanwhile, generic western dating apps lack the context of family blessings, spiritual values, and long-term marriage intention.",
      "Cross-border matchmaking requires clear communication frameworks. What are the expectations around relocation? How will religious and festive milestones be celebrated? How do careers balance with extended family responsibilities?",
      "By structuring profile questions around these foundational pillars, MatrimonyOS removes the guesswork. Couples and families enter conversations with clarity, mutual respect, and shared intentionality.",
    ],
  },
  {
    slug: "the-art-of-family-assisted-matchmaking",
    title: "The Art of Family-Assisted Matchmaking in the Digital Age",
    excerpt:
      "Involving parents and trusted mentors shouldn't feel overbearing. Discover how co-managed profiles foster collaboration rather than conflict.",
    category: "Family & Deen",
    publishedAt: "September 30, 2026",
    readingTime: "4 min read",
    author: {
      name: "M. Farhan Chowdhury",
      role: "Product Experience Architect",
    },
    keyTakeaways: [
      "Marriage is the union of two people and the coming together of two families.",
      "Dual-role access gives candidates veto power while honoring parental guidance.",
      "Clear audit trails ensure both candidate and family remain fully aligned.",
    ],
    content: [
      "In many cultures across the world, marriage is not merely an isolated individual transaction—it is an enduring alliance of families. Parental wisdom, life experience, and prayerful guidance provide invaluable stability.",
      "Yet conventional apps force a binary choice: either complete parental control through informal intermediaries, or total isolation on swipe apps where family involvement is impossible until late in the courtship.",
      "MatrimonyOS introduces the concept of Collaborative Guardian Access. A candidate can invite a parent or elder to assist in reviewing prospective profiles, providing input, and coordinating verified family introductions.",
      "Crucially, the candidate retains absolute sovereignty: no interest can be sent or accepted without the candidate's explicit approval. This balanced synthesis honors our timeless traditions while upholding modern personal agency.",
    ],
  },
  {
    slug: "five-essential-questions-before-formal-commitment",
    title: "Five Essential Conversations to Have Before Formal Engagement",
    excerpt:
      "Beyond biodata and credentials, deep compatibility rests on shared conflict resolution, financial philosophy, and life vision.",
    category: "Matchmaking Guides",
    publishedAt: "September 12, 2026",
    readingTime: "7 min read",
    author: {
      name: "Dr. K. Alam",
      role: "Cultural Advisory Lead",
    },
    keyTakeaways: [
      "Discuss financial philosophies and expectations before emotional attachment deepens.",
      "Explore how each partner handles anger, stress, and family differences.",
      "Clarify spiritual priorities and personal evolution over the coming decade.",
    ],
    content: [
      "When evaluating a potential spouse, it is easy to focus on external milestones: university pedigree, career trajectory, and family standing. While these provide helpful context, they do not predict day-to-day matrimonial happiness.",
      "Lasting marriages are forged on alignment in values, temperament, and communication styles during moments of stress.",
      "First, discuss financial philosophy: savings vs. lifestyle, charity, family remittances, and joint budgeting. Second, explore conflict resolution: do you require immediate discussion, or do you need quiet reflection before addressing disagreements?",
      "Third, clarify spiritual and ethical goals. Fourth, address career trajectories and potential relocation. Fifth, discuss expectations surrounding elderly parent care and child-rearing philosophies.",
      "Engaging with these questions early creates a resilient bedrock for a blessed, harmonious lifelong partnership.",
    ],
  },
];

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category:
    | "Privacy & Security"
    | "How It Works"
    | "Membership & Fees"
    | "Family Involvement"
    | "Verification";
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-1",
    question: "How does MatrimonyOS protect my privacy and photographs?",
    answer:
      "Unlike traditional public directories, MatrimonyOS does not index your photographs or identifying details on public search engines. Your photos and contact details remain blurred or concealed until you explicitly approve a mutual interest request from a verified member.",
    category: "Privacy & Security",
  },
  {
    id: "faq-2",
    question: "Can my parents or guardians help manage my profile?",
    answer:
      "Yes. Our platform offers Guardian-Assisted Mode. You can link a trusted parent or guardian account with designated permissions (such as reviewing incoming interests or exchanging formal family notes), while you always retain final veto power over any interaction.",
    category: "Family Involvement",
  },
  {
    id: "faq-3",
    question: "How are profiles verified to prevent fake accounts?",
    answer:
      "We employ a multi-layered verification framework including mobile phone confirmation, official government photo ID validation (NID / Passport), and LinkedIn / institutional credential checks. Verified members receive distinct verification badges.",
    category: "Verification",
  },
  {
    id: "faq-4",
    question: "What geographical regions does MatrimonyOS currently serve?",
    answer:
      "MatrimonyOS is purpose-built for the global diaspora and homeland communities, with dedicated regional corridors across Bangladesh, the United Kingdom, the United States, Canada, Europe, and the Middle East.",
    category: "How It Works",
  },
  {
    id: "faq-5",
    question: "Is there a free membership option available?",
    answer:
      "Yes. Our Free plan allows you to create your verified profile, set partner preferences, and receive incoming interest requests. Premium and Elite tiers unlock advanced filters, priority presentation, and higher monthly interest quotas.",
    category: "Membership & Fees",
  },
  {
    id: "faq-6",
    question: "What is consent-based communication?",
    answer:
      "On MatrimonyOS, no member can message you directly or view your private contact channels without an accepted mutual interest. Both parties must confirm their willingness to communicate before any message exchange is initiated.",
    category: "Privacy & Security",
  },
  {
    id: "faq-7",
    question: "How does the matching compatibility score work?",
    answer:
      "Our algorithm evaluates structural alignment across education, religious values, dietary lifestyle, geographical mobility, and family expectations. We never replace human judgment with automated matching—we provide thoughtful recommendations for you to explore.",
    category: "How It Works",
  },
  {
    id: "faq-8",
    question: "Are memberships recurring subscriptions or one-time fees?",
    answer:
      "In upcoming phases, we will offer flexible terms with transparent quarterly and annual billing. We never employ hidden automatic renewals or predatory cancellation hurdles.",
    category: "Membership & Fees",
  },
];

export interface PricingPlan {
  id: "free" | "premium" | "elite";
  name: string;
  tagline: string;
  priceDisplay: string;
  billingPeriod: string;
  popular?: boolean;
  features: string[];
  limitations: string[];
  ctaLabel: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Standard Membership",
    tagline: "Essential verification and discovery for conscious individuals.",
    priceDisplay: "$0",
    billingPeriod: "Always Free",
    popular: false,
    ctaLabel: "Create Free Profile",
    features: [
      "Complete verified profile creation",
      "Essential partner preference filters",
      "Receive and review incoming interests",
      "Standard privacy controls (photo blur by default)",
      "Basic email notifications",
    ],
    limitations: [
      "Limited outgoing interest expressions per month",
      "Standard profile placement in discovery feeds",
      "No direct guardian co-management portal",
    ],
  },
  {
    id: "premium",
    name: "Premium Membership",
    tagline: "Full access to international corridors and enhanced discovery.",
    priceDisplay: "$29",
    billingPeriod: "per month (proposed)",
    popular: true,
    ctaLabel: "Select Premium Plan",
    features: [
      "All Standard features included",
      "Unlimited global corridor discovery filters",
      "Up to 25 verified interest expressions monthly",
      "Guardian co-management & family access portal",
      "Full educational & professional verification badge",
      "Priority customer concierge assistance",
    ],
    limitations: ["Standard concierge response time (within 24 hours)"],
  },
  {
    id: "elite",
    name: "Elite Membership",
    tagline: "Discreet, high-touch matchmaking for discerning families.",
    priceDisplay: "$79",
    billingPeriod: "per month (proposed)",
    popular: false,
    ctaLabel: "Inquire for Elite",
    features: [
      "All Premium features included",
      "Maximum discreet privacy (completely invisible discovery mode)",
      "Unlimited interest expressions across all countries",
      "Dedicated MatrimonyOS family matchmaker consultation",
      "Hand-curated monthly introductions based on deep values",
      "Priority verification for all family members",
      "VIP Concierge direct communication line",
    ],
    limitations: [],
  },
];
