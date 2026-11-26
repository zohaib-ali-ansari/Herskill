import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Gift,
  Menu,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import heroCreatorImg from '../../assets/hero-creator.jpg';

const CATEGORIES = [
  {
    id: '01',
    title: 'Crochet',
    desc: 'Handmade bags, cozy accessories, floral bouquets, and bespoke knitwear crafted with care.',
    bg: 'bg-[#f8e5ed]',
    emoji: '🧶',
    serviceText: 'Order custom crochet pieces or launch your own handmade studio.',
  },
  {
    id: '02',
    title: 'Stitching & Clothing',
    desc: 'Custom-fitted outfits, bridal & everyday tailoring, alterations, and boutique dressmaking.',
    bg: 'bg-[#f4e9cb]',
    emoji: '🧵',
    serviceText: 'Connect with skilled seamstresses for tailored designs.',
  },
  {
    id: '03',
    title: 'Embroidery',
    desc: 'Intricate hand embroidery, personalized hoop art, heirloom linens, and detailed embellishments.',
    bg: 'bg-[#e5def4]',
    emoji: '🪡',
    serviceText: 'Discover delicate handwork made to order by verified artisans.',
  },
  {
    id: '04',
    title: 'Custom Gift Boxes',
    desc: 'Thoughtfully curated celebration hampers, bridal favors, and personalized keepsake boxes.',
    bg: 'bg-[#e0eddb]',
    emoji: '🎁',
    serviceText: 'Send memorable gifts crafted by women entrepreneurs.',
  },
];

const FEATURED_CREATORS = [
  {
    category: 'CROCHET',
    studio: "Ayesha's Crochet Studio",
    location: 'Karachi • Handmade Crochet',
    price: 'From Rs. 1,200',
    headerBg: 'bg-[#f6dce8]',
    emoji: '🧶',
  },
  {
    category: 'STITCHING',
    studio: 'Thread & Style',
    location: 'Lahore • Custom Clothing',
    price: 'From Rs. 1,500',
    headerBg: 'bg-[#f4e7ba]',
    emoji: '🧵',
  },
  {
    category: 'EMBROIDERY',
    studio: 'Needle & Bloom',
    location: 'Islamabad • Personalized Embroidery',
    price: 'From Rs. 900',
    headerBg: 'bg-[#ded7f2]',
    emoji: '🪡',
  },
  {
    category: 'GIFT BOXES',
    studio: 'Wrapped With Love',
    location: 'Karachi • Custom Gift Boxes',
    price: 'From Rs. 2,000',
    headerBg: 'bg-[#dcebd8]',
    emoji: '🎁',
  },
];

const CURRENT_YEAR = new Date().getFullYear();

export default function HomePage() {
  const { user, seller, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  const getDashboardRoute = () => {
    if (!isAuthenticated || !user) return '/login';
    if (user.roles?.includes('admin') && user.activeMode === 'admin') {
      return '/admin/dashboard';
    }
    if (user.activeMode === 'seller' && user.roles?.includes('seller')) {
      return '/seller/dashboard';
    }
    return '/buyer/dashboard';
  };

  const filteredCreators = searchQuery.trim()
    ? FEATURED_CREATORS.filter(
        (c) =>
          c.studio.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FEATURED_CREATORS;

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSent(true);
    setContactForm({ name: '', email: '', message: '' });
  };

  const isVerifiedSeller =
    user?.roles?.includes('seller') && seller?.verificationStatus === 'APPROVED';

  return (
    <div id="home" className="min-h-screen bg-[#fffaf7] text-[#49384b]">
      {/* Sticky Navbar matching Netlify reference */}
      <header className="sticky top-0 z-30 border-b border-[#eee1dc] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link to="/" aria-label="Her Skill Home">
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] font-semibold uppercase tracking-wide text-[#694d69] lg:flex">
            <a href="#home" className="transition hover:text-[#a45d81]">
              Home
            </a>
            <a href="#about" className="transition hover:text-[#a45d81]">
              About
            </a>
            <a href="#services" className="transition hover:text-[#a45d81]">
              Services
            </a>
            <a href="#explore" className="transition hover:text-[#a45d81]">
              Explore
            </a>
            <a href="#dashboard" className="transition hover:text-[#a45d81]">
              Dashboard
            </a>
            <a href="#contact" className="transition hover:text-[#a45d81]">
              Contact
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[#5a3e57] transition hover:bg-[#f8f3f7] cursor-pointer"
            >
              <Search className="h-4 w-4 text-[#a45d81]" />
              Search
            </button>

            {isAuthenticated ? (
              <Link to={getDashboardRoute()}>
                <Button variant="oliveOutline" size="sm">
                  {isVerifiedSeller ? 'Seller Studio' : 'My Dashboard'}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="oliveOutline" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-xl p-2 text-[#5a3e57] hover:bg-[#f8f3f7] lg:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Inline search bar drawer */}
        {searchOpen && (
          <div className="border-t border-[#eee1dc] bg-[#fffaf7] px-5 py-3 sm:px-8">
            <div className="mx-auto flex max-w-2xl items-center gap-2">
              <Search className="h-4 w-4 text-[#a45d81]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
                }}
                placeholder="Search handmade categories, creators, or cities (e.g., Crochet, Karachi)..."
                className="w-full bg-transparent text-sm text-[#49384b] placeholder:text-[#a18f97] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-semibold text-[#a45d81] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile navigation drawer */}
        {mobileMenuOpen && (
          <div className="space-y-4 border-t border-[#eee1dc] bg-white px-5 py-5 lg:hidden">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold uppercase tracking-wide text-[#5a3e57]">
              <a href="#home" onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-2 hover:bg-[#faf6f3]">
                Home
              </a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-2 hover:bg-[#faf6f3]">
                About
              </a>
              <a href="#services" onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-2 hover:bg-[#faf6f3]">
                Services
              </a>
              <a href="#explore" onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-2 hover:bg-[#faf6f3]">
                Explore
              </a>
              <a href="#dashboard" onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-2 hover:bg-[#faf6f3]">
                Dashboard
              </a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-2 hover:bg-[#faf6f3]">
                Contact
              </a>
            </div>
            <div className="flex flex-wrap gap-2.5 border-t border-[#eee1dc] pt-4">
              {isAuthenticated ? (
                <Link to={getDashboardRoute()} className="w-full">
                  <Button className="w-full">My Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <Button className="w-full">Create Account</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section
        className="px-5 py-14 sm:px-8 lg:px-12 lg:py-20"
        style={{
          background:
            'linear-gradient(90deg, #fffaf7 0%, #fff8f4 55%, #eee7f5 100%)',
        }}
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-[#9c8d38]">
              A Marketplace for Women&apos;s Skills
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight text-[#5a3e57] sm:text-5xl lg:text-[62px]">
              Your skill can become{' '}
              <span className="text-[#a55e81]">your opportunity.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#786b75]">
              Her Skill connects verified women creators with female customers who
              value handmade creativity, custom fashion, embroidery, and personalized
              gifts—all within a safe, women-only community.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a href="#explore">
                <Button size="lg">
                  Explore Skills
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link to={isAuthenticated ? getDashboardRoute() : '/register'}>
                <Button variant="outline" size="lg">
                  {isAuthenticated ? 'Go to My Workspace' : 'Create Your Profile'}
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-8">
              <div className="border-l-2 border-[#ddd39a] pl-4">
                <p className="text-sm font-bold text-[#5a3e57]">4 Main Categories</p>
                <p className="text-xs text-[#786b75]">Handmade &amp; creative skills</p>
              </div>
              <div className="border-l-2 border-[#ddd39a] pl-4">
                <p className="text-sm font-bold text-[#5a3e57]">Verified Sellers</p>
                <p className="text-xs text-[#786b75]">CNIC &amp; portfolio reviewed</p>
              </div>
              <div className="border-l-2 border-[#ddd39a] pl-4">
                <p className="text-sm font-bold text-[#5a3e57]">Women Focused</p>
                <p className="text-xs text-[#786b75]">One account to buy &amp; sell</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-lg">
              <div className="overflow-hidden rounded-[35px] border border-[#eadfdb] bg-[#f5eff8] shadow-[0_24px_60px_rgba(81,57,78,0.12)]">
                <img
                  src={heroCreatorImg}
                  alt="Confident woman creator holding a flower"
                  className="h-[360px] w-full object-cover object-top sm:h-[460px]"
                />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#eadfdb] bg-white/95 px-5 py-3.5 shadow-sm sm:absolute sm:-bottom-5 sm:left-6 sm:right-6 sm:mt-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e0eddb] text-[#51394e]">
                    <BadgeCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#5a3e57]">
                      Identity-Verified Creators
                    </p>
                    <p className="text-[11px] text-[#786b75]">
                      Admin-reviewed sellers with private document protection
                    </p>
                  </div>
                </div>
                <span className="hidden rounded-full bg-[#f0e8f0] px-2.5 py-1 text-[11px] font-semibold text-[#5a3e57] sm:inline-block">
                  Trusted
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Her Skill Lavender Banner */}
      <section className="bg-[#dcd5f3] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-[#968b38]">
              Why Her Skill
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-[#5a3e57] sm:text-[42px]">
              Your creativity deserves a trusted stage.
            </h2>
          </div>
          <p className="text-base leading-relaxed text-[#49384b]">
            Many women already have valuable skills—stitching, crochet, embroidery, or
            gift making. Her Skill gives those skills a verified digital space where
            they can be discovered by buyers, celebrated, and turned into steady
            income from home.
          </p>
        </div>
      </section>

      {/* What can you offer? Categories */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-[#9c8d38]">
              Skill Categories
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-[#5a3e57] sm:text-[40px]">
              What can you offer?
            </h2>
          </div>
          <a
            href="#services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#a45d81] hover:underline"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={`${cat.bg} flex min-h-[290px] flex-col justify-between rounded-[22px] p-7 transition duration-300 hover:-translate-y-1.5`}
            >
              <div className="text-5xl">{cat.emoji}</div>
              <div className="mt-6">
                <h3 className="font-display text-xl font-bold text-[#5a3e57]">
                  {cat.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#695d6a]">
                  {cat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Creator CTA Mauve Banner */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-12">
        <div className="grid items-center gap-10 rounded-[30px] bg-[#a45d81] p-8 text-white sm:p-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-[#eee69c]">
              Start Your Journey
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-[40px]">
              Turn your home-based talent into a verified studio.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90">
              Sign up in minutes, choose Seller mode, and complete our secure 4-step
              identity verification to earn your Verified Seller badge.
            </p>
            <div className="mt-7">
              <Link to={isAuthenticated ? getDashboardRoute() : '/register'}>
                <Button size="lg">
                  Build My Profile
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4 border-white/20 lg:col-span-5 lg:border-l lg:pl-10">
            <div className="flex items-start gap-4">
              <span className="font-display text-2xl font-bold text-[#e6dc8d]">01</span>
              <div>
                <h3 className="text-base font-bold">Create</h3>
                <p className="text-xs text-white/85">
                  Register one account for both buying and selling.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 border-t border-white/15 pt-4">
              <span className="font-display text-2xl font-bold text-[#e6dc8d]">02</span>
              <div>
                <h3 className="text-base font-bold">Verify &amp; Showcase</h3>
                <p className="text-xs text-white/85">
                  Submit private CNIC verification and your sample portfolio.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 border-t border-white/15 pt-4">
              <span className="font-display text-2xl font-bold text-[#e6dc8d]">03</span>
              <div>
                <h3 className="text-base font-bold">Connect</h3>
                <p className="text-xs text-white/85">
                  Earn your Verified Seller badge and grow with trusted buyers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Her Skill */}
      <section
        id="about"
        className="px-5 py-16 sm:px-8 lg:px-12 lg:py-20"
        style={{ background: 'linear-gradient(135deg, #eee8f6, #fff9f5)' }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-[#9c8d38]">
              About Her Skill
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-[#5a3e57] sm:text-5xl">
              Built for women who create with heart.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#786b75] sm:text-base">
              Every seller on Her Skill completes private identity review so buyers
              can shop with confidence and entrepreneurs can thrive safely.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-[22px] border border-[#eadfdb] bg-white p-8 shadow-sm">
              <span className="font-display text-4xl font-bold text-[#c7c54d]">01</span>
              <h3 className="mt-4 font-display text-xl font-bold text-[#5a3e57]">
                For Creators
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#786b75]">
                Showcase your crafts or services with a Verified Seller badge after
                completing our 4-step identity and business verification.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#eadfdb] bg-white p-8 shadow-sm">
              <span className="font-display text-4xl font-bold text-[#c7c54d]">02</span>
              <h3 className="mt-4 font-display text-xl font-bold text-[#5a3e57]">
                For Customers
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#786b75]">
                Join as a Buyer in seconds, verify your email or phone, and switch to
                Seller mode anytime without creating a second account.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#eadfdb] bg-white p-8 shadow-sm">
              <span className="font-display text-4xl font-bold text-[#c7c54d]">03</span>
              <h3 className="mt-4 font-display text-xl font-bold text-[#5a3e57]">
                Private &amp; Secure
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#786b75]">
                CNIC documents are encrypted and stored privately—accessible strictly
                to authorized administrators during verification review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-[#9c8d38]">
              Our Services
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-[#5a3e57] sm:text-[40px]">
              Four skills. One platform.
            </h2>
          </div>
          <Link to="/register">
            <Button variant="oliveOutline" size="sm">
              Join as a Seller
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={`${cat.bg} flex flex-col justify-between rounded-[22px] p-7`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-bold text-[#5a3e57]">
                    {cat.id}
                  </span>
                  <span className="text-3xl">{cat.emoji}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-[#5a3e57]">
                  {cat.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#695d6a]">
                  {cat.serviceText}
                </p>
              </div>
              <a
                href="#explore"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#5a3e57] hover:text-[#a45d81]"
              >
                Find a Creator
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Explore Creators Section */}
      <section id="explore" className="bg-white px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-[#9c8d38]">
              Explore Creators
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-[#5a3e57] sm:text-[40px]">
              Find someone who can make it.
            </h2>
            <p className="mt-2 text-sm text-[#786b75]">
              Preview featured creator categories—full marketplace listings unlock
              next after seller onboarding.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredCreators.map((creator) => (
              <div
                key={creator.studio}
                className="overflow-hidden rounded-[20px] border border-[#eadfdb] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className={`${creator.headerBg} flex h-44 items-center justify-center text-6xl`}
                >
                  {creator.emoji}
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-[#9c8d38]">
                    {creator.category}
                  </span>
                  <h3 className="mt-1 font-display text-lg font-bold text-[#5a3e57]">
                    {creator.studio}
                  </h3>
                  <p className="mt-1 text-xs text-[#786b75]">{creator.location}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-[#eee1dc] pt-3">
                    <span className="text-xs font-bold text-[#5a3e57]">
                      {creator.price}
                    </span>
                    <Link
                      to={isAuthenticated ? getDashboardRoute() : '/register'}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#a45d81] hover:underline"
                    >
                      Join to Connect
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator Dashboard Preview Section */}
      <section id="dashboard" className="bg-[#faf6f3] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-[#9c8d38]">
                Account Experience
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-[#5a3e57]">
                One unified account for Buyers &amp; Sellers.
              </h2>
            </div>
            <Link to={isAuthenticated ? getDashboardRoute() : '/login'}>
              <Button variant="plum" size="sm">
                {isAuthenticated ? 'Open My Workspace' : 'Sign In to Dashboard'}
              </Button>
            </Link>
          </div>

          <div className="grid overflow-hidden rounded-[22px] border border-[#eadfdb] bg-white shadow-[0_20px_50px_rgba(80,50,85,0.08)] md:grid-cols-[230px_1fr]">
            <div className="bg-[#51394e] p-6 text-white">
              <BrandLogo dark />
              <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[1.5px] text-[#b9aab5]">
                Creator Dashboard
              </p>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="rounded-xl bg-[#6b4b65] px-3.5 py-2.5 font-semibold text-white">
                  Overview
                </div>
                <div className="rounded-xl px-3.5 py-2.5 text-[#d8cbd4]">
                  Seller Verification
                </div>
                <div className="rounded-xl px-3.5 py-2.5 text-[#d8cbd4]">
                  Edit Profile
                </div>
                <div className="rounded-xl px-3.5 py-2.5 text-[#d8cbd4]">
                  Switch to Buyer
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-[#8b7c83]">
                    Welcome Back
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold text-[#5a3e57]">
                    Ayesha&apos;s Studio
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified Seller
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#eadfdb] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8b7c83]">
                    Verification
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#5a3e57]">Approved</p>
                  <p className="mt-1 text-xs text-[#7ea05d]">Publishing enabled</p>
                </div>
                <div className="rounded-2xl border border-[#eadfdb] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8b7c83]">
                    Account Mode
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#5a3e57]">Dual</p>
                  <p className="mt-1 text-xs text-[#786b75]">Buyer &amp; Seller active</p>
                </div>
                <div className="rounded-2xl border border-[#eadfdb] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8b7c83]">
                    Trust Score
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-2xl font-bold text-[#5a3e57]">
                    5.0 <Star className="h-5 w-5 fill-[#c7c54d] text-[#c7c54d]" />
                  </p>
                  <p className="mt-1 text-xs text-[#786b75]">CNIC verified</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#eadfdb] p-4">
                  <p className="font-display text-base font-bold text-[#5a3e57]">
                    My Skills
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['Crochet', 'Embroidery', 'Gift Boxes', 'Custom Bags'].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#f0e8f0] px-3 py-1 text-xs font-medium text-[#73546d]"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#eadfdb] p-4">
                  <p className="font-display text-base font-bold text-[#5a3e57]">
                    Verification Progress
                  </p>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#f0e8f0]">
                    <div className="h-full w-full rounded-full bg-[#c7c54d]" />
                  </div>
                  <p className="mt-2 text-xs text-[#786b75]">
                    100% verified — ready for marketplace listings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-[#fffaf7] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-[#9c8d38]">
              Contact Her Skill
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-[#5a3e57] sm:text-5xl">
              Let&apos;s build something beautiful.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#786b75] sm:text-base">
              Have a question about seller verification or want to join Her Skill as
              a creator? Send us a message or create your account today.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-[#5a3e57]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfdb] bg-white px-3.5 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#a45d81]" />
                CNIC Protected
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfdb] bg-white px-3.5 py-1.5">
                <Scissors className="h-3.5 w-3.5 text-[#a45d81]" />
                Handmade &amp; Services
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfdb] bg-white px-3.5 py-1.5">
                <Gift className="h-3.5 w-3.5 text-[#a45d81]" />
                Women-Only Community
              </span>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#eadfdb] bg-white p-6 shadow-sm sm:p-8">
            <form onSubmit={handleContactSubmit} className="space-y-4">
              {contactSent && (
                <Alert type="success">
                  Thank you for reaching out! Our Her Skill team will respond shortly.
                </Alert>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#5a3e57]">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) =>
                    setContactForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Your name"
                  className="w-full rounded-xl border border-[#ddd2cf] bg-[#fffdfc] px-3.5 py-2.5 text-sm focus:border-[#a45d81] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#5a3e57]">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#ddd2cf] bg-[#fffdfc] px-3.5 py-2.5 text-sm focus:border-[#a45d81] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#5a3e57]">
                  Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm((p) => ({ ...p, message: e.target.value }))
                  }
                  placeholder="Write your message..."
                  className="w-full rounded-xl border border-[#ddd2cf] bg-[#fffdfc] px-3.5 py-2.5 text-sm focus:border-[#a45d81] focus:outline-none"
                />
              </div>
              <Button type="submit" size="lg">
                Send Message
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer matching dark plum Netlify footer */}
      <footer className="bg-[#51394e] px-5 py-10 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 border-b border-[#6b4b65] pb-6 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-4">
              <BrandLogo dark />
              <span className="text-xs text-[#d8cbd4]">
                Helping women&apos;s skills become visible, discoverable, and sellable.
              </span>
            </div>

            <div className="flex flex-wrap gap-5 text-xs font-medium text-[#d8cbd4]">
              <a href="#home" className="hover:text-white">
                Home
              </a>
              <a href="#about" className="hover:text-white">
                About
              </a>
              <a href="#services" className="hover:text-white">
                Services
              </a>
              <a href="#explore" className="hover:text-white">
                Explore
              </a>
              <a href="#contact" className="hover:text-white">
                Contact
              </a>
              <Link to="/admin/login" className="text-[#d2cd60] hover:underline">
                Admin Portal
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-2 text-xs text-[#aa9ba6] sm:flex-row">
            <p>&copy; {CURRENT_YEAR} Her Skill</p>
            <p className="inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[#d2cd60]" />
              Made for women who create.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
