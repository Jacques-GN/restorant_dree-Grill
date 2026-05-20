'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MapPin, Clock, Facebook, Flame, Utensils, Star,
  ChevronDown, Menu as MenuIcon, X, Search, Calendar, Users,
  ChevronUp, ShieldCheck, MessageSquare,
  Check, Eye, Trash2, Plus, Edit, Heart,
  ArrowUp, ChevronLeft, ChevronRight, Minus
} from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'

// ─── Types ───────────────────────────────────────────────
interface Category {
  id: string
  name: string
  slug: string
  order: number
  _count?: { items: number }
}

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  categoryId: string
  featured: boolean
  available: boolean
  order: number
  category?: Category
  createdAt?: string
  updatedAt?: string
}

interface Reservation {
  id: string
  name: string
  phone: string
  email: string | null
  date: string
  time: string
  guests: number
  message: string | null
  status: string
  createdAt: string
  updatedAt: string
}

interface ContactInquiry {
  id: string
  name: string
  email: string | null
  phone: string | null
  subject: string | null
  message: string
  status: string
  createdAt: string
  updatedAt: string
}

interface DailySpecial {
  id: string
  name: string
  description: string | null
  image: string | null
  dayOfWeek: number
  originalPrice: number
  discountType: string
  specialPrice: number | null
  discountPercent: number | null
  active: boolean
  order: number
  // computed by API
  displayPrice?: number
  discountLabel?: string
}

// ─── Helpers ─────────────────────────────────────────────
function formatPrice(price: number): string {
  const str = price.toString()
  const lastThree = str.substring(str.length - 3)
  const otherNumbers = str.substring(0, str.length - 3)
  const formatted = otherNumbers !== '' ? `${Number(otherNumbers).toLocaleString('fr-FR')} ${lastThree}` : lastThree
  return `${formatted} F`
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: 'En attente', className: 'bg-gold-400/20 text-yellow-800 border-yellow-300' },
    confirmed: { label: 'Confirmé', className: 'bg-green-100 text-green-800 border-green-300' },
    cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-800 border-red-300' },
    new: { label: 'Nouveau', className: 'bg-grill-100 text-grill-800 border-grill-300' },
    read: { label: 'Lu', className: 'bg-blue-100 text-blue-800 border-blue-300' },
    replied: { label: 'Répondu', className: 'bg-green-100 text-green-800 border-green-300' },
  }
  return map[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
}

// ─── Animation Variants ─────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
}

// ─── Count-Up Animation Component ────────────────────
function CountUp({ target, suffix = '', trigger }: { target: number; suffix?: string; trigger: boolean }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!trigger) return
    const duration = 2000
    const steps = 40
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [trigger, target])
  return <>{count}{suffix}</>
}

// ─── Section Wrapper ────────────────────────────────────
function AnimatedSection({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// ─── Main Page ──────────────────────────────────────────
export default function Home() {
  // ── Loading State ──
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  // ── Navigation State ──
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('accueil')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [cart, setCart] = useState<{ name: string; price: number; qty: number }[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [adminPin, setAdminPin] = useState('')
  const [adminAuthenticated, setAdminAuthenticated] = useState(false)

  // ── Menu State ──
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [menuLoading, setMenuLoading] = useState(true)
  const [featuredLoading, setFeaturedLoading] = useState(true)

  // ── Reservation State ──
  const [reservationForm, setReservationForm] = useState({
    name: '', phone: '', date: '', time: '', guests: '2', message: ''
  })

  // ── Admin State ──
  const [adminData, setAdminData] = useState<{
    categories: (Category & { items: MenuItem[] })[]
    dailySpecials?: DailySpecial[]
    stats: Record<string, number>
  } | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminTab, setAdminTab] = useState('menu')
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showItemForm, setShowItemForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [itemForm, setItemForm] = useState({
    name: '', description: '', price: '', categoryId: '', featured: false, available: true, order: 0
  })
  const [categoryForm, setCategoryForm] = useState({
    name: '', slug: '', order: 0
  })

  // ── Daily Special Admin State ──
  const [editingSpecial, setEditingSpecial] = useState<DailySpecial | null>(null)
  const [showSpecialForm, setShowSpecialForm] = useState(false)
  const [specialForm, setSpecialForm] = useState({
    name: '', description: '', image: '', dayOfWeek: 0,
    originalPrice: '', discountType: 'percentage' as string,
    specialPrice: '', discountPercent: '', active: true, order: 0
  })

  // ── Scroll Detection & Section Spy ──
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
      setShowScrollTop(window.scrollY > 600)
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = totalHeight > 0 ? window.scrollY / totalHeight : 0
      setScrollProgress(progress)

      // Section spy
      const sections = ['accueil', 'specialites', 'menu', 'galerie', 'reservation', 'contact']
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i])
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 120) {
            setActiveSection(sections[i])
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ── Opening Hours Check ──
  useEffect(() => {
    const checkHours = () => {
      const now = new Date()
      const hour = now.getHours()
      // Open 13h-22:30 (Mon-Thu) / 13h-23h (Fri-Sun) - Ouagadougou timezone
      const day = now.getDay() // 0=Sun, 1=Mon, ...6=Sat
      const isWeekendLate = (day === 5 || day === 6 || day === 0) // Fri, Sat or Sun
      const closeHour = isWeekendLate ? 23 : 22
      setIsOpen(hour >= 13 && hour < closeHour)
    }
    checkHours()
    const interval = setInterval(checkHours, 60000)
    return () => clearInterval(interval)
  }, [])

  // ── Fetch Data ──
  useEffect(() => {
    async function fetchFeatured() {
      try {
        setFeaturedLoading(true)
        const res = await fetch('/api/menu?featured=true')
        if (res.ok) {
          const data = await res.json()
          setFeaturedItems(data)
        }
      } catch { /* silent */ }
      finally { setFeaturedLoading(false) }
    }
    fetchFeatured()
  }, [])

  useEffect(() => {
    async function fetchMenu() {
      try {
        setMenuLoading(true)
        const [catRes, menuRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/menu'),
        ])
        if (catRes.ok) setCategories(await catRes.json())
        if (menuRes.ok) setMenuItems(await menuRes.json())
        // Auto-expand all categories
        if (catRes.ok) {
          const cats = await catRes.json() as Category[]
          setExpandedCategories(new Set(cats.map(c => c.id)))
        }
      } catch { /* silent */ }
      finally { setMenuLoading(false) }
    }
    fetchMenu()
  }, [])

  const ADMIN_PIN = '1234'

  const fetchAdminData = useCallback(async () => {
    try {
      setAdminLoading(true)
      const headers = { 'x-admin-pin': ADMIN_PIN }
      const [adminRes, resRes, contRes] = await Promise.all([
        fetch('/api/admin', { headers }),
        fetch('/api/reservations', { headers }),
        fetch('/api/contact', { headers }),
      ])
      if (adminRes.ok) setAdminData(await adminRes.json())
      if (resRes.ok) setReservations(await resRes.json())
      if (contRes.ok) setInquiries(await contRes.json())
    } catch { /* silent */ }
    finally { setAdminLoading(false) }
  }, [])

  useEffect(() => {
    if (adminOpen && adminData === null) fetchAdminData()
  }, [adminOpen, adminData, fetchAdminData])

  // ── Filtered Menu Items ──
  const filteredItems = menuItems.filter(item => {
    const matchCategory = activeCategory === 'all' || item.category?.slug === activeCategory
    const matchSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchCategory && matchSearch
  })

  // ── Grouped items by category ──
  const groupedItems = categories.reduce((acc, cat) => {
    const items = filteredItems.filter(i => i.categoryId === cat.id)
    if (items.length > 0) acc[cat.id] = { category: cat, items }
    return acc
  }, {} as Record<string, { category: Category; items: MenuItem[] }>)

  // ── Handlers ──
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { name, phone, date, time, guests, message } = reservationForm
    // Format date for display
    const dateObj = new Date(date + 'T00:00:00')
    const formattedDate = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    // Build WhatsApp message
    let waMessage = `🍽️ *RÉSERVATION — Deen's Grill*\n\n`
    waMessage += `👤 Nom : ${name}\n`
    waMessage += `📱 Téléphone : ${phone}\n`
    waMessage += `📅 Date : ${formattedDate}\n`
    waMessage += `🕐 Heure : ${time}\n`
    waMessage += `👥 Nombre de personnes : ${guests}\n`
    if (message.trim()) {
      waMessage += `💬 Message : ${message}\n`
    }
    waMessage += `\n📍 Adresse : Ouaga 2000, Ouagadougou\n`
    waMessage += `\nMerci de confirmer ma réservation ! 🙏`
    const encoded = encodeURIComponent(waMessage)
    window.open(`https://wa.me/22654025555?text=${encoded}`, '_blank')
    toast.success('Vous allez être redirigé(e) vers WhatsApp pour envoyer votre réservation.')
    setReservationForm({ name: '', phone: '', date: '', time: '', guests: '2', message: '' })
  }

  // ── Admin handlers ──
  const handleAdminAction = async (action: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': ADMIN_PIN },
        body: JSON.stringify({ action, data }),
      })
      if (res.ok) {
        toast.success('Opération réussie !')
        fetchAdminData()
        // Also refresh main menu data
        const [catRes, menuRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/menu'),
        ])
        if (catRes.ok) setCategories(await catRes.json())
        if (menuRes.ok) setMenuItems(await menuRes.json())
      } else {
        const d = await res.json()
        toast.error(d.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur de connexion')
    }
  }

  const handleReservationStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': ADMIN_PIN },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success('Statut mis à jour')
        fetchAdminData()
      }
    } catch { toast.error('Erreur') }
  }

  const handleContactStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': ADMIN_PIN },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success('Statut mis à jour')
        fetchAdminData()
      }
    } catch { toast.error('Erreur') }
  }

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      categoryId: item.categoryId,
      featured: item.featured,
      available: item.available,
      order: item.order,
    })
    setShowItemForm(true)
  }

  const openNewCategory = () => {
    setEditingCategory(null)
    setCategoryForm({ name: '', slug: '', order: 0 })
    setShowCategoryForm(true)
  }

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat)
    setCategoryForm({ name: cat.name, slug: cat.slug, order: cat.order })
    setShowCategoryForm(true)
  }

  const handleSaveItem = () => {
    if (!itemForm.name || !itemForm.price || !itemForm.categoryId) {
      toast.error('Nom, prix et catégorie sont requis')
      return
    }
    if (editingItem) {
      handleAdminAction('updateItem', { ...itemForm, price: parseInt(itemForm.price), id: editingItem.id })
    } else {
      handleAdminAction('createItem', { ...itemForm, price: parseInt(itemForm.price) })
    }
    setShowItemForm(false)
    setEditingItem(null)
  }

  const handleSaveCategory = () => {
    if (!categoryForm.name || !categoryForm.slug) {
      toast.error('Nom et slug sont requis')
      return
    }
    if (editingCategory) {
      handleAdminAction('updateCategory', { ...categoryForm, id: editingCategory.id })
    } else {
      handleAdminAction('createCategory', categoryForm)
    }
    setShowCategoryForm(false)
    setEditingCategory(null)
  }

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  // ── Plat du Jour (from API) ──
  const [todaySpecial, setTodaySpecial] = useState<DailySpecial | null>(null)
  useEffect(() => {
    async function fetchDailySpecial() {
      try {
        const res = await fetch('/api/daily-special')
        if (res.ok) {
          const data = await res.json()
          if (data.active) setTodaySpecial(data)
        }
      } catch { /* silent */ }
    }
    fetchDailySpecial()
  }, [])

  const galleryImages = [
    { img: '/food-mixgrill-real.jpeg', label: "Mix Deen's Grill" },
    { img: '/food-mouton-real.jpeg', label: 'Mouton fondant aux légumes' },
    { img: '/food-pizza-real.jpeg', label: 'Pizza' },
    { img: '/food-saucisse-real.jpeg', label: 'Saucisse & Merguez' },
    { img: '/food-poulet-real.jpeg', label: 'Poulet aux légumes' },
    { img: '/food-mechouis-real.jpeg', label: 'Mechouis (mouton entier)' },
    { img: '/food-aloco-real.jpeg', label: 'Alloco' },
    { img: '/food-salade-real.jpeg', label: 'Salades' },
    { img: '/food-dinde-real.jpeg', label: 'Dinde fondante' },
    { img: '/gallery-mouton-riz.jpeg', label: 'Mouton au riz' },
    { img: '/gallery-poulet-entier.jpeg', label: 'Poulet entier rôti' },
    { img: '/gallery-boeuf-fondant.jpeg', label: 'Bœuf fondant' },
    { img: '/gallery-plat-traditionnel.jpeg', label: 'Plat traditionnel' },
    { img: '/gallery-assiette-mixte.jpeg', label: 'Assiette mixte' },
    { img: '/gallery-poulet-grille.jpeg', label: 'Poulet grillé' },
    { img: '/gallery-viande-grillee.jpeg', label: 'Viande grillée' },
  ]

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const shareOnWhatsApp = (name: string, price: number) => {
    const text = encodeURIComponent(`Bonjour ! Je souhaite commander : ${name} - ${formatPrice(price)} chez Deen's Grill.`)
    window.open(`https://wa.me/22654025555?text=${text}`, '_blank')
  }

  const addToCart = (name: string, price: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.name === name)
      if (existing) {
        return prev.map(item => item.name === name ? { ...item, qty: item.qty + 1 } : item)
      }
      return [...prev, { name, price, qty: 1 }]
    })
    toast.success(`${name} ajouté au panier`)
  }

  const removeFromCart = (name: string) => {
    setCart(prev => prev.filter(item => item.name !== name))
  }

  const updateCartQty = (name: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(name)
      return
    }
    setCart(prev => prev.map(item => item.name === name ? { ...item, qty } : item))
  }

  const sendCartWhatsApp = () => {
    if (cart.length === 0) return
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
    const items = cart.map(item => `- ${item.qty}x ${item.name} (${formatPrice(item.price * item.qty)})`).join('\n')
    const text = encodeURIComponent(`Bonjour ! Je souhaite commander :\n\n${items}\n\nTotal : ${formatPrice(total)}\n\nMerci !`)
    window.open(`https://wa.me/22654025555?text=${text}`, '_blank')
  }

  // ─── NAVIGATION ──────────────────────────────────────
  const navLinks = [
    { label: 'Accueil', id: 'accueil' },
    { label: 'Menu', id: 'menu' },
    { label: 'Réservation', id: 'reservation' },
    { label: 'Contact', id: 'contact' },
  ]

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ─── SCROLL PROGRESS BAR ────────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[60] h-1 bg-gradient-to-r from-gold-400 via-grill-500 to-ember-500 origin-left"
        style={{ scaleX: scrollProgress }}
      />
      {/* ─── LOADING OVERLAY ───────────────────────────── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed inset-0 z-[100] bg-wood-950 flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-4 rounded-full hero-gradient-ring opacity-60" />
              <img
                src="/logo.png"
                alt="Deen's Grill"
                className="relative w-20 h-20 loading-ring rounded-full object-contain"
              />
            </div>
            <p className="mt-4 text-gold-400 font-serif text-2xl font-bold tracking-wide">
              Deen&apos;s Grill
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Restaurant",
            "name": "Deen's Grill",
            "image": ["/hero-interior.jpeg", "/food-mixgrill-real.jpeg", "/food-pizza-real.jpeg"],
            "url": "https://deensgrill.com",
            "telephone": "+22654025555",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Ouaga 2000",
              "addressLocality": "Ouagadougou",
              "addressRegion": "Centre",
              "addressCountry": "BF"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 12.3714,
              "longitude": -1.5197
            },
            "openingHoursSpecification": [
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"],
                "opens": "13:00",
                "closes": "22:30"
              },
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Friday", "Saturday", "Sunday"],
                "opens": "13:00",
                "closes": "23:00"
              }
            ],
            "servesCuisine": "Grillades, Grill, Shawarma, Pizza, Fast Food",
            "priceRange": "$$",
            "servesMenu": [
              { "@type": "MenuItem", "name": "Mix Grill", "offers": { "@type": "Offer", "price": "3500", "priceCurrency": "XOF" } },
              { "@type": "MenuItem", "name": "Pizza Maison", "offers": { "@type": "Offer", "price": "3000", "priceCurrency": "XOF" } },
              { "@type": "MenuItem", "name": "Mouton Grillé", "offers": { "@type": "Offer", "price": "4000", "priceCurrency": "XOF" } }
            ],
            "sameAs": ["https://www.facebook.com/share/1AuUGBbfto/?mibextid=wwXIfr"]
          })
        }}
      />
      <Toaster position="top-center" richColors />

      {/* ─── NAVBAR ────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-wood-950/95 backdrop-blur-md shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <button onClick={() => scrollToSection('accueil')} className="flex items-center gap-2 group">
              <img src="/logo.png" alt="Deen's Grill" className="w-8 h-8 group-hover:scale-110 transition-transform object-contain" />
              <span className="font-serif text-xl md:text-2xl font-bold text-white">
                Deen&apos;s <span className="text-gradient">GRILL</span>
              </span>
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={activeSection === link.id ? "text-gold-400 transition-colors text-sm font-medium tracking-wide relative" : "text-wood-200 hover:text-gold-400 transition-colors text-sm font-medium tracking-wide relative"}
                >
                  {link.label}
                  {activeSection === link.id && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gold-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Location Pin */}
              <a
                href="https://maps.google.com/maps/place/geen's+grill+ouaga+200/data=!4m2!3m1!1s0xe2ebd202b123eab:0xbbc20219d135848b"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-wood-200 hover:text-gold-400 transition-colors text-sm font-medium"
                title="Nous trouver sur Google Maps"
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden lg:inline">Ouaga 2000</span>
              </a>
              <Button
                size="sm"
                onClick={() => scrollToSection('reservation')}
                className="bg-grill-500 hover:bg-grill-600 text-white"
              >
                Réserver
              </Button>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
                    <MenuIcon className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-wood-950 border-wood-800 w-72">
                  <SheetHeader className="text-left">
                    <SheetTitle className="text-gold-400 font-serif flex items-center gap-2">
                      <img src="/logo.png" alt="" className="w-5 h-5 object-contain" /> Deen&apos;s GRILL
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 mt-4">
                    {navLinks.map(link => (
                      <button
                        key={link.id}
                        onClick={() => scrollToSection(link.id)}
                        className="text-wood-200 hover:text-gold-400 hover:bg-wood-900 px-4 py-3 rounded-lg text-left transition-colors"
                      >
                        {link.label}
                      </button>
                    ))}
                    <Separator className="bg-wood-800 my-2" />
                    {/* Location link in mobile menu */}
                    <a
                      href="https://maps.google.com/maps/place/geen's+grill+ouaga+200/data=!4m2!3m1!1s0xe2ebd202b123eab:0xbbc20219d135848b"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-wood-200 hover:text-gold-400 px-4 py-3 transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      Nous trouver (Google Maps)
                    </a>
                    <Button
                      onClick={() => { scrollToSection('reservation'); setMobileMenuOpen(false) }}
                      className="bg-grill-500 hover:bg-grill-600 text-white w-full"
                    >
                      Réserver
                    </Button>
                    <a
                      href="https://wa.me/22654025555?text=Bonjour%20!%20Je%20souhaite%20commander%20chez%20Deen%27s%20Grill."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-wood-300 hover:text-green-400 px-4 py-3 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/><path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/></svg>
                      WhatsApp : 54 02 55 55
                    </a>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Admin Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAdminOpen(true)}
                className="text-wood-400 hover:text-gold-400 hover:bg-white/5 h-8 w-8"
                title="Administration"
              >
                <ShieldCheck className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ──────────────────────────────── */}
      <section id="accueil" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with parallax */}
        <div className="absolute inset-0 hero-parallax-bg">
          <img
            src="/hero-interior.jpeg"
            alt="Deen's Grill - Restaurant de grillades"
            className="w-full h-[120%] object-cover -translate-y-[10%]"
          />
          <div className="hero-overlay absolute inset-0" />
        </div>

        {/* Grill pattern overlay */}
        <div className="grill-pattern absolute inset-0 opacity-30" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="mb-4">
              <img src="/logo.png" alt="Deen's Grill" className="w-16 h-16 mx-auto drop-shadow-lg animate-pulse-glow object-contain" />
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4">
              <span className="text-gradient text-gradient-glow">Deen&apos;s Grill</span>
            </h1>
            <p className="text-gold-400 font-serif text-xl sm:text-2xl md:text-3xl italic mb-6">
              &ldquo;iid riita sonma&rdquo;
            </p>
            <p className="text-wood-100 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-shadow-glow">
              Bienvenue chez Deen&apos;s Grill, votre destination pour des grillades authentiques à Ouaga 2000.
              Bœuf, mouton, poulet grillé, shawarma, pizzas et bien plus encore.
              <span className="text-gold-400 font-medium"> Chaque bouchée est un véritable régal.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                <Button
                  size="lg"
                  onClick={() => scrollToSection('menu')}
                  className="bg-grill-500 hover:bg-grill-600 text-white px-6 py-5 sm:px-8 sm:py-6 text-base font-semibold shadow-lg"
                >
                  <Utensils className="w-5 h-5" />
                  Voir le Menu
                </Button>
              </motion.div>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
                <Button
                  size="lg"
                  onClick={() => scrollToSection('reservation')}
                  variant="outline"
                  className="border-gold-400/50 text-gold-400 hover:bg-gold-400/10 px-6 py-5 sm:px-8 sm:py-6 text-base font-semibold"
                >
                  <Calendar className="w-5 h-5" />
                  Réserver une Table
                </Button>
              </motion.div>
            </div>

            {/* WhatsApp + Location CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/22654025555?text=Bonjour%20!%20Je%20souhaite%20commander%20chez%20Deen%27s%20Grill."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-green-500/20 backdrop-blur-sm hover:bg-green-500/30 border border-green-400/30 rounded-full px-6 py-3 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center group-hover:bg-green-400 transition-colors shadow-lg">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-green-100 text-xs font-medium uppercase tracking-wider">Commandez sur</p>
                <span className="text-white font-bold text-lg tracking-wide">WhatsApp : 54 02 55 55</span>
              </div>
            </a>

            {/* Location CTA */}
            <a
              href="https://maps.google.com/maps/place/geen's+grill+ouaga+200/data=!4m2!3m1!1s0xe2ebd202b123eab:0xbbc20219d135848b"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm hover:bg-white/15 border border-white/15 rounded-full px-6 py-3 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                <MapPin className="w-5 h-5 text-gold-400" />
              </div>
              <div className="text-left">
                <p className="text-wood-300 text-xs font-medium uppercase tracking-wider">Nous trouver</p>
                <span className="text-white font-bold text-lg tracking-wide">Ouaga 2000</span>
              </div>
            </a>
            </div>

            {/* Open/Closed Status */}
            <div className="mt-6">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-5 py-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-green-400 animate-pulse' : 'bg-ember-400'}`} />
                <span className="text-white text-sm font-medium">
                  {isOpen ? 'Ouvert maintenant' : 'Fermé'} — 13h-22h30 / 23h
                </span>
              </div>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-8 h-8 text-wood-400 opacity-60" />
          </motion.div>
        </div>
      </section>

      {/* ─── PROMOTIONAL STRIP ────────────────────────────── */}
      <div className="bg-wood-950 border-y border-gold-400/20 py-3 overflow-hidden">
        <div className="flex items-center justify-center gap-8 animate-marquee whitespace-nowrap">
          <span className="text-gold-400 font-medium text-sm flex items-center gap-2">
            <Star className="w-4 h-4 fill-gold-400" /> Livraison gratuite à Ouaga 2000
          </span>
          <span className="text-wood-500">•</span>
          <span className="text-wood-300 font-medium text-sm flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/><path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/></svg> WhatsApp : 54 02 55 55
          </span>
          <span className="text-wood-500">•</span>
          <span className="text-wood-300 font-medium text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" /> Ouvert 7j/7 de 13h à 22h30
          </span>
          <span className="text-wood-500">•</span>
          <span className="text-wood-300 font-medium text-sm flex items-center gap-2">
            <Facebook className="w-4 h-4" /> Suivez-nous sur Facebook
          </span>
        </div>
      </div>

      {/* ─── FEATURED DISHES ───────────────────────────── */}
      <AnimatedSection id="specialites" className="py-12 sm:py-16 md:py-24 bg-wood-50 grill-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-wood-900 mb-4">
              Nos <span className="text-gradient">Spécialités</span>
            </h2>
            <div className="section-divider mb-2" />
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent mx-auto mb-4" />
            <p className="text-wood-500 text-base md:text-lg max-w-xl mx-auto">
              Découvrez nos plats les plus populaires, préparés avec passion et les meilleurs ingrédients.
            </p>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-96 rounded-2xl" />
              ))}
            </div>
          ) : featuredItems.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Default featured cards if no items from API */}
              {[
                { name: "Mix Deen's Grill", img: '/food-mixgrill-real.jpeg', desc: "Assiette de bœuf, mouton et ailerons de dinde grillés au charbon de bois, accompagnée de frites et crudités", price: 3500 },
                { name: 'Pizza', img: '/food-pizza-real.jpeg', desc: 'Pizza artisanale avec garniture fraîche et mozzarella fondante', price: 3000 },
                { name: 'Mouton fondant aux légumes', img: '/food-mouton-real.jpeg', desc: 'Mouton tendre et fondant grillé avec légumes, au feu de bois', price: 4000 },
              ].map((dish, i) => (
                <motion.div key={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                  <Card className="group overflow-hidden border-wood-200 hover:border-grill-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white hover:shadow-grill-warm card-shine">
                    <div className="relative overflow-hidden h-56 md:h-64">
                      <img
                        src={dish.img}
                        alt={dish.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <Badge className="absolute top-3 left-3 bg-gold-400 text-wood-900 border-0 font-semibold">
                        <Star className="w-3 h-3 mr-1" /> Vedette
                      </Badge>
                      <button
                        onClick={() => toggleFavorite(`default-${i}`)}
                        className="absolute top-3 right-3 w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110"
                        aria-label="Ajouter aux favoris"
                      >
                        <Heart className={`w-4 h-4 transition-colors ${favorites.has(`default-${i}`) ? 'text-ember-500 fill-ember-500' : 'text-wood-400'}`} />
                      </button>
                    </div>
                    <CardContent className="p-5 md:p-6">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-serif text-xl font-bold text-wood-900">{dish.name}</h3>
                        <span className="text-gold-500 font-bold text-lg whitespace-nowrap">{formatPrice(dish.price)}</span>
                      </div>
                      <p className="text-wood-500 text-sm leading-relaxed">{dish.desc}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => toggleFavorite(`default-${i}`)}
                          className="inline-flex items-center gap-1 text-xs text-wood-400 hover:text-ember-500 transition-colors min-h-[32px]"
                          aria-label="Ajouter aux favoris"
                        >
                          <Heart className={`w-3.5 h-3.5 ${favorites.has(`default-${i}`) ? 'fill-ember-500 text-ember-500' : ''}`} />
                          Favori
                        </button>
                        <button
                          onClick={() => addToCart(dish.name, dish.price)}
                          className="inline-flex items-center gap-1 text-xs bg-grill-500 hover:bg-grill-600 text-white px-2.5 py-1 rounded-full transition-colors font-medium min-h-[32px]"
                        >
                          <Plus className="w-3 h-3" />
                          Ajouter
                        </button>
                        <button
                          onClick={() => shareOnWhatsApp(dish.name, dish.price)}
                          className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium transition-colors min-h-[32px]"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/>
                          </svg>
                          Commander
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {featuredItems.slice(0, 6).map((item, i) => {
                // Smart photo mapping based on dish name
                const nameL = item.name.toLowerCase()
                let itemImg = '/hero-interior.jpeg'
                if (nameL.includes('mix') || nameL.includes('gourmand')) itemImg = '/food-mixgrill-real.jpeg'
                else if (nameL.includes('pizza')) itemImg = '/food-pizza-real.jpeg'
                else if (nameL.includes('mouton') || nameL.includes('agneau') || nameL.includes('gigot')) itemImg = '/food-mouton-real.jpeg'
                else if (nameL.includes('poulet') || nameL.includes('choucouya')) itemImg = '/food-poulet-real.jpeg'
                else if (nameL.includes('saucisse') || nameL.includes('merguez')) itemImg = '/food-saucisse-real.jpeg'
                else if (nameL.includes('mechoui')) itemImg = '/food-mechouis-real.jpeg'
                else if (nameL.includes('shawarma')) itemImg = '/gallery-boeuf-fondant.jpeg'
                else if (nameL.includes('burger')) itemImg = '/gallery-poulet-grille.jpeg'
                else if (nameL.includes('aloco') || nameL.includes('alloco')) itemImg = '/food-aloco-real.jpeg'
                else if (nameL.includes('salade')) itemImg = '/food-salade-real.jpeg'
                else if (nameL.includes('dinde')) itemImg = '/food-dinde-real.jpeg'
                return (
                  <motion.div key={item.id} variants={scaleIn}>
                    <Card className="group overflow-hidden border-wood-200 hover:border-grill-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white hover:shadow-grill-warm card-shine">
                      <div className="relative overflow-hidden h-56 md:h-64">
                        <img
                          src={itemImg}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <Badge className="absolute top-3 left-3 bg-gold-400 text-wood-900 border-0 font-semibold">
                          <Star className="w-3 h-3 mr-1" /> Vedette
                        </Badge>
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className="absolute top-3 right-3 w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110"
                          aria-label="Ajouter aux favoris"
                        >
                          <Heart className={`w-4 h-4 transition-colors ${favorites.has(item.id) ? 'text-ember-500 fill-ember-500' : 'text-wood-400'}`} />
                        </button>
                      </div>
                      <CardContent className="p-5 md:p-6">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-serif text-xl font-bold text-wood-900">{item.name}</h3>
                          <span className="text-gold-500 font-bold text-lg whitespace-nowrap">{formatPrice(item.price)}</span>
                        </div>
                        <p className="text-wood-500 text-sm leading-relaxed">{item.description || 'Un plat délicieux préparé avec soin'}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => toggleFavorite(item.id)}
                            className="inline-flex items-center gap-1 text-xs text-wood-400 hover:text-ember-500 transition-colors min-h-[32px]"
                            aria-label="Ajouter aux favoris"
                          >
                            <Heart className={`w-3.5 h-3.5 ${favorites.has(item.id) ? 'fill-ember-500 text-ember-500' : ''}`} />
                            Favori
                          </button>
                          <button
                            onClick={() => addToCart(item.name, item.price)}
                            className="inline-flex items-center gap-1 text-xs bg-grill-500 hover:bg-grill-600 text-white px-2.5 py-1 rounded-full transition-colors font-medium min-h-[32px]"
                          >
                            <Plus className="w-3 h-3" />
                            Ajouter
                          </button>
                          <button
                            onClick={() => shareOnWhatsApp(item.name, item.price)}
                            className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium transition-colors min-h-[32px]"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/>
                            </svg>
                            Commander
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </AnimatedSection>

      {/* ─── PLAT DU JOUR ──────────────────────────────── */}
      {todaySpecial && (
      <div className="sticky top-16 md:top-20 z-30 bg-gradient-to-r from-grill-500 via-grill-600 to-ember-600 relative overflow-hidden shadow-lg">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-gold-400/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-gold-400/10 rounded-full translate-x-1/3 translate-y-1/3" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between gap-4 py-3 md:py-4">
            {/* Left - badge + name + price */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Badge className="bg-gold-400/20 text-gold-100 border-gold-400/30 flex-shrink-0 hidden sm:flex">
                <Flame className="w-3 h-3 mr-1" /> Aujourd&apos;hui
              </Badge>
              <div className="min-w-0">
                <p className="text-white font-serif font-bold text-sm md:text-base truncate">
                  Plat du Jour : {todaySpecial.name}
                </p>
                <div className="flex items-center gap-2">
                  {todaySpecial.discountLabel && todaySpecial.discountLabel !== '-0%' && (
                    <Badge className="bg-ember-500/90 text-white border-none px-2 py-0 text-xs font-bold">
                      {todaySpecial.discountLabel}
                    </Badge>
                  )}
                  {todaySpecial.displayPrice && todaySpecial.displayPrice < todaySpecial.originalPrice ? (
                    <>
                      <span className="text-white/50 line-through text-xs">
                        {formatPrice(todaySpecial.originalPrice)}
                      </span>
                      <span className="text-gold-400 font-bold text-base md:text-lg">
                        {formatPrice(todaySpecial.displayPrice)}
                      </span>
                    </>
                  ) : (
                    <span className="text-gold-400 font-bold text-base md:text-lg">
                      {formatPrice(todaySpecial.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Right - image + button */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-gold-400/30 shadow-lg flex-shrink-0">
                <img
                  src={todaySpecial.image || '/food-mixgrill-real.jpeg'}
                  alt={todaySpecial.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => addToCart(todaySpecial.name, todaySpecial.displayPrice || todaySpecial.originalPrice)}
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-4 py-2.5 rounded-full transition-all duration-300 font-medium text-xs md:text-sm border border-white/20"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/>
                </svg>
                Commander
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ─── MENU SECTION ──────────────────────────────── */}
      <AnimatedSection id="menu" className="py-12 sm:py-16 md:py-24 bg-white pattern-dots">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-wood-900 mb-4">
              Notre <span className="text-gradient">Menu</span>
            </h2>
            <div className="section-divider mb-2" />
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent mx-auto mb-4" />
            <p className="text-wood-500 text-base md:text-lg max-w-xl mx-auto">
              Une variété de plats grillés et plus encore pour satisfaire toutes vos envies.
            </p>
          </div>

          {/* WhatsApp Order CTA */}
          <div className="text-center mb-8">
            <a
              href="https://wa.me/22654025555?text=Bonjour%20!%20Je%20souhaite%20commander%20chez%20Deen%27s%20Grill."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/>
              </svg>
              Commander via WhatsApp
            </a>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-wood-400" />
              <Input
                placeholder="Rechercher un plat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 border-wood-200 focus:border-grill-400 focus:ring-grill-400/20 bg-wood-50/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-wood-400 hover:text-wood-600" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-wood-400 mt-2 text-center">
                {filteredItems.length} résultat{filteredItems.length !== 1 ? 's' : ''} pour &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-10 scrollbar-hide -mx-4 px-4 flex-wrap justify-start sm:mx-0 sm:px-0 sm:justify-center">
            <Button
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('all')}
              className={`min-w-0 sm:min-w-auto whitespace-nowrap rounded-full ${
                activeCategory === 'all'
                  ? 'bg-grill-500 hover:bg-grill-600 text-white border-grill-500 shadow-md shadow-grill-500/25'
                  : 'border-wood-200 text-wood-600 hover:border-grill-300 hover:text-grill-600'
              }`}
            >
              Tout voir
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.slug)}
                className={`min-w-0 sm:min-w-auto whitespace-nowrap rounded-full ${
                  activeCategory === cat.slug
                    ? 'bg-grill-500 hover:bg-grill-600 text-white border-grill-500 shadow-md shadow-grill-500/25'
                    : 'border-wood-200 text-wood-600 hover:border-grill-300 hover:text-grill-600'
                }`}
              >
                {cat.name}
                {cat._count && cat._count.items > 0 && (
                  <Badge variant="secondary" className="ml-1.5 bg-white/20 text-xs h-5 px-1.5">
                    {cat._count.items}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Menu Items */}
          {menuLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <Utensils className="w-16 h-16 text-wood-300 mx-auto mb-4" />
              <p className="text-wood-500 text-lg">Aucun plat trouvé</p>
              <p className="text-wood-400 text-sm mt-1">Essayez une autre recherche ou catégorie</p>
            </div>
          ) : activeCategory === 'all' ? (
            // Grouped view
            <div className="space-y-10">
              {Object.entries(groupedItems).map(([catId, { category, items }]) => (
                <div key={catId}>
                  <button
                    onClick={() => toggleCategoryExpand(catId)}
                    className="flex items-center justify-between w-full mb-6 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-grill-100 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-grill-500" />
                      </div>
                      <h3 className="font-serif text-xl md:text-2xl font-bold text-wood-900">{category.name}</h3>
                      <Badge variant="secondary" className="bg-wood-100 text-wood-600">
                        {items.length} plat{items.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {expandedCategories.has(catId) ? (
                      <ChevronUp className="w-5 h-5 text-wood-400 group-hover:text-grill-500 transition-colors" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-wood-400 group-hover:text-grill-500 transition-colors" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedCategories.has(catId) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                          {items.map((item, i) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <Card className="group hover:shadow-lg transition-all duration-300 bg-white border-wood-100 hover:border-grill-200 border-l-4 border-l-grill-400 hover:shadow-grill-warm-sm hover:scale-[1.02]">
                                <CardContent className="p-5">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex items-start gap-2 min-w-0">
                                      <h4 className="font-serif font-bold text-wood-900 text-base truncate">{item.name}</h4>
                                      {item.featured && (
                                        <Star className="w-4 h-4 text-gold-400 fill-gold-400 flex-shrink-0 mt-0.5" />
                                      )}
                                    </div>
                                    <span className="text-grill-600 font-extrabold text-lg whitespace-nowrap bg-grill-50 px-2.5 py-0.5 rounded-lg">{formatPrice(item.price)}</span>
                                  </div>
                                  {item.description && (
                                    <p className="text-wood-400 text-sm leading-relaxed mt-1">{item.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-3">
                                    <button
                                      onClick={() => toggleFavorite(item.id)}
                                      className="inline-flex items-center gap-1 text-xs text-wood-400 hover:text-ember-500 transition-colors min-h-[32px]"
                                      aria-label="Ajouter aux favoris"
                                    >
                                      <Heart className={`w-3.5 h-3.5 ${favorites.has(item.id) ? 'fill-ember-500 text-ember-500' : ''}`} />
                                      Favori
                                    </button>
                                    <button
                                      onClick={() => addToCart(item.name, item.price)}
                                      className="inline-flex items-center gap-1 text-xs bg-grill-500 hover:bg-grill-600 text-white px-2.5 py-1 rounded-full transition-colors font-medium min-h-[32px]"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Ajouter
                                    </button>
                                    <button
                                      onClick={() => shareOnWhatsApp(item.name, item.price)}
                                      className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium transition-colors min-h-[32px]"
                                    >
                                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/>
                                      </svg>
                                      Commander
                                    </button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            // Single category view
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            >
              {filteredItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 bg-white border-wood-100 hover:border-grill-200 border-l-4 border-l-grill-400 hover:shadow-grill-warm-sm hover:scale-[1.02]">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-start gap-2 min-w-0">
                          <h4 className="font-serif font-bold text-wood-900 text-base truncate">{item.name}</h4>
                          {item.featured && (
                            <Star className="w-4 h-4 text-gold-400 fill-gold-400 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        <span className="text-grill-600 font-extrabold text-lg whitespace-nowrap bg-grill-50 px-2.5 py-0.5 rounded-lg">{formatPrice(item.price)}</span>
                      </div>
                      {item.description && (
                        <p className="text-wood-400 text-sm leading-relaxed mt-1">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className="inline-flex items-center gap-1 text-xs text-wood-400 hover:text-ember-500 transition-colors min-h-[32px]"
                          aria-label="Ajouter aux favoris"
                        >
                          <Heart className={`w-3.5 h-3.5 ${favorites.has(item.id) ? 'fill-ember-500 text-ember-500' : ''}`} />
                          Favori
                        </button>
                        <button
                          onClick={() => addToCart(item.name, item.price)}
                          className="inline-flex items-center gap-1 text-xs bg-grill-500 hover:bg-grill-600 text-white px-2.5 py-1 rounded-full transition-colors font-medium min-h-[32px]"
                        >
                          <Plus className="w-3 h-3" />
                          Ajouter
                        </button>
                        <button
                          onClick={() => shareOnWhatsApp(item.name, item.price)}
                          className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium transition-colors min-h-[32px]"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/>
                          </svg>
                          Commander
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </AnimatedSection>



      {/* ─── GALERIE ─────────────────────────────────── */}
      <AnimatedSection id="galerie" className="py-12 sm:py-16 md:py-24 bg-wood-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Notre <span className="text-gradient">Galerie</span>
            </h2>
            <div className="section-divider mb-2" />
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent mx-auto mb-4" />
            <p className="text-wood-400 text-base md:text-lg max-w-xl mx-auto">
              Une sélection de nos plats, préparés avec soin et passion.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {galleryImages.map((photo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="relative group overflow-hidden rounded-xl md:rounded-2xl aspect-square cursor-pointer"
                onClick={() => openLightbox(i)}
              >
                <img
                  src={photo.img}
                  alt={photo.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                  <p className="text-white font-serif font-bold text-sm md:text-base">{photo.label}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Gallery Lightbox Modal */}
          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-4xl p-0 bg-black/95 border-wood-800">
              <DialogTitle className="sr-only">Galerie Deen's Grill</DialogTitle>
              <div className="relative">
                <img
                  src={galleryImages[lightboxIndex]?.img}
                  alt={galleryImages[lightboxIndex]?.label}
                  className="w-full max-h-[80vh] object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <p className="text-white font-serif text-xl font-bold text-center">{galleryImages[lightboxIndex]?.label}</p>
                </div>
                <button
                  onClick={() => setLightboxIndex(prev => prev > 0 ? prev - 1 : galleryImages.length - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={() => setLightboxIndex(prev => prev < galleryImages.length - 1 ? prev + 1 : 0)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedSection>

      {/* ─── RESERVATION SECTION ───────────────────────── */}
      <AnimatedSection id="reservation" className="py-12 sm:py-16 md:py-24 bg-wood-50 grill-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-wood-900 mb-4">
              <span className="text-gradient">Réservation</span>
            </h2>
            <div className="section-divider mb-4" />
            <p className="text-wood-500 text-base md:text-lg max-w-xl mx-auto">
              Réservez votre table pour une expérience culinaire inoubliable chez Deen&apos;s Grill.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="border-wood-200 shadow-lg bg-white">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleReservationSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="res-name" className="text-wood-700 font-medium">
                        Nom complet <span className="text-ember-500">*</span>
                      </Label>
                      <Input
                        id="res-name"
                        placeholder="Votre nom"
                        value={reservationForm.name}
                        onChange={(e) => setReservationForm(f => ({ ...f, name: e.target.value }))}
                        required
                        className="border-wood-200 focus:border-grill-400 focus:ring-grill-400/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="res-phone" className="text-wood-700 font-medium">
                        Téléphone <span className="text-ember-500">*</span>
                      </Label>
                      <Input
                        id="res-phone"
                        type="tel"
                        placeholder="00226 XX XX XX XX"
                        value={reservationForm.phone}
                        onChange={(e) => setReservationForm(f => ({ ...f, phone: e.target.value }))}
                        required
                        className="border-wood-200 focus:border-grill-400 focus:ring-grill-400/20"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="res-date" className="text-wood-700 font-medium">
                        Date <span className="text-ember-500">*</span>
                      </Label>
                      <Input
                        id="res-date"
                        type="date"
                        value={reservationForm.date}
                        onChange={(e) => setReservationForm(f => ({ ...f, date: e.target.value }))}
                        required
                        className="border-wood-200 focus:border-grill-400 focus:ring-grill-400/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="res-time" className="text-wood-700 font-medium">
                        Heure <span className="text-ember-500">*</span>
                      </Label>
                      <Input
                        id="res-time"
                        type="time"
                        value={reservationForm.time}
                        onChange={(e) => setReservationForm(f => ({ ...f, time: e.target.value }))}
                        required
                        className="border-wood-200 focus:border-grill-400 focus:ring-grill-400/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="res-guests" className="text-wood-700 font-medium">
                        Personnes <span className="text-ember-500">*</span>
                      </Label>
                      <Input
                        id="res-guests"
                        type="number"
                        min="1"
                        max="50"
                        value={reservationForm.guests}
                        onChange={(e) => setReservationForm(f => ({ ...f, guests: e.target.value }))}
                        required
                        className="border-wood-200 focus:border-grill-400 focus:ring-grill-400/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="res-message" className="text-wood-700 font-medium">
                      Message <span className="text-wood-400">(optionnel)</span>
                    </Label>
                    <Textarea
                      id="res-message"
                      placeholder="Informations supplémentaires (allergies, occasion spéciale...)"
                      value={reservationForm.message}
                      onChange={(e) => setReservationForm(f => ({ ...f, message: e.target.value }))}
                      rows={3}
                      className="border-wood-200 focus:border-grill-400 focus:ring-grill-400/20 resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-6 text-base font-semibold"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/>
                    </svg>
                    Envoyer la Réservation via WhatsApp
                  </Button>
                  <p className="text-center text-wood-400 text-xs mt-2">
                    Vous serez redirigé(e) vers WhatsApp avec un message pré-rempli. Il vous suffira d&apos;appuyer sur &ldquo;Envoyer&rdquo;.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── CONTACT SECTION ───────────────────────────── */}
      <AnimatedSection id="contact" className="py-12 sm:py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-wood-900 mb-4">
              Contactez-<span className="text-gradient">nous</span>
            </h2>
            <div className="section-divider mb-2" />
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent mx-auto mb-4" />
            <p className="text-wood-500 text-base md:text-lg max-w-xl mx-auto">
              Une question, une suggestion ou une commande spéciale ? N&apos;hésitez pas à nous écrire !
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8">
                <a
                  href="https://wa.me/22654025555?text=Bonjour%20!%20Je%20souhaite%20commander%20chez%20Deen%27s%20Grill."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-white border-wood-200 hover:border-green-300 rounded-xl p-5 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                    <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-wood-900 mb-1">WhatsApp</h3>
                    <p className="text-wood-500 text-sm">54 02 55 55 — Commander maintenant</p>
                  </div>
                </a>
                <div className="flex items-center gap-4 bg-white border-wood-200 rounded-xl p-5">
                  <div className="w-12 h-12 rounded-xl bg-grill-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-grill-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-wood-900 mb-1">Adresse</h3>
                    <p className="text-wood-500 text-sm">Ouaga 2000, Ouagadougou</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white border-wood-200 rounded-xl p-5">
                  <div className="w-12 h-12 rounded-xl bg-grill-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-grill-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-wood-900 mb-1">Horaires</h3>
                    <p className="text-wood-500 text-sm">Lun-Jeu : 13h-22h30 | Ven-Dim : 13h-23h</p>
                  </div>
                </div>
                <a
                  href="https://www.facebook.com/share/1AuUGBbfto/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-white border-wood-200 hover:border-grill-300 rounded-xl p-5 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-grill-100 flex items-center justify-center flex-shrink-0 group-hover:bg-grill-200 transition-colors">
                    <Facebook className="w-6 h-6 text-grill-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-wood-900 mb-1">Facebook</h3>
                    <p className="text-wood-500 text-sm">Suivez-nous</p>
                  </div>
                </a>
              </div>

            {/* Location Card */}
            <Card className="border-wood-200 overflow-hidden shadow-lg max-w-3xl mx-auto">
              <CardContent className="p-0">
                <a
                  href="https://maps.google.com/maps/place/geen's+grill+ouaga+200/data=!4m2!3m1!1s0xe2ebd202b123eab:0xbbc20219d135848b"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative h-52 md:h-64 bg-gradient-to-br from-wood-800 via-wood-900 to-wood-950 overflow-hidden group"
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-grill-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="w-8 h-8 text-grill-400" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-white mb-2">Deen's Grill — Ouaga 2000</h3>
                    <p className="text-wood-400 text-sm mb-4">Ouagadougou, Burkina Faso</p>
                    <span className="inline-flex items-center gap-2 bg-grill-500 hover:bg-grill-600 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-lg">
                      <MapPin className="w-4 h-4" />
                      Ouvrir dans Google Maps
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />
                </a>
              </CardContent>
            </Card>
        </div>
      </AnimatedSection>

      {/* ─── FOOTER ────────────────────────────────────── */}
      <footer className="bg-wood-950 text-wood-300 mt-auto pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/logo.png" alt="Deen's Grill" className="w-7 h-7 object-contain" />
                <span className="font-serif text-xl font-bold text-white">Deen&apos;s <span className="text-gradient">GRILL</span></span>
              </div>
              <p className="text-wood-500 text-sm leading-relaxed">
                &ldquo;iid riita sonma&rdquo; — Grillades authentiques à Ouaga 2000.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-serif font-bold text-white mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.303-.183-3.138.927.927-3.138-.183-.303A8 8 0 1112 20z"/>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/>
                  </svg>
                  <a href="https://wa.me/22654025555" target="_blank" rel="noopener noreferrer" className="text-wood-400 hover:text-green-400 transition-colors">WhatsApp : 54 02 55 55</a>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0" />
                  <a href="https://maps.google.com/maps/place/geen's+grill+ouaga+200/data=!4m2!3m1!1s0xe2ebd202b123eab:0xbbc20219d135848b" target="_blank" rel="noopener noreferrer" className="text-wood-400 hover:text-gold-400 transition-colors">Ouaga 2000, Ouagadougou</a>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gold-400 flex-shrink-0" />
                  <span className="text-wood-400">Lun-Jeu 13h-22h30 / Ven-Dim 13h-23h</span>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-serif font-bold text-white mb-4">Suivez-nous</h4>
              <a
                href="https://www.facebook.com/share/1AuUGBbfto/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-wood-900 hover:bg-wood-800 text-wood-300 hover:text-gold-400 px-4 py-2.5 rounded-lg transition-colors"
              >
                <Facebook className="w-5 h-5" />
                <span className="text-sm font-medium">Deen&apos;s Grill</span>
              </a>
            </div>
          </div>

          <Separator className="bg-wood-800 my-6" />

          <p className="text-wood-600 text-xs text-center">
            © {new Date().getFullYear()} Deen&apos;s Grill. Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* ─── FLOATING ACTION BUTTONS ────────────────────── */}
      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] right-3 sm:bottom-4 sm:right-4 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-wood-800 hover:bg-wood-700 text-white shadow-lg transition-colors flex items-center justify-center"
            aria-label="Retour en haut"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/22654025555?text=Bonjour%20!%20Je%20souhaite%20commander%20chez%20Deen%27s%20Grill."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-3 sm:bottom-20 sm:right-4 z-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center animate-whatsapp-pulse"
        aria-label="WhatsApp"
      >
        <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.303-.183-3.138.927.927-3.138-.183-.303A8 8 0 1112 20z"/>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/>
        </svg>
      </a>



      {/* Cart Button */}
      {cart.length > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] right-3 sm:bottom-28 sm:right-4 z-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gold-500 hover:bg-gold-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center"
          aria-label="Panier"
        >
          <Utensils className="w-5 h-5 md:w-6 md:h-6" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-ember-500 text-white text-xs font-bold flex items-center justify-center">
            {cart.reduce((sum, item) => sum + item.qty, 0)}
          </span>
        </motion.button>
      )}

      {/* ─── CART DIALOG ────────────────────────────────── */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <Utensils className="w-5 h-5 text-grill-500" />
              Votre Commande
              {cart.length > 0 && (
                <Badge className="bg-grill-100 text-grill-700">{cart.reduce((sum, item) => sum + item.qty, 0)} articles</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <Utensils className="w-12 h-12 text-wood-300 mx-auto mb-3" />
              <p className="text-wood-500">Votre panier est vide</p>
              <p className="text-wood-400 text-sm mt-1">Ajoutez des plats depuis le menu</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {cart.map(item => (
                <div key={item.name} className="flex items-center gap-3 bg-wood-50 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-wood-900 text-sm truncate">{item.name}</p>
                    <p className="text-grill-600 font-bold text-sm">{formatPrice(item.price * item.qty)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQty(item.name, item.qty - 1)}
                      className="w-8 h-8 rounded-full bg-wood-200 hover:bg-wood-300 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-wood-900 w-6 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateCartQty(item.name, item.qty + 1)}
                      className="w-8 h-8 rounded-full bg-grill-100 hover:bg-grill-200 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="border-t border-wood-200 pt-3 mt-3">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-wood-900">Total</span>
                  <span className="font-bold text-xl text-grill-600">
                    {formatPrice(cart.reduce((sum, item) => sum + item.price * item.qty, 0))}
                  </span>
                </div>
                <Button
                  onClick={sendCartWhatsApp}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-6 font-semibold"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-1.758-.867s-.471-.308-.814.115c-.342.424-.639.854-1.134.854-.496 0-1.034-.254-2.084-1.298-1.051-1.044-1.38-1.743-1.38-2.247 0-.503.464-.764.464-.764s.393-.264.182-.854c-.212-.589-.862-1.56-1.142-1.845-.279-.285-.558-.235-.558-.235s-.793-.056-1.267.613c-.474.668-.505 1.79.095 3.072.6 1.283 1.683 2.735 2.905 3.953 1.222 1.218 2.678 2.296 3.964 2.896 1.286.6 2.458.572 3.128.097.67-.475.613-1.267.613-1.267s.05-.278-.235-.558c-.286-.28-1.26-.934-1.849-1.146-.589-.212-.854.181-.854.181z"/>
                  </svg>
                  Envoyer la commande via WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCart([])}
                  className="w-full mt-2 text-wood-500 border-wood-200 hover:bg-wood-50"
                >
                  Vider le panier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── ADMIN PANEL ───────────────────────────────── */}
      <Dialog open={adminOpen} onOpenChange={(open) => { if (!open) setAdminOpen(false) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-grill-500" />
              Administration
            </DialogTitle>
          </DialogHeader>

          {!adminAuthenticated ? (
            <div className="p-8 text-center space-y-4">
              <ShieldCheck className="w-12 h-12 text-grill-500 mx-auto" />
              <h3 className="font-serif text-lg font-bold">Accès Administrateur</h3>
              <p className="text-wood-500 text-sm">Entrez le code PIN pour accéder</p>
              <div className="max-w-xs mx-auto">
                <Input
                  type="password"
                  placeholder="Code PIN"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="text-center text-2xl tracking-[0.5em] border-wood-200 focus:border-grill-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && adminPin === '1234') {
                      setAdminAuthenticated(true)
                      toast.success('Accès autorisé')
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => {
                  if (adminPin === '1234') {
                    setAdminAuthenticated(true)
                    toast.success('Accès autorisé')
                  } else {
                    toast.error('Code PIN incorrect')
                  }
                }}
                className="bg-grill-500 hover:bg-grill-600 text-white"
              >
                <Check className="w-4 h-4 mr-2" /> Confirmer
              </Button>
            </div>
          ) : (
          <>
          <Tabs value={adminTab} onValueChange={setAdminTab} className="px-6">
            <TabsList className="mb-4 bg-wood-100 flex-wrap h-auto gap-1">
              <TabsTrigger value="menu" className="data-[state=active]:bg-grill-500 data-[state=active]:text-white text-xs sm:text-sm">
                Menu ({adminData?.stats.totalItems ?? '...'})
              </TabsTrigger>
              <TabsTrigger value="specials" className="data-[state=active]:bg-grill-500 data-[state=active]:text-white text-xs sm:text-sm">
                Plats du Jour
              </TabsTrigger>
              <TabsTrigger value="reservations" className="data-[state=active]:bg-grill-500 data-[state=active]:text-white text-xs sm:text-sm">
                Réservations ({adminData?.stats.pendingReservations ?? '...'})
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-grill-500 data-[state=active]:text-white text-xs sm:text-sm">
                Messages ({adminData?.stats.newInquiries ?? '...'})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="max-h-[65vh]">
              {/* ── Menu Tab ── */}
              <TabsContent value="menu" className="mt-0">
                {adminLoading && !adminData ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
                  </div>
                ) : adminData ? (
                  <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Plats', value: adminData.stats.totalItems },
                        { label: 'Catégories', value: adminData.categories.length },
                        { label: 'Réservations', value: adminData.stats.totalReservations },
                        { label: 'Messages', value: adminData.stats.totalInquiries },
                      ].map(s => (
                        <div key={s.label} className="bg-wood-50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-grill-600">{s.value}</p>
                          <p className="text-xs text-wood-500">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Categories */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-wood-900">Catégories</h3>
                        <Button size="sm" onClick={openNewCategory} className="bg-grill-500 hover:bg-grill-600 text-white">
                          <Plus className="w-4 h-4" /> Catégorie
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {adminData.categories.map(cat => (
                          <div key={cat.id} className="flex items-center justify-between bg-wood-50 rounded-lg px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <Flame className="w-4 h-4 text-grill-500" />
                              <span className="font-medium text-wood-800 text-sm">{cat.name}</span>
                              <Badge variant="secondary" className="bg-wood-200 text-wood-600 text-xs">
                                {cat.items.length} item{cat.items.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCategory(cat)}>
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-ember-500 hover:text-ember-600"
                                onClick={() => { if (confirm('Supprimer cette catégorie et tous ses items ?')) handleAdminAction('deleteCategory', { id: cat.id }) }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Items Table */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-wood-900">Articles</h3>
                        <Button size="sm" onClick={() => { setEditingItem(null); setItemForm({ name: '', description: '', price: '', categoryId: adminData.categories[0]?.id || '', featured: false, available: true, order: 0 }); setShowItemForm(true) }} className="bg-grill-500 hover:bg-grill-600 text-white">
                          <Plus className="w-4 h-4" /> Article
                        </Button>
                      </div>
                      <div className="border border-wood-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-wood-50 border-b border-wood-200">
                                <th className="text-left px-3 py-2 text-wood-600 font-medium">Nom</th>
                                <th className="text-left px-3 py-2 text-wood-600 font-medium hidden sm:table-cell">Catégorie</th>
                                <th className="text-left px-3 py-2 text-wood-600 font-medium">Prix</th>
                                <th className="text-center px-3 py-2 text-wood-600 font-medium">Actif</th>
                                <th className="text-center px-3 py-2 text-wood-600 font-medium">Star</th>
                                <th className="text-right px-3 py-2 text-wood-600 font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminData.categories.flatMap(cat =>
                                cat.items.map(item => (
                                  <tr key={item.id} className="border-b border-wood-100 last:border-0 hover:bg-wood-50">
                                    <td className="px-3 py-2.5 text-wood-800 font-medium">{item.name}</td>
                                    <td className="px-3 py-2.5 text-wood-500 hidden sm:table-cell">{cat.name}</td>
                                    <td className="px-3 py-2.5 text-gold-500 font-semibold">{formatPrice(item.price)}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`inline-block w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : 'bg-wood-300'}`} />
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      {item.featured && <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400 inline" />}
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditItem(item)}>
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-ember-500 hover:text-ember-600"
                                          onClick={() => { if (confirm('Supprimer cet article ?')) handleAdminAction('deleteItem', { id: item.id }) }}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </TabsContent>

              {/* ── Reservations Tab ── */}
              <TabsContent value="reservations" className="mt-0">
                {adminLoading && !adminData ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
                  </div>
                ) : reservations.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-wood-300 mx-auto mb-3" />
                    <p className="text-wood-500">Aucune réservation pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reservations.map(res => {
                      const badge = getStatusBadge(res.status)
                      return (
                        <div key={res.id} className="border border-wood-200 rounded-lg p-4 hover:bg-wood-50 transition-colors">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h4 className="font-semibold text-wood-900">{res.name}</h4>
                              <p className="text-sm text-wood-500">{res.phone}</p>
                            </div>
                            <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-wood-600 mb-3">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {res.date}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {res.time}</span>
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {res.guests} pers.</span>
                          </div>
                          {res.message && (
                            <p className="text-sm text-wood-400 italic mb-3">&ldquo;{res.message}&rdquo;</p>
                          )}
                          <div className="flex items-center gap-2">
                            {res.status !== 'confirmed' && (
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleReservationStatusUpdate(res.id, 'confirmed')}>
                                <Check className="w-3.5 h-3.5" /> Confirmer
                              </Button>
                            )}
                            {res.status !== 'cancelled' && (
                              <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleReservationStatusUpdate(res.id, 'cancelled')}>
                                <X className="w-3.5 h-3.5" /> Annuler
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* ── Plats du Jour Tab ── */}
              <TabsContent value="specials" className="mt-0">
                {adminLoading && !adminData ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-wood-900">Plats du Jour (7 jours)</h3>
                      <Button size="sm" onClick={() => {
                        setEditingSpecial(null)
                        setSpecialForm({ name: '', description: '', image: '', dayOfWeek: 0, originalPrice: '', discountType: 'percentage', specialPrice: '', discountPercent: '15', active: true, order: 0 })
                        setShowSpecialForm(true)
                      }} className="bg-grill-500 hover:bg-grill-600 text-white">
                        <Plus className="w-4 h-4" /> Plat du Jour
                      </Button>
                    </div>
                    <p className="text-xs text-wood-400 mb-4">Gérez les plats du jour de la semaine. Choisissez entre une réduction en pourcentage ou un prix fixe réduit.</p>

                    {adminData?.dailySpecials && adminData.dailySpecials.length > 0 ? (
                      <div className="space-y-3">
                        {adminData.dailySpecials.map(s => {
                          const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
                          const dayLabel = dayNames[s.dayOfWeek] || `Jour ${s.dayOfWeek}`
                          const isToday = new Date().getDay() === s.dayOfWeek
                          const computedPrice = s.discountType === 'percentage' && s.discountPercent
                            ? s.originalPrice - Math.round(s.originalPrice * s.discountPercent / 100)
                            : s.specialPrice || s.originalPrice
                          const discountBadge = s.discountType === 'percentage' && s.discountPercent
                            ? `-${s.discountPercent}%`
                            : s.specialPrice && s.specialPrice < s.originalPrice
                              ? `-${Math.round(((s.originalPrice - s.specialPrice) / s.originalPrice) * 100)}%`
                              : null

                          return (
                            <div key={s.id} className={`border rounded-lg p-4 hover:bg-wood-50 transition-colors ${isToday ? 'border-gold-400 bg-gold-50/50' : 'border-wood-200'}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className={isToday ? 'bg-gold-100 text-gold-700 border-gold-300' : 'bg-wood-100 text-wood-600'}>
                                      {dayLabel}
                                    </Badge>
                                    {isToday && <Badge className="bg-green-500 text-white border-none text-xs">En cours</Badge>}
                                    {!s.active && <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200 text-xs">Inactif</Badge>}
                                  </div>
                                  <h4 className="font-semibold text-wood-900 text-sm">{s.name}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    {discountBadge && (
                                      <Badge className="bg-ember-500/90 text-white border-none text-xs font-bold">{discountBadge}</Badge>
                                    )}
                                    <span className="text-wood-500 text-xs line-through">{formatPrice(s.originalPrice)}</span>
                                    <span className="text-gold-500 font-bold text-sm">{formatPrice(computedPrice)}</span>
                                    <Badge variant="secondary" className="text-xs bg-wood-100 text-wood-500">
                                      {s.discountType === 'percentage' ? '% de réduction' : 'Prix fixe'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                    setEditingSpecial(s)
                                    setSpecialForm({
                                      name: s.name,
                                      description: s.description || '',
                                      image: s.image || '',
                                      dayOfWeek: s.dayOfWeek,
                                      originalPrice: s.originalPrice.toString(),
                                      discountType: s.discountType,
                                      specialPrice: s.specialPrice?.toString() || '',
                                      discountPercent: s.discountPercent?.toString() || '',
                                      active: s.active,
                                      order: s.order,
                                    })
                                    setShowSpecialForm(true)
                                  }}>
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-ember-500 hover:text-ember-600"
                                    onClick={() => { if (confirm('Supprimer ce plat du jour ?')) handleAdminAction('deleteDailySpecial', { id: s.id }) }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Flame className="w-12 h-12 text-wood-300 mx-auto mb-3" />
                        <p className="text-wood-500">Aucun plat du jour configuré</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* ── Messages Tab ── */}
              <TabsContent value="messages" className="mt-0">
                {adminLoading && !adminData ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-wood-300 mx-auto mb-3" />
                    <p className="text-wood-500">Aucun message pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inquiries.map(inq => {
                      const badge = getStatusBadge(inq.status)
                      return (
                        <div key={inq.id} className="border border-wood-200 rounded-lg p-4 hover:bg-wood-50 transition-colors">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h4 className="font-semibold text-wood-900">{inq.name}</h4>
                              <p className="text-sm text-wood-500">{inq.phone || ''}</p>
                            </div>
                            <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                          </div>
                          {inq.subject && (
                            <p className="text-sm font-medium text-wood-700 mb-1">{inq.subject}</p>
                          )}
                          <p className="text-sm text-wood-500 mb-3">{inq.message}</p>
                          <div className="flex items-center gap-2">
                            {inq.status !== 'read' && (
                              <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleContactStatusUpdate(inq.id, 'read')}>
                                <Eye className="w-3.5 h-3.5" /> Marquer comme lu
                              </Button>
                            )}
                            {inq.status !== 'replied' && (
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleContactStatusUpdate(inq.id, 'replied')}>
                                <Check className="w-3.5 h-3.5" /> Marquer comme répondu
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Item Form Dialog */}
          <Dialog open={showItemForm} onOpenChange={setShowItemForm}>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="font-serif">
                  {editingItem ? 'Modifier l\'article' : 'Nouvel article'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-wood-700">Nom <span className="text-ember-500">*</span></Label>
                  <Input
                    value={itemForm.name}
                    onChange={(e) => setItemForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nom du plat"
                    className="border-wood-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-wood-700">Description</Label>
                  <Textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description du plat"
                    rows={2}
                    className="border-wood-200 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-wood-700">Prix (F) <span className="text-ember-500">*</span></Label>
                    <Input
                      type="number"
                      value={itemForm.price}
                      onChange={(e) => setItemForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="2000"
                      className="border-wood-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-wood-700">Catégorie <span className="text-ember-500">*</span></Label>
                    <select
                      value={itemForm.categoryId}
                      onChange={(e) => setItemForm(f => ({ ...f, categoryId: e.target.value }))}
                      className="w-full h-9 rounded-md border border-wood-200 bg-background px-3 py-1 text-sm focus:border-grill-400 focus:ring-grill-400/20 focus:outline-none"
                    >
                      <option value="">Sélectionner</option>
                      {adminData?.categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={itemForm.featured}
                      onCheckedChange={(c) => setItemForm(f => ({ ...f, featured: c }))}
                    />
                    <span className="text-sm text-wood-700">Mis en avant</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={itemForm.available}
                      onCheckedChange={(c) => setItemForm(f => ({ ...f, available: c }))}
                    />
                    <span className="text-sm text-wood-700">Disponible</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label className="text-wood-700">Ordre d&apos;affichage</Label>
                  <Input
                    type="number"
                    value={itemForm.order}
                    onChange={(e) => setItemForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                    className="border-wood-200"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveItem} className="flex-1 bg-grill-500 hover:bg-grill-600 text-white">
                    <Check className="w-4 h-4" />
                    {editingItem ? 'Mettre à jour' : 'Créer'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowItemForm(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Category Form Dialog */}
          <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="font-serif">
                  {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-wood-700">Nom <span className="text-ember-500">*</span></Label>
                  <Input
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="Nom de la catégorie"
                    className="border-wood-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-wood-700">Slug <span className="text-ember-500">*</span></Label>
                  <Input
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="nom-de-la-categorie"
                    className="border-wood-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-wood-700">Ordre d&apos;affichage</Label>
                  <Input
                    type="number"
                    value={categoryForm.order}
                    onChange={(e) => setCategoryForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                    className="border-wood-200"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveCategory} className="flex-1 bg-grill-500 hover:bg-grill-600 text-white">
                    <Check className="w-4 h-4" />
                    {editingCategory ? 'Mettre à jour' : 'Créer'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCategoryForm(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Daily Special Form Dialog */}
          <Dialog open={showSpecialForm} onOpenChange={setShowSpecialForm}>
            <DialogContent className="max-w-lg bg-white">
              <DialogHeader>
                <DialogTitle className="font-serif flex items-center gap-2">
                  <Flame className="w-5 h-5 text-gold-500" />
                  {editingSpecial ? 'Modifier le plat du jour' : 'Nouveau plat du jour'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-wood-700">Nom du plat <span className="text-ember-500">*</span></Label>
                  <Input
                    value={specialForm.name}
                    onChange={(e) => setSpecialForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Mix Deen's Grill"
                    className="border-wood-200"
                  />
                </div>
                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-wood-700">Description</Label>
                  <Textarea
                    value={specialForm.description}
                    onChange={(e) => setSpecialForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description courte du plat"
                    className="border-wood-200"
                    rows={2}
                  />
                </div>
                {/* Image URL */}
                <div className="space-y-2">
                  <Label className="text-wood-700">Image (URL ou chemin)</Label>
                  <Input
                    value={specialForm.image}
                    onChange={(e) => setSpecialForm(f => ({ ...f, image: e.target.value }))}
                    placeholder="/food-mixgrill-real.jpeg"
                    className="border-wood-200"
                  />
                </div>
                {/* Day of week */}
                <div className="space-y-2">
                  <Label className="text-wood-700">Jour de la semaine <span className="text-ember-500">*</span></Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day, i) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSpecialForm(f => ({ ...f, dayOfWeek: i }))}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                          specialForm.dayOfWeek === i
                            ? 'bg-grill-500 text-white border-grill-500'
                            : 'bg-white text-wood-600 border-wood-200 hover:bg-wood-50'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Original Price */}
                <div className="space-y-2">
                  <Label className="text-wood-700">Prix original (F) <span className="text-ember-500">*</span></Label>
                  <Input
                    type="number"
                    value={specialForm.originalPrice}
                    onChange={(e) => setSpecialForm(f => ({ ...f, originalPrice: e.target.value }))}
                    placeholder="5000"
                    className="border-wood-200"
                  />
                </div>

                {/* Discount Type Selector */}
                <div className="space-y-2">
                  <Label className="text-wood-700">Type de réduction</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSpecialForm(f => ({ ...f, discountType: 'percentage' }))}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border text-center ${
                        specialForm.discountType === 'percentage'
                          ? 'bg-grill-500 text-white border-grill-500 shadow-md'
                          : 'bg-white text-wood-600 border-wood-200 hover:bg-wood-50'
                      }`}
                    >
                      <div className="text-lg mb-0.5">%</div>
                      <div className="text-xs">Pourcentage</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecialForm(f => ({ ...f, discountType: 'fixed_price' }))}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border text-center ${
                        specialForm.discountType === 'fixed_price'
                          ? 'bg-grill-500 text-white border-grill-500 shadow-md'
                          : 'bg-white text-wood-600 border-wood-200 hover:bg-wood-50'
                      }`}
                    >
                      <div className="text-lg mb-0.5">💲</div>
                      <div className="text-xs">Prix fixe</div>
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                {specialForm.discountType === 'percentage' ? (
                  <div className="space-y-2">
                    <Label className="text-wood-700">Pourcentage de réduction (%)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={specialForm.discountPercent}
                        onChange={(e) => setSpecialForm(f => ({ ...f, discountPercent: e.target.value }))}
                        placeholder="15"
                        className="border-wood-200"
                      />
                      <span className="text-wood-500 text-sm">%</span>
                    </div>
                    {specialForm.originalPrice && specialForm.discountPercent && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-wood-500">
                        <span>Prix original : {formatPrice(parseInt(specialForm.originalPrice))}</span>
                        <span>→</span>
                        <span className="text-gold-600 font-semibold">
                          {formatPrice(parseInt(specialForm.originalPrice) - Math.round(parseInt(specialForm.originalPrice) * parseInt(specialForm.discountPercent) / 100))}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-wood-700">Prix réduit (F)</Label>
                    <Input
                      type="number"
                      value={specialForm.specialPrice}
                      onChange={(e) => setSpecialForm(f => ({ ...f, specialPrice: e.target.value }))}
                      placeholder="3500"
                      className="border-wood-200"
                    />
                    {specialForm.originalPrice && specialForm.specialPrice && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-wood-500">
                        <span>Prix original : {formatPrice(parseInt(specialForm.originalPrice))}</span>
                        <span>→</span>
                        <span className="text-gold-600 font-semibold">{formatPrice(parseInt(specialForm.specialPrice))}</span>
                        <Badge className="bg-ember-500/90 text-white border-none text-xs font-bold">
                          -{Math.round(((parseInt(specialForm.originalPrice) - parseInt(specialForm.specialPrice)) / parseInt(specialForm.originalPrice)) * 100)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Active toggle */}
                <div className="flex items-center justify-between py-2">
                  <Label className="text-wood-700">Actif</Label>
                  <Switch
                    checked={specialForm.active}
                    onCheckedChange={(checked) => setSpecialForm(f => ({ ...f, active: checked }))}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => {
                    if (!specialForm.name || !specialForm.originalPrice) {
                      toast.error('Nom et prix original sont requis')
                      return
                    }
                    if (specialForm.discountType === 'percentage' && !specialForm.discountPercent) {
                      toast.error('Veuillez entrer un pourcentage de réduction')
                      return
                    }
                    if (specialForm.discountType === 'fixed_price' && !specialForm.specialPrice) {
                      toast.error('Veuillez entrer le prix réduit')
                      return
                    }
                    const payload = {
                      ...specialForm,
                      originalPrice: parseInt(specialForm.originalPrice),
                      specialPrice: specialForm.discountType === 'fixed_price' ? parseInt(specialForm.specialPrice) : null,
                      discountPercent: specialForm.discountType === 'percentage' ? parseInt(specialForm.discountPercent) : null,
                    }
                    if (editingSpecial) {
                      handleAdminAction('updateDailySpecial', { ...payload, id: editingSpecial.id })
                    } else {
                      handleAdminAction('createDailySpecial', payload)
                    }
                    setShowSpecialForm(false)
                    setEditingSpecial(null)
                    // Refresh today's special on frontend
                    fetch('/api/daily-special').then(r => r.json()).then(data => {
                      if (data.active) setTodaySpecial(data)
                      else setTodaySpecial(null)
                    }).catch(() => {})
                  }} className="flex-1 bg-grill-500 hover:bg-grill-600 text-white">
                    <Check className="w-4 h-4" />
                    {editingSpecial ? 'Mettre à jour' : 'Créer'}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowSpecialForm(false); setEditingSpecial(null) }}>
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
