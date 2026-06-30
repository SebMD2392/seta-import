import { useState, useMemo, useRef, useEffect } from "react";
import {
  ShoppingCart, X, Plus, Minus, Trash2, Search, Package,
  PenLine, ImageOff, ChevronDown, Lock, LogOut, Settings,
  Check, DollarSign, Eye, Phone, Save,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  bulkPrice: number;      // precio por mayor
  bulkMinQty: number;     // cantidad mínima para precio mayor
  description: string;
  image: string;
  inStock: boolean;       // disponibilidad del producto
  isCoverProduct?: boolean; // true = funda de control (requiere selección de color)
}

interface CartItem {
  product: Product;
  qty: number;
  isBulk: boolean;
  selectedColor?: string; // color de funda, solo para productos de tipo funda
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ADMIN_PIN = "0130";
const WHATSAPP_STORAGE_KEY = "seta_whatsapp_contacts_v2";

interface WhatsAppContact {
  id: string;
  label: string;   // e.g. "Ventas", "Soporte"
  number: string;  // digits only, e.g. "51987654321"
}

const DEFAULT_CONTACTS: WhatsAppContact[] = [
  { id: "default", label: "Ventas", number: "51999999999" },
];

function getStoredContacts(): WhatsAppContact[] {
  try {
    const raw = localStorage.getItem(WHATSAPP_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTACTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CONTACTS;
  } catch {
    return DEFAULT_CONTACTS;
  }
}

function saveContacts(contacts: WhatsAppContact[]) {
  try {
    localStorage.setItem(WHATSAPP_STORAGE_KEY, JSON.stringify(contacts));
  } catch {}
}

const COVER_COLORS: { name: string; hex: string; emoji: string }[] = [
  { name: "Negro",      hex: "#1A1A1A", emoji: "⚫" },
  { name: "Blanco",     hex: "#F5F5F5", emoji: "⚪" },
  { name: "Rojo",       hex: "#DC2626", emoji: "🔴" },
  { name: "Azul",       hex: "#2563EB", emoji: "🔵" },
  { name: "Verde",      hex: "#16A34A", emoji: "🟢" },
  { name: "Amarillo",   hex: "#EAB308", emoji: "🟡" },
  { name: "Naranja",    hex: "#EA580C", emoji: "🟠" },
  { name: "Rosado",     hex: "#EC4899", emoji: "🩷" },
  { name: "Morado",     hex: "#7C3AED", emoji: "🟣" },
  { name: "Celeste",    hex: "#0EA5E9", emoji: "🩵" },
  { name: "Gris",       hex: "#6B7280", emoji: "🩶" },
  { name: "Transparente", hex: "#E0F2FE", emoji: "🫧" },
];

const DEFAULT_BRAND_META: Record<string, { color: string; bg: string }> = {
  Samsung:    { color: "#1428A0", bg: "#EEF1FF" },
  LG:         { color: "#A50034", bg: "#FFEEF1" },
  Sony:       { color: "#1a1a1a", bg: "#F0F0F0" },
  Philips:    { color: "#0B5ED7", bg: "#E8F0FE" },
  TCL:        { color: "#C8102E", bg: "#FFEEF1" },
  Universal:  { color: "#2A7A2A", bg: "#E8F5E8" },
  Accesorios: { color: "#7A4F1A", bg: "#FDF3E3" },
  "Fundas de Control": { color: "#6D28D9", bg: "#F5F3FF" },
};

const PALETTE_OPTIONS = [
  { color: "#1428A0", bg: "#EEF1FF" },
  { color: "#A50034", bg: "#FFEEF1" },
  { color: "#0B5ED7", bg: "#E8F0FE" },
  { color: "#C8102E", bg: "#FFEEF1" },
  { color: "#2A7A2A", bg: "#E8F5E8" },
  { color: "#7A4F1A", bg: "#FDF3E3" },
  { color: "#6B21A8", bg: "#F3E8FF" },
  { color: "#0E7490", bg: "#E0F2FE" },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 1,  name: "Control Samsung Smart TV 4K",     brand: "Samsung",    price: 18.99, bulkPrice: 15.00, bulkMinQty: 5, description: "Compatible con Smart TV Samsung 2018–2024. Series TU, AU, CU.", inStock: true, image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop&auto=format" },
  { id: 2,  name: "Control Samsung The Frame",        brand: "Samsung",    price: 22.50, bulkPrice: 18.00, bulkMinQty: 5, description: "Serie The Frame, The Serif y The Sero. Con botón de arte.", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 3,  name: "Control Samsung QLED 8K",          brand: "Samsung",    price: 28.00, bulkPrice: 22.00, bulkMinQty: 5, description: "Series Q900, Q950 y Neo QLED. Control con voz.", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 4,  name: "Control LG Magic Remote 2022",     brand: "LG",         price: 24.99, bulkPrice: 20.00, bulkMinQty: 5, description: "WebOS 22 en adelante. Control por movimiento y puntero.", image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 5,  name: "Control LG OLED evo C3",           brand: "LG",         price: 21.99, bulkPrice: 17.50, bulkMinQty: 5, description: "Series C1, C2, C3 OLED. Con teclas de streaming integradas.", image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 6,  name: "Control LG NanoCell",              brand: "LG",         price: 16.50, bulkPrice: 13.00, bulkMinQty: 5, description: "Series NANO75, NANO85, NANO90 y NANO99.", image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 7,  name: "Control Sony Bravia XR",           brand: "Sony",       price: 20.00, bulkPrice: 16.00, bulkMinQty: 5, description: "Google TV. Modelos A80J, X90J, X95J y Z9J.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 8,  name: "Control Sony Android TV",          brand: "Sony",       price: 16.50, bulkPrice: 13.00, bulkMinQty: 5, description: "Android TV. Series X80K, X85K, X90K y X95K.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 9,  name: "Control Philips Ambilight 4K",     brand: "Philips",    price: 17.99, bulkPrice: 14.00, bulkMinQty: 5, description: "Series OLED706, OLED807 con tecnología Ambilight.", image: "https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 10, name: "Control Philips Android TV",       brand: "Philips",    price: 13.50, bulkPrice: 10.50, bulkMinQty: 5, description: "Android TV series 5000, 6000 y 7000.", image: "https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 11, name: "Control TCL Roku TV",              brand: "TCL",        price: 13.99, bulkPrice: 11.00, bulkMinQty: 5, description: "Compatible con Roku TV y Android TV TCL.", image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 12, name: "Control TCL QLED 4K",              brand: "TCL",        price: 15.00, bulkPrice: 12.00, bulkMinQty: 5, description: "Series C725, C825 y C925 con Dolby Vision.", image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 13, name: "Control Universal 8 en 1",         brand: "Universal",  price: 12.99, bulkPrice: 10.00, bulkMinQty: 5, description: "Programa hasta 8 dispositivos. Compatible con todas las marcas.", image: "https://images.unsplash.com/photo-1563207153-f403bf289096?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 14, name: "Control Universal IR Aprendizaje", brand: "Universal",  price: 9.99,  bulkPrice: 7.50,  bulkMinQty: 5, description: "Copia cualquier control infrarrojo existente.", image: "https://images.unsplash.com/photo-1563207153-f403bf289096?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 15, name: "Control Universal Smart RF+IR",    brand: "Universal",  price: 19.99, bulkPrice: 16.00, bulkMinQty: 5, description: "RF + Infrarrojo. Funciona a través de paredes.", image: "https://images.unsplash.com/photo-1563207153-f403bf289096?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 16, name: "Pilas AA Duracell x4",             brand: "Accesorios", price: 4.99,  bulkPrice: 3.80,  bulkMinQty: 10, description: "Pilas alcalinas de larga duración para controles remotos.", image: "https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 17, name: "Cable HDMI 2.0 Ultra HD 2m",       brand: "Accesorios", price: 8.99,  bulkPrice: 7.00,  bulkMinQty: 10, description: "HDMI 2.0, 4K 60Hz, 18Gbps. Compatible con ARC y eARC.", image: "https://images.unsplash.com/photo-1558618047-f4e731f1b8a2?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 18, name: "Soporte TV Universal 32\"-65\"",   brand: "Accesorios", price: 29.99, bulkPrice: 24.00, bulkMinQty: 3, description: "Soporte de pared articulado. Inclinación y giro 180°.", image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&h=500&fit=crop&auto=format", inStock: true },
  { id: 19, name: "Adaptador WiFi USB TV",            brand: "Accesorios", price: 11.50, bulkPrice: 9.00,  bulkMinQty: 5, description: "Convierte cualquier TV en Smart TV. 150Mbps 2.4GHz.", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&h=500&fit=crop&auto=format", inStock: true },
  // ── Fundas de Control ──
  { id: 20, name: "Funda Silicona Universal",          brand: "Fundas de Control", price: 5.99,  bulkPrice: 4.50,  bulkMinQty: 10, description: "Silicona suave antideslizante. Compatible con la mayoría de controles remotos.", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=500&fit=crop&auto=format", inStock: true, isCoverProduct: true },
  { id: 21, name: "Funda TPU Samsung Smart TV",        brand: "Fundas de Control", price: 6.99,  bulkPrice: 5.50,  bulkMinQty: 10, description: "Funda TPU de alta resistencia. Diseñada para controles Samsung series TU, AU, CU.", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=500&fit=crop&auto=format", inStock: true, isCoverProduct: true },
  { id: 22, name: "Funda Silicona LG Magic Remote",    brand: "Fundas de Control", price: 7.50,  bulkPrice: 6.00,  bulkMinQty: 10, description: "Funda específica para LG Magic Remote 2020–2024. Protección total con acceso a todos los botones.", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=500&fit=crop&auto=format", inStock: true, isCoverProduct: true },
  { id: 23, name: "Funda Lavable con Cordón",          brand: "Fundas de Control", price: 4.99,  bulkPrice: 3.80,  bulkMinQty: 10, description: "Funda lavable con cordón ajustable. Mantiene el control limpio y sin gérmenes.", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=500&fit=crop&auto=format", inStock: true, isCoverProduct: true },
  { id: 24, name: "Funda Premium Cuero PU",            brand: "Fundas de Control", price: 9.99,  bulkPrice: 8.00,  bulkMinQty: 5,  description: "Funda de cuero PU premium. Acabado elegante con protección contra golpes y rayones.", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=500&fit=crop&auto=format", inStock: true, isCoverProduct: true },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildWhatsAppMessage(cart: CartItem[]): string {
  const lines = cart.map(
    (i) => {
      const unitLabel = i.isBulk ? "mayor" : "unidad";
      const unitPrice = i.isBulk ? i.product.bulkPrice : i.product.price;
      const colorLabel = i.selectedColor ? ` | Color: ${i.selectedColor}` : "";
      return `• ${i.product.name} (${i.product.brand}) x${i.qty} [${unitLabel}]${colorLabel} — S/. ${(unitPrice * i.qty).toFixed(2)}`;
    }
  );
  const total = cart.reduce((s, i) => {
    const unitPrice = i.isBulk ? i.product.bulkPrice : i.product.price;
    return s + unitPrice * i.qty;
  }, 0);
  const text = `¡Hola SETA IMPORT! Quisiera realizar el siguiente pedido:\n\n${lines.join("\n")}\n\n*Total: S/. ${total.toFixed(2)}*\n\n¿Tienen disponibilidad? 🙏`;
  return encodeURIComponent(text);
}

function getBrandMeta(brand: string, meta: Record<string, { color: string; bg: string }>) {
  return meta[brand] ?? { color: "#555", bg: "#eee" };
}

function getBrandInitials(brand: string) {
  return brand.slice(0, 2).toUpperCase();
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [brandMeta, setBrandMeta] = useState(DEFAULT_BRAND_META);
  const [activeBrand, setActiveBrand] = useState("Todos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [nextId, setNextId] = useState(25);
  const [waContacts, setWaContacts] = useState<WhatsAppContact[]>(getStoredContacts);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [colorPickerModal, setColorPickerModal] = useState<{ product: Product; isBulk: boolean } | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const allBrands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand));
    return ["Todos", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const brandOk = activeBrand === "Todos" || p.brand === activeBrand;
      const searchOk =
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return brandOk && searchOk;
    });
  }, [products, activeBrand, search]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => {
    const unitPrice = i.isBulk ? i.product.bulkPrice : i.product.price;
    return s + unitPrice * i.qty;
  }, 0);

  function addProduct(data: Omit<Product, "id">, newBrandMeta?: { color: string; bg: string }) {
    const newProduct: Product = { id: nextId, ...data };
    setNextId((n) => n + 1);
    setProducts((prev) => [...prev, newProduct]);
    if (newBrandMeta && !brandMeta[data.brand]) {
      setBrandMeta((prev) => ({ ...prev, [data.brand]: newBrandMeta }));
    }
    setActiveBrand(data.brand);
  }

  function saveEditProduct(updated: Product) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setCart((prev) =>
      prev.map((i) => (i.product.id === updated.id ? { ...i, product: updated } : i))
    );
    setEditProduct(null);
  }

  function deleteProduct(id: number) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }

  function toggleStock(id: number) {
    let nowOutOfStock = false;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          nowOutOfStock = p.inStock; // if currently inStock, toggling makes it out
          return { ...p, inStock: !p.inStock };
        }
        return p;
      })
    );
    if (nowOutOfStock) {
      setCart((prev) => prev.filter((i) => i.product.id !== id));
    }
  }

  function addToCart(product: Product, isBulk: boolean, selectedColor?: string) {
    setCart((prev) => {
      const found = prev.find((i) =>
        i.product.id === product.id &&
        i.isBulk === isBulk &&
        i.selectedColor === selectedColor
      );
      if (found) return prev.map((i) =>
        (i.product.id === product.id && i.isBulk === isBulk && i.selectedColor === selectedColor)
          ? { ...i, qty: i.qty + 1 } : i
      );
      return [...prev, { product, qty: 1, isBulk, selectedColor }];
    });
  }

  function setCartQty(id: number, isBulk: boolean, qty: number, selectedColor?: string) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => !(i.product.id === id && i.isBulk === isBulk && i.selectedColor === selectedColor)));
    } else {
      setCart((prev) =>
        prev.map((i) =>
          (i.product.id === id && i.isBulk === isBulk && i.selectedColor === selectedColor) ? { ...i, qty } : i
        )
      );
    }
  }

  function updateQty(id: number, isBulk: boolean, delta: number, selectedColor?: string) {
    setCart((prev) =>
      prev.map((i) =>
        (i.product.id === id && i.isBulk === isBulk && i.selectedColor === selectedColor) ? { ...i, qty: i.qty + delta } : i
      ).filter((i) => i.qty > 0)
    );
  }

  function removeFromCart(id: number, isBulk: boolean, selectedColor?: string) {
    setCart((prev) => prev.filter((i) => !(i.product.id === id && i.isBulk === isBulk && i.selectedColor === selectedColor)));
  }

  function sendWhatsApp(contact: WhatsAppContact) {
    if (!cart.length) return;
    window.open(`https://wa.me/${contact.number}?text=${buildWhatsAppMessage(cart)}`, "_blank");
    setContactPickerOpen(false);
  }

  function handleOpenSend() {
    if (!cart.length) return;
    if (waContacts.length === 1) {
      sendWhatsApp(waContacts[0]);
    } else {
      setContactPickerOpen(true);
    }
  }

  function handleSaveContacts(contacts: WhatsAppContact[]) {
    setWaContacts(contacts);
    saveContacts(contacts);
    setWhatsappModalOpen(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAddModalOpen(false);
        setCartOpen(false);
        setLoginOpen(false);
        setEditProduct(null);
        setWhatsappModalOpen(false);
        setContactPickerOpen(false);
        setColorPickerModal(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "transparent", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Admin banner ── */}
      {isAdmin && (
        <div style={{ background: "#F5A800", color: "#1A1A1A" }} className="text-xs font-bold text-center py-2 px-4 flex items-center justify-center gap-2 flex-wrap">
          <Settings className="w-3.5 h-3.5" />
          <span>Modo administrador activo</span>
          <span className="hidden sm:inline">— los cambios son visibles para todos los compradores</span>
          <button
            onClick={() => setIsAdmin(false)}
            className="ml-3 underline underline-offset-2 hover:no-underline flex items-center gap-1 opacity-80 hover:opacity-100"
          >
            <Eye className="w-3 h-3" />
            Salir al modo comprador
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 shadow-lg" style={{ background: "rgba(28,28,28,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center gap-3">
          {/* Logo SETA IMPORT — más grande */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <img
              src="/logo.png"
              alt="SETA IMPORT"
              className="w-auto object-contain"
              style={{ height: "60px", filter: "brightness(1.08) drop-shadow(0 1px 4px rgba(0,0,0,0.3))" }}
            />
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xl hidden sm:block ml-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por marca o modelo…"
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(245,168,0,0.6)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                style={{ background: "#F5A800", color: "#1A1A1A" }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar producto</span>
              </button>
            )}

            {isAdmin ? (
              <button
                onClick={() => setIsAdmin(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
                title="Salir del modo admin"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
                title="Acceso administrador"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
              style={{ background: "#F5A800", color: "#1A1A1A" }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Carrito</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow"
                  style={{ background: "#fff", color: "#2C2C2C" }}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Brand Tabs ── */}
      <div className="sticky top-20 z-30" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(229,229,229,0.8)", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1.5 overflow-x-auto py-3 no-scrollbar">
            {allBrands.map((brand) => {
              const meta = getBrandMeta(brand, brandMeta);
              const active = activeBrand === brand;
              return (
                <button
                  key={brand}
                  onClick={() => setActiveBrand(brand)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all`}
                  style={active
                    ? { background: "#2C2C2C", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }
                    : { background: "#F4F4F4", color: "#777" }
                  }
                >
                  {brand !== "Todos" && (
                    <span
                      className="w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-black"
                      style={active
                        ? { background: "rgba(255,255,255,0.15)", color: "#fff" }
                        : { background: meta.bg, color: meta.color }
                      }
                    >
                      {getBrandInitials(brand)}
                    </span>
                  )}
                  {brand}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Mobile Search ── */}
      <div className="sm:hidden px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar controles…"
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
            style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(229,229,229,0.8)" }}
          />
        </div>
      </div>

      {/* ── Product Grid ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {activeBrand !== "Todos" && (
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{
                  background: getBrandMeta(activeBrand, brandMeta).bg,
                  color: getBrandMeta(activeBrand, brandMeta).color,
                }}
              >
                {getBrandInitials(activeBrand)}
              </span>
            )}
            <div>
              <h2
                className="text-2xl font-extrabold leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {activeBrand === "Todos" ? "Todo el catálogo" : activeBrand}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "#777" }}>
                {filtered.length} {filtered.length === 1 ? "producto" : "productos"} disponibles
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWhatsappModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all border"
                style={{ background: "#E8FFF1", border: "1px solid #25D366", color: "#128C4E" }}
                title="Gestionar números de WhatsApp"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp ({waContacts.length})</span>
                <span className="sm:hidden">WA</span>
              </button>
              <button
                onClick={() => setAddModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                style={{ background: "#F5A800", color: "#1A1A1A" }}
              >
                <Plus className="w-4 h-4" />
                Nuevo producto
              </button>
            </div>
          )}
        </div>

        {/* Leyenda precio mayor/unidad */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "#FFF3CD", color: "#856404", border: "1px solid #FFECB5" }}>
            <span>📦</span> Precio x mayor (mín. cantidad indicada)
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "#E8F5E9", color: "#2E7D32", border: "1px solid #C8E6C9" }}>
            <span>🛍️</span> Precio x unidad
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState query={search} isAdmin={isAdmin} onAdd={() => setAddModalOpen(true)} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((product) => {
              const cartItemsForProduct = cart.filter((i) => i.product.id === product.id);
              const cartItemUnit = cartItemsForProduct.find((i) => !i.isBulk && !i.selectedColor);
              const cartItemBulk = cartItemsForProduct.find((i) => i.isBulk && !i.selectedColor);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartItemUnit={cartItemUnit}
                  cartItemBulk={cartItemBulk}
                  cartItemsCover={cartItemsForProduct.filter((i) => i.selectedColor)}
                  brandMeta={brandMeta}
                  isAdmin={isAdmin}
                  onAddUnit={() => {
                    if (product.isCoverProduct) setColorPickerModal({ product, isBulk: false });
                    else addToCart(product, false);
                  }}
                  onAddBulk={() => {
                    if (product.isCoverProduct) setColorPickerModal({ product, isBulk: true });
                    else addToCart(product, true);
                  }}
                  onSetQtyUnit={(qty) => setCartQty(product.id, false, qty)}
                  onSetQtyBulk={(qty) => setCartQty(product.id, true, qty)}
                  onIncreaseUnit={() => updateQty(product.id, false, 1)}
                  onDecreaseUnit={() => updateQty(product.id, false, -1)}
                  onIncreaseBulk={() => updateQty(product.id, true, 1)}
                  onDecreaseBulk={() => updateQty(product.id, true, -1)}
                  onIncreaseColor={(color, isBulk) => updateQty(product.id, isBulk, 1, color)}
                  onDecreaseColor={(color, isBulk) => updateQty(product.id, isBulk, -1, color)}
                  onSetQtyColor={(color, isBulk, qty) => setCartQty(product.id, isBulk, qty, color)}
                  onDelete={() => deleteProduct(product.id)}
                  onEdit={() => setEditProduct(product)}
                  onToggleStock={() => toggleStock(product.id)}
                />
              );
            })}

            {isAdmin && (
              <button
                onClick={() => setAddModalOpen(true)}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl transition-all group min-h-[180px]"
                style={{ border: "2px dashed #F5C842", background: "rgba(255,251,234,0.8)" }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: "#FEF3C7" }}>
                  <Plus className="w-5 h-5" style={{ color: "#F5A800" }} />
                </div>
                <span className="text-xs font-bold text-center px-2" style={{ color: "#A37500" }}>Agregar producto</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* ── Cart Overlay ── */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${cartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(10,10,20,0.5)", backdropFilter: "blur(4px)" }}
        onClick={() => setCartOpen(false)}
      />

      {/* ── Cart Drawer ── */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${cartOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "#fff" }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #E5E5E5" }}>
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-xl font-extrabold leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              TU CARRITO
            </h2>
            {cartCount > 0 && (
              <span className="text-white text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#F5A800", color: "#1A1A1A" }}>{cartCount}</span>
            )}
          </div>
          <button onClick={() => setCartOpen(false)} className="p-2 rounded-lg transition-colors hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full pb-16" style={{ color: "#777" }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#F4F4F4" }}>
                <ShoppingCart className="w-9 h-9 opacity-30" />
              </div>
              <p className="font-semibold text-base" style={{ color: "#1A1A1A" }}>Tu carrito está vacío</p>
              <p className="text-sm mt-1 text-center max-w-[200px]">Agrega productos para continuar con tu pedido</p>
              <button onClick={() => setCartOpen(false)} className="mt-5 px-5 py-2 text-sm font-semibold rounded-xl transition-colors hover:brightness-110"
                style={{ background: "#2C2C2C", color: "#fff" }}>
                Ver productos
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <CartRow
                key={`${item.product.id}-${item.isBulk}-${item.selectedColor ?? ""}`}
                item={item}
                onIncrease={() => updateQty(item.product.id, item.isBulk, 1, item.selectedColor)}
                onDecrease={() => updateQty(item.product.id, item.isBulk, -1, item.selectedColor)}
                onSetQty={(qty) => setCartQty(item.product.id, item.isBulk, qty, item.selectedColor)}
                onRemove={() => removeFromCart(item.product.id, item.isBulk, item.selectedColor)}
              />
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="px-5 pb-6 pt-4 space-y-4" style={{ borderTop: "1px solid #E5E5E5", background: "#fff" }}>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: "#777" }}>Total del pedido</p>
                <p className="text-3xl font-extrabold leading-none mt-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  S/. {cartTotal.toFixed(2)}
                </p>
              </div>
              <p className="text-xs" style={{ color: "#777" }}>{cartCount} {cartCount === 1 ? "artículo" : "artículos"}</p>
            </div>
            <button
              onClick={handleOpenSend}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] hover:brightness-110 shadow-lg"
              style={{ background: "#25D366" }}
            >
              <WhatsAppIcon />
              Enviar pedido por WhatsApp
            </button>
            <p className="text-[11px] text-center" style={{ color: "#999" }}>Se abrirá WhatsApp con tu pedido listo para enviar</p>
          </div>
        )}
      </aside>

      {/* ── Floating Cart (mobile) ── */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-5 right-5 z-40 sm:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-2xl shadow-xl font-semibold text-sm active:scale-95 transition-transform"
            style={{ background: "#2C2C2C", color: "#fff" }}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Ver carrito</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: "#F5A800", color: "#1A1A1A" }}>{cartCount}</span>
          </button>
        </div>
      )}

      {/* ── Login Modal ── */}
      {loginOpen && (
        <AdminLoginModal
          onClose={() => setLoginOpen(false)}
          onSuccess={() => { setIsAdmin(true); setLoginOpen(false); }}
        />
      )}

      {whatsappModalOpen && isAdmin && (
        <WhatsAppAdminModal
          contacts={waContacts}
          onClose={() => setWhatsappModalOpen(false)}
          onSave={handleSaveContacts}
        />
      )}

      {contactPickerOpen && waContacts.length > 1 && (
        <ContactPickerModal
          contacts={waContacts}
          onClose={() => setContactPickerOpen(false)}
          onSelect={sendWhatsApp}
        />
      )}

      {addModalOpen && isAdmin && (
        <AddProductModal
          allBrands={allBrands.filter((b) => b !== "Todos")}
          brandMeta={brandMeta}
          onClose={() => setAddModalOpen(false)}
          onAdd={addProduct}
        />
      )}

      {editProduct && isAdmin && (
        <EditProductModal
          product={editProduct}
          allBrands={allBrands.filter((b) => b !== "Todos")}
          brandMeta={brandMeta}
          onClose={() => setEditProduct(null)}
          onSave={saveEditProduct}
        />
      )}

      {colorPickerModal && (
        <ColorPickerModal
          product={colorPickerModal.product}
          isBulk={colorPickerModal.isBulk}
          onClose={() => setColorPickerModal(null)}
          onConfirm={(color) => {
            addToCart(colorPickerModal.product, colorPickerModal.isBulk, color);
            setColorPickerModal(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product, cartItemUnit, cartItemBulk, cartItemsCover, brandMeta, isAdmin,
  onAddUnit, onAddBulk, onSetQtyUnit, onSetQtyBulk,
  onIncreaseUnit, onDecreaseUnit, onIncreaseBulk, onDecreaseBulk,
  onIncreaseColor, onDecreaseColor, onSetQtyColor,
  onDelete, onEdit, onToggleStock,
}: {
  product: Product;
  cartItemUnit?: CartItem;
  cartItemBulk?: CartItem;
  cartItemsCover?: CartItem[];
  brandMeta: Record<string, { color: string; bg: string }>;
  isAdmin: boolean;
  onAddUnit: () => void;
  onAddBulk: () => void;
  onSetQtyUnit: (qty: number) => void;
  onSetQtyBulk: (qty: number) => void;
  onIncreaseUnit: () => void;
  onDecreaseUnit: () => void;
  onIncreaseBulk: () => void;
  onDecreaseBulk: () => void;
  onIncreaseColor: (color: string, isBulk: boolean) => void;
  onDecreaseColor: (color: string, isBulk: boolean) => void;
  onSetQtyColor: (color: string, isBulk: boolean, qty: number) => void;
  onDelete: () => void;
  onEdit: () => void;
  onToggleStock: () => void;
}) {
  const meta = getBrandMeta(product.brand, brandMeta);
  const [imgError, setImgError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const coverTotal = (cartItemsCover ?? []).reduce((s, i) => s + i.qty, 0);
  const totalInCart = (cartItemUnit?.qty ?? 0) + (cartItemBulk?.qty ?? 0) + coverTotal;

  return (
    <article
      className="group flex flex-col hover:-translate-y-0.5 transition-all duration-200 relative rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.9)",
        border: isAdmin ? "1.5px solid #FDE68A" : "1px solid rgba(229,229,229,0.7)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Admin top bar */}
      {isAdmin && (
        <div className="flex items-center justify-between px-2 py-1" style={{ background: "#FFFBEB", borderBottom: "1px solid #FDE68A" }}>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#92400E" }}>Admin</span>
          <div className="flex items-center gap-1">
            {/* Stock toggle */}
            <button
              onClick={onToggleStock}
              title={product.inStock ? "Marcar como Agotado" : "Marcar como Disponible"}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold transition-all"
              style={product.inStock
                ? { background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC" }
                : { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block mr-0.5" style={{ background: product.inStock ? "#16a34a" : "#dc2626" }} />
              {product.inStock ? "Disponible" : "Agotado"}
            </button>
            <button onClick={onEdit} className="w-5 h-5 rounded flex items-center justify-center transition-colors" style={{ background: "#FEF3C7", color: "#92400E" }} title="Editar producto">
              <PenLine className="w-2.5 h-2.5" />
            </button>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="w-5 h-5 rounded flex items-center justify-center transition-colors" style={{ background: "#FEF3C7", color: "#92400E" }} title="Eliminar">
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            ) : (
              <div className="flex items-center gap-0.5">
                <button onClick={onDelete} className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold text-white" style={{ background: "#DC2626" }}>Sí</button>
                <button onClick={() => setConfirmDelete(false)} className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold" style={{ background: "#F4F4F4", color: "#1A1A1A" }}>No</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image */}
      <div className="aspect-square overflow-hidden relative" style={{ background: "#F4F4F4" }}>
        {imgError || !product.image ? (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-8 h-8" style={{ color: "rgba(0,0,0,0.15)" }} />
          </div>
        ) : (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            style={!product.inStock ? { filter: "grayscale(60%) brightness(0.85)" } : {}}
          />
        )}
        {/* AGOTADO overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
            <span
              className="text-white font-black tracking-widest text-sm px-3 py-1 rounded-lg"
              style={{
                background: "#DC2626",
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.15em",
                boxShadow: "0 2px 8px rgba(220,38,38,0.5)",
              }}
            >
              AGOTADO
            </span>
          </div>
        )}
        <span className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: meta.bg, color: meta.color }}>
          {product.brand.toUpperCase()}
        </span>
        {totalInCart > 0 && (
          <span className="absolute top-2 right-2 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow" style={{ background: "#F5A800", color: "#1A1A1A" }}>
            {totalInCart}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-2.5 gap-1.5">
        <h3 className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2">{product.name}</h3>
        <p className="text-[9px] line-clamp-1" style={{ color: "#777" }}>{product.description}</p>

        {product.isCoverProduct ? (
          /* ── Sección Fundas: selección de color ── */
          <div className="rounded-xl overflow-hidden mt-0.5" style={{ border: "1px solid #DDD6FE", opacity: product.inStock ? 1 : 0.6 }}>
            {/* Precio unidad con selector de color */}
            <div className="px-2 py-1.5" style={{ background: "#F5F3FF", borderBottom: "1px solid #DDD6FE" }}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: "#6D28D9" }}>📦 Mayor</span>
                    <span className="text-[8px] px-1 rounded" style={{ background: "#DDD6FE", color: "#6D28D9" }}>x{product.bulkMinQty}+</span>
                  </div>
                  <span className="font-extrabold text-sm leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#7C3AED" }}>
                    S/. {product.bulkPrice.toFixed(2)}
                  </span>
                </div>
                {product.inStock ? (
                  <button
                    onClick={onAddBulk}
                    className="flex items-center gap-0.5 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all active:scale-95 hover:brightness-110 flex-shrink-0"
                    style={{ background: "#7C3AED" }}
                  >
                    <Plus className="w-2.5 h-2.5" /> Elegir color
                  </button>
                ) : (
                  <span className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{ background: "#FEE2E2", color: "#991B1B" }}>Sin stock</span>
                )}
              </div>
            </div>
            <div className="px-2 py-1.5" style={{ background: "#FAF5FF" }}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: "#6D28D9" }}>🛍️ Unidad</span>
                  </div>
                  <span className="font-extrabold text-sm leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#6D28D9" }}>
                    S/. {product.price.toFixed(2)}
                  </span>
                </div>
                {product.inStock ? (
                  <button
                    onClick={onAddUnit}
                    className="flex items-center gap-0.5 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all active:scale-95 hover:brightness-110 flex-shrink-0"
                    style={{ background: "#6D28D9" }}
                  >
                    <Plus className="w-2.5 h-2.5" /> Elegir color
                  </button>
                ) : (
                  <span className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{ background: "#FEE2E2", color: "#991B1B" }}>Sin stock</span>
                )}
              </div>
            </div>
            {/* Items en carrito con colores */}
            {(cartItemsCover ?? []).length > 0 && (
              <div className="px-2 py-1.5 space-y-1" style={{ background: "#EDE9FE", borderTop: "1px solid #DDD6FE" }}>
                <p className="text-[8px] font-bold uppercase tracking-wide" style={{ color: "#6D28D9" }}>En carrito:</p>
                {(cartItemsCover ?? []).map((ci) => {
                  const colorInfo = COVER_COLORS.find((c) => c.name === ci.selectedColor);
                  return (
                    <div key={`${ci.selectedColor}-${ci.isBulk}`} className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                          style={{ background: colorInfo?.hex ?? "#ccc" }}
                        />
                        <span className="text-[9px] font-semibold" style={{ color: "#4C1D95" }}>
                          {ci.selectedColor} {ci.isBulk ? "(mayor)" : "(unid.)"}
                        </span>
                      </div>
                      <QtyControl
                        value={ci.qty}
                        onAdd={() => onIncreaseColor(ci.selectedColor!, ci.isBulk)}
                        onChange={(qty) => onSetQtyColor(ci.selectedColor!, ci.isBulk, qty)}
                        onIncrease={() => onIncreaseColor(ci.selectedColor!, ci.isBulk)}
                        onDecrease={() => onDecreaseColor(ci.selectedColor!, ci.isBulk)}
                        accentColor="#7C3AED"
                        accentBg="#DDD6FE"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── Sección estándar: mayor / unidad ── */
          <div className="rounded-xl overflow-hidden mt-0.5" style={{ border: "1px solid #E5E5E5", opacity: product.inStock ? 1 : 0.6 }}>
            {/* Fila MAYOR */}
            <div className="px-2 py-1.5" style={{ background: "#FFFBEA", borderBottom: "1px solid #FDE68A" }}>
              <div className="flex items-center justify-between gap-1">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: "#92400E" }}>📦 Mayor</span>
                    <span className="text-[8px] px-1 rounded" style={{ background: "#FDE68A", color: "#92400E" }}>x{product.bulkMinQty}+</span>
                  </div>
                  <span className="font-extrabold text-sm leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#D97706" }}>
                    S/. {product.bulkPrice.toFixed(2)}
                  </span>
                </div>
                {product.inStock ? (
                  <QtyControl
                    value={cartItemBulk?.qty ?? 0}
                    onAdd={onAddBulk}
                    onChange={onSetQtyBulk}
                    onIncrease={onIncreaseBulk}
                    onDecrease={onDecreaseBulk}
                    accentColor="#D97706"
                    accentBg="#FEF3C7"
                  />
                ) : (
                  <span className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{ background: "#FEE2E2", color: "#991B1B" }}>Sin stock</span>
                )}
              </div>
            </div>

            {/* Fila UNIDAD */}
            <div className="px-2 py-1.5" style={{ background: "#F0FFF4" }}>
              <div className="flex items-center justify-between gap-1">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: "#166534" }}>🛍️ Unidad</span>
                  </div>
                  <span className="font-extrabold text-sm leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#166534" }}>
                    S/. {product.price.toFixed(2)}
                  </span>
                </div>
                {product.inStock ? (
                  <QtyControl
                    value={cartItemUnit?.qty ?? 0}
                    onAdd={onAddUnit}
                    onChange={onSetQtyUnit}
                    onIncrease={onIncreaseUnit}
                    onDecrease={onDecreaseUnit}
                    accentColor="#16a34a"
                    accentBg="#DCFCE7"
                  />
                ) : (
                  <span className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{ background: "#FEE2E2", color: "#991B1B" }}>Sin stock</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

// ─── QtyControl — input directo de cantidad ───────────────────────────────────

function QtyControl({
  value,
  onAdd,
  onChange,
  onIncrease,
  onDecrease,
  accentColor,
  accentBg,
}: {
  value: number;
  onAdd: () => void;
  onChange: (qty: number) => void;
  onIncrease: () => void;
  onDecrease: () => void;
  accentColor: string;
  accentBg: string;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commitEdit() {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n >= 0) onChange(n);
    setEditing(false);
  }

  if (value === 0) {
    return (
      <button
        onClick={onAdd}
        className="flex items-center gap-0.5 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all active:scale-95 hover:brightness-110 flex-shrink-0"
        style={{ background: accentColor }}
      >
        <Plus className="w-2.5 h-2.5" />
        Agregar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <button
        onClick={onDecrease}
        className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
        style={{ background: accentBg, color: accentColor }}
      >
        <Minus className="w-3 h-3" />
      </button>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={inputVal}
          min={0}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }}
          className="w-9 h-6 text-center text-xs font-bold rounded-md focus:outline-none"
          style={{ border: `1.5px solid ${accentColor}`, background: "#fff", color: accentColor }}
          autoFocus
        />
      ) : (
        <button
          onClick={() => { setInputVal(String(value)); setEditing(true); }}
          className="w-9 h-6 text-center text-xs font-bold rounded-md transition-colors cursor-text"
          style={{ background: accentBg, color: accentColor, border: `1px solid ${accentColor}33` }}
          title="Toca para editar cantidad"
        >
          {value}
        </button>
      )}
      <button
        onClick={onIncrease}
        className="w-6 h-6 rounded-lg text-white flex items-center justify-center transition-colors flex-shrink-0"
        style={{ background: accentColor }}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Cart Row ─────────────────────────────────────────────────────────────────

function CartRow({ item, onIncrease, onDecrease, onSetQty, onRemove }: {
  item: CartItem; onIncrease: () => void; onDecrease: () => void; onSetQty: (qty: number) => void; onRemove: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const unitPrice = item.isBulk ? item.product.bulkPrice : item.product.price;

  function commitEdit() {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n >= 0) onSetQty(n);
    setEditing(false);
  }

  return (
    <div className="flex gap-3 rounded-xl p-3" style={{ background: "#F7F7F7" }}>
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#EBEBEB" }}>
        {imgError || !item.product.image ? (
          <div className="w-full h-full flex items-center justify-center"><ImageOff className="w-5 h-5" style={{ color: "rgba(0,0,0,0.2)" }} /></div>
        ) : (
          <img src={item.product.image} alt={item.product.name} onError={() => setImgError(true)} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-semibold leading-snug line-clamp-2 flex-1">{item.product.name}</p>
          <button onClick={onRemove} className="p-0.5 flex-shrink-0 transition-colors" style={{ color: "#ccc" }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = "#DC2626"}
            onMouseLeave={e => (e.target as HTMLElement).style.color = "#ccc"}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[10px]" style={{ color: "#777" }}>{item.product.brand}</p>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={item.isBulk
              ? { background: "#FEF3C7", color: "#92400E" }
              : { background: "#DCFCE7", color: "#166534" }}
          >
            {item.isBulk ? `📦 Mayor` : `🛍️ Unidad`}
          </span>
          {item.selectedColor && (() => {
            const colorInfo = COVER_COLORS.find((c) => c.name === item.selectedColor);
            return (
              <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#EDE9FE", color: "#6D28D9" }}>
                <span className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ background: colorInfo?.hex ?? "#ccc" }} />
                {item.selectedColor}
              </span>
            );
          })()}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <button onClick={onDecrease} className="w-6 h-6 rounded-full flex items-center justify-center transition-colors" style={{ background: "#fff", border: "1px solid #E5E5E5" }}>
              <Minus className="w-3 h-3" />
            </button>
            {editing ? (
              <input
                type="number"
                value={inputVal}
                min={0}
                onChange={(e) => setInputVal(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }}
                className="w-10 h-6 text-center text-sm font-bold rounded-md focus:outline-none"
                style={{ border: "1.5px solid #F5A800", background: "#fff", color: "#1A1A1A" }}
                autoFocus
              />
            ) : (
              <button
                onClick={() => { setInputVal(String(item.qty)); setEditing(true); }}
                className="w-10 h-6 text-center text-sm font-bold rounded-md cursor-text"
                style={{ background: "#F4F4F4", border: "1px solid #E5E5E5", color: "#1A1A1A" }}
                title="Toca para editar cantidad"
              >
                {item.qty}
              </button>
            )}
            <button onClick={onIncrease} className="w-6 h-6 rounded-full text-white flex items-center justify-center transition-colors" style={{ background: "#F5A800" }}>
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="font-extrabold" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", color: "#F5A800" }}>
            S/. {(unitPrice * item.qty).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Color Picker Modal ───────────────────────────────────────────────────────

function ColorPickerModal({ product, isBulk, onClose, onConfirm }: {
  product: Product;
  isBulk: boolean;
  onClose: () => void;
  onConfirm: (color: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div
          className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
          style={{ background: "#fff" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 pt-5 pb-4 rounded-t-3xl sm:rounded-t-2xl flex-shrink-0"
            style={{ background: "#F5F3FF", borderBottom: "1px solid #DDD6FE" }}
          >
            <div>
              <h3 className="font-bold leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", color: "#6D28D9" }}>
                🎨 ELIGE EL COLOR
              </h3>
              <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "#7C3AED" }}>
                {product.name} · {isBulk ? "Precio mayor" : "Precio unidad"} — S/. {(isBulk ? product.bulkPrice : product.price).toFixed(2)}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg" style={{ color: "#6D28D9" }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Color grid */}
          <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
            <div className="grid grid-cols-3 gap-2.5">
              {COVER_COLORS.map((c) => {
                const isSelected = selected === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => setSelected(c.name)}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all active:scale-95"
                    style={{
                      border: isSelected ? "2.5px solid #7C3AED" : "2px solid #E5E5E5",
                      background: isSelected ? "#EDE9FE" : "#FAFAFA",
                      boxShadow: isSelected ? "0 0 0 3px #DDD6FE" : "none",
                    }}
                  >
                    <span
                      className="w-8 h-8 rounded-full shadow-md border-2 border-white"
                      style={{ background: c.hex }}
                    />
                    <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: isSelected ? "#6D28D9" : "#555" }}>
                      {c.name}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#7C3AED" }}>
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 pt-3 flex gap-3 flex-shrink-0" style={{ borderTop: "1px solid #E5E5E5" }}>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ border: "1px solid #E5E5E5", color: "#555" }}
            >
              Cancelar
            </button>
            <button
              onClick={() => selected && onConfirm(selected)}
              disabled={!selected}
              className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 hover:brightness-110"
              style={{ background: "#7C3AED", color: "#fff" }}
            >
              <ShoppingCart className="w-4 h-4" />
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── WhatsApp Admin Modal (multi-contact) ─────────────────────────────────────

function WhatsAppAdminModal({ contacts, onClose, onSave }: {
  contacts: WhatsAppContact[];
  onClose: () => void;
  onSave: (contacts: WhatsAppContact[]) => void;
}) {
  const [list, setList] = useState<WhatsAppContact[]>(
    contacts.length > 0 ? contacts : [{ id: crypto.randomUUID(), label: "Ventas", number: "" }]
  );
  const [errors, setErrors] = useState<Record<string, { label?: string; number?: string }>>({});
  const [saved, setSaved] = useState(false);

  function addContact() {
    setList((prev) => [...prev, { id: crypto.randomUUID(), label: "", number: "" }]);
  }

  function removeContact(id: string) {
    if (list.length <= 1) return;
    setList((prev) => prev.filter((c) => c.id !== id));
    setErrors((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }

  function update(id: string, field: "label" | "number", value: string) {
    setList((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
    setErrors((prev) => ({ ...prev, [id]: { ...prev[id], [field]: undefined } }));
    setSaved(false);
  }

  function validate() {
    const newErrors: Record<string, { label?: string; number?: string }> = {};
    let valid = true;
    list.forEach((c) => {
      const e: { label?: string; number?: string } = {};
      if (!c.label.trim()) { e.label = "Nombre requerido"; valid = false; }
      const clean = c.number.replace(/\D/g, "");
      if (clean.length < 8) { e.number = "Mínimo 8 dígitos"; valid = false; }
      if (clean.length > 15) { e.number = "Número muy largo"; valid = false; }
      if (Object.keys(e).length > 0) newErrors[c.id] = e;
    });
    setErrors(newErrors);
    return valid;
  }

  function handleSave() {
    if (!validate()) return;
    const cleaned = list.map((c) => ({ ...c, number: c.number.replace(/\D/g, "") }));
    setSaved(true);
    setTimeout(() => onSave(cleaned), 500);
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
          style={{ background: "#fff" }} onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0 rounded-t-3xl sm:rounded-t-2xl"
            style={{ background: "#E8FFF1", borderBottom: "1px solid #B7EACB" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#25D366" }}>
                <WhatsAppIcon color="#fff" />
              </div>
              <div>
                <h3 className="font-bold leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", color: "#128C4E" }}>
                  NÚMEROS DE WHATSAPP
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "#25D366" }}>Configura los contactos de venta</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg" style={{ color: "#128C4E" }}><X className="w-5 h-5" /></button>
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 no-scrollbar">
            {list.map((contact, idx) => (
              <div key={contact.id} className="rounded-xl p-3 space-y-2" style={{ border: "1px solid #E5E5E5", background: "#FAFAFA" }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#777" }}>
                    Contacto {idx + 1}
                  </span>
                  {list.length > 1 && (
                    <button onClick={() => removeContact(contact.id)}
                      className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                      style={{ background: "#FEE2E2", color: "#DC2626" }}>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {/* Label */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: "#1A1A1A" }}>Nombre / Rol</label>
                  <input
                    type="text"
                    value={contact.label}
                    onChange={(e) => update(contact.id, "label", e.target.value)}
                    placeholder="Ej: Ventas, Soporte, Lima…"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: `1.5px solid ${errors[contact.id]?.label ? "#DC2626" : "#E5E5E5"}`, background: "#fff" }}
                  />
                  {errors[contact.id]?.label && (
                    <p className="text-[11px] mt-0.5" style={{ color: "#DC2626" }}>{errors[contact.id].label}</p>
                  )}
                </div>
                {/* Number */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: "#1A1A1A" }}>Número (con código de país)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#25D366" }} />
                    <input
                      type="tel"
                      value={contact.number}
                      onChange={(e) => update(contact.id, "number", e.target.value)}
                      placeholder="51987654321"
                      className="w-full rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none font-mono"
                      style={{ border: `1.5px solid ${errors[contact.id]?.number ? "#DC2626" : "#E5E5E5"}`, background: "#fff" }}
                    />
                  </div>
                  {errors[contact.id]?.number
                    ? <p className="text-[11px] mt-0.5" style={{ color: "#DC2626" }}>{errors[contact.id].number}</p>
                    : contact.number.replace(/\D/g, "").length >= 8 && (
                      <p className="text-[11px] mt-0.5 font-mono" style={{ color: "#25D366" }}>
                        wa.me/{contact.number.replace(/\D/g, "")}
                      </p>
                    )}
                </div>
              </div>
            ))}

            {/* Add contact button */}
            <button
              onClick={addContact}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-95"
              style={{ background: "#E8FFF1", border: "1.5px dashed #25D366", color: "#128C4E" }}
            >
              <Plus className="w-4 h-4" /> Agregar número
            </button>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 pt-3 flex gap-3 flex-shrink-0" style={{ borderTop: "1px solid #E5E5E5" }}>
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ border: "1px solid #E5E5E5", color: "#555" }}>Cancelar</button>
            <button onClick={handleSave} disabled={saved}
              className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={{ background: "#25D366", color: "#fff" }}>
              {saved ? <><Check className="w-4 h-4" /> ¡Guardado!</> : <><Save className="w-4 h-4" /> Guardar</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Contact Picker Modal ─────────────────────────────────────────────────────

function ContactPickerModal({ contacts, onClose, onSelect }: {
  contacts: WhatsAppContact[];
  onClose: () => void;
  onSelect: (contact: WhatsAppContact) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl pointer-events-auto"
          style={{ background: "#fff" }} onClick={(e) => e.stopPropagation()}>

          <div className="flex items-center justify-between px-5 pt-5 pb-4"
            style={{ background: "#E8FFF1", borderBottom: "1px solid #B7EACB" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#25D366" }}>
                <WhatsAppIcon color="#fff" />
              </div>
              <div>
                <h3 className="font-bold leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.05rem", color: "#128C4E" }}>
                  ¿A QUIÉN ENVIAR?
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "#25D366" }}>Elige el contacto de ventas</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg" style={{ color: "#128C4E" }}><X className="w-5 h-5" /></button>
          </div>

          <div className="px-4 py-4 space-y-2">
            {contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:brightness-95 active:scale-[0.98]"
                style={{ background: "#F0FFF6", border: "1.5px solid #B7EACB" }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#25D366" }}>
                  <WhatsAppIcon color="#fff" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-none" style={{ color: "#128C4E" }}>{c.label}</p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: "#25D366" }}>+{c.number}</p>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 flex-shrink-0" style={{ color: "#25D366" }} />
              </button>
            ))}
          </div>

          <div className="px-4 pb-5">
            <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ border: "1px solid #E5E5E5", color: "#777" }}>Cancelar</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Admin Login Modal ────────────────────────────────────────────────────────

function AdminLoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === ADMIN_PIN) { onSuccess(); }
    else { setError(true); setPin(""); setTimeout(() => setError(false), 1500); }
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div className={`w-full max-w-xs rounded-2xl shadow-2xl pointer-events-auto transition-transform ${error ? "animate-shake" : "animate-fade-in"}`} style={{ background: "#fff" }} onClick={(e) => e.stopPropagation()}>
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: error ? "#FEE2E2" : "#F4F4F4" }}>
              <Lock className="w-6 h-6" style={{ color: error ? "#DC2626" : "#2C2C2C" }} />
            </div>
            <h3 className="font-bold mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.25rem" }}>ACCESO ADMINISTRADOR</h3>
            <p className="text-sm mb-5" style={{ color: "#777" }}>Ingresa tu PIN para continuar</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input ref={inputRef} type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="• • • •" maxLength={8}
                className="w-full text-center text-2xl tracking-[0.4em] font-bold rounded-xl px-4 py-3 focus:outline-none"
                style={{ background: "#F4F4F4", border: `1.5px solid ${error ? "#DC2626" : "#E5E5E5"}`, color: error ? "#DC2626" : "#1A1A1A" }} />
              {error && <p className="text-xs font-semibold" style={{ color: "#DC2626" }}>PIN incorrecto, intenta de nuevo</p>}
              <button type="submit" disabled={!pin} className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 hover:brightness-110" style={{ background: "#2C2C2C", color: "#fff" }}>Ingresar</button>
              <button type="button" onClick={onClose} className="w-full py-2 text-sm" style={{ color: "#777" }}>Cancelar</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Edit Product Modal ───────────────────────────────────────────────────────

function EditProductModal({ product, allBrands, brandMeta, onClose, onSave }: {
  product: Product; allBrands: string[]; brandMeta: Record<string, { color: string; bg: string }>; onClose: () => void; onSave: (p: Product) => void;
}) {
  const [form, setForm] = useState({
    name: product.name, brand: product.brand, price: String(product.price),
    bulkPrice: String(product.bulkPrice), bulkMinQty: String(product.bulkMinQty),
    description: product.description, image: product.image,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "Precio inválido";
    if (!form.bulkPrice || isNaN(Number(form.bulkPrice)) || Number(form.bulkPrice) <= 0) e.bulkPrice = "Precio mayor inválido";
    if (!form.bulkMinQty || isNaN(Number(form.bulkMinQty)) || Number(form.bulkMinQty) < 1) e.bulkMinQty = "Mínimo inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...product,
      name: form.name.trim(), brand: form.brand,
      price: parseFloat(Number(form.price).toFixed(2)),
      bulkPrice: parseFloat(Number(form.bulkPrice).toFixed(2)),
      bulkMinQty: parseInt(form.bulkMinQty),
      description: form.description.trim(), image: form.image,
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[92vh]" style={{ background: "#fff" }} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0" style={{ background: "#FFFBEB", borderBottom: "1px solid #FDE68A" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FDE68A" }}><PenLine className="w-4 h-4" style={{ color: "#92400E" }} /></div>
              <div>
                <h3 className="font-bold leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", color: "#92400E" }}>EDITAR PRODUCTO</h3>
                <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "#B45309" }}>{product.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg" style={{ color: "#92400E" }}><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
            <Field label="Nombre del producto *" error={errors.name}>
              <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls(!!errors.name)} />
            </Field>
            <Field label="Marca">
              <div className="relative">
                <select value={form.brand} onChange={(e) => set("brand", e.target.value)} className={`${inputCls(false)} appearance-none pr-8 cursor-pointer`}>
                  {allBrands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#777" }} />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio unidad (S/.) *" error={errors.price}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: "#777" }}>S/.</span>
                  <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} min="0.01" step="0.01" className={`${inputCls(!!errors.price)} pl-9`} />
                </div>
              </Field>
              <Field label="Precio mayor (S/.) *" error={errors.bulkPrice}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: "#D97706" }}>S/.</span>
                  <input type="number" value={form.bulkPrice} onChange={(e) => set("bulkPrice", e.target.value)} min="0.01" step="0.01" className={`${inputCls(!!errors.bulkPrice)} pl-9`} style={{ borderColor: "#FDE68A", background: "#FFFBEB" }} />
                </div>
              </Field>
            </div>
            <Field label="Cantidad mínima para precio mayor *" error={errors.bulkMinQty}>
              <input type="number" value={form.bulkMinQty} onChange={(e) => set("bulkMinQty", e.target.value)} min="1" step="1" className={inputCls(!!errors.bulkMinQty)} placeholder="Ej: 5" />
            </Field>
            <Field label="Descripción">
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className={`${inputCls(false)} resize-none`} />
            </Field>
            <Field label="Imagen del producto">
              <ImageField value={form.image} onChange={(src) => set("image", src)} />
            </Field>
          </form>

          <div className="px-5 pb-5 pt-3 flex gap-3 flex-shrink-0" style={{ borderTop: "1px solid #E5E5E5" }}>
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ border: "1px solid #E5E5E5", color: "#555" }}>Cancelar</button>
            <button type="submit" onClick={handleSubmit} className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110" style={{ background: "#F5A800", color: "#1A1A1A" }}>
              <Check className="w-4 h-4" /> Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Add Product Modal ────────────────────────────────────────────────────────

const EMPTY_FORM = { name: "", brand: "", customBrand: "", price: "", bulkPrice: "", bulkMinQty: "5", description: "", image: "", inStock: true, paletteIndex: 0 };

function AddProductModal({ allBrands, brandMeta, onClose, onAdd }: {
  allBrands: string[]; brandMeta: Record<string, { color: string; bg: string }>; onClose: () => void;
  onAdd: (data: Omit<Product, "id">, newBrandMeta?: { color: string; bg: string }) => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const isNewBrand = form.brand === "__new__";
  const finalBrand = isNewBrand ? form.customBrand.trim() : form.brand;

  function set(key: keyof typeof EMPTY_FORM, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key as string]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (!form.brand) e.brand = "Selecciona una marca";
    if (isNewBrand && !form.customBrand.trim()) e.customBrand = "Escribe el nombre de la nueva marca";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "Ingresa un precio válido";
    if (!form.bulkPrice || isNaN(Number(form.bulkPrice)) || Number(form.bulkPrice) <= 0) e.bulkPrice = "Ingresa precio mayor válido";
    if (!form.bulkMinQty || isNaN(Number(form.bulkMinQty)) || Number(form.bulkMinQty) < 1) e.bulkMinQty = "Cantidad mínima inválida";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const newBrandMeta = isNewBrand && !brandMeta[finalBrand] ? PALETTE_OPTIONS[form.paletteIndex as number] : undefined;
    onAdd({
      name: form.name.trim(), brand: finalBrand,
      price: parseFloat(Number(form.price).toFixed(2)),
      bulkPrice: parseFloat(Number(form.bulkPrice).toFixed(2)),
      bulkMinQty: parseInt(String(form.bulkMinQty)),
      description: form.description.trim(), image: form.image as string, inStock: true
    }, newBrandMeta);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[92vh]" style={{ background: "#fff" }} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0" style={{ background: "#FFFBEB", borderBottom: "1px solid #FDE68A" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FDE68A" }}><Plus className="w-4 h-4" style={{ color: "#92400E" }} /></div>
              <h3 className="font-bold leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", color: "#92400E" }}>NUEVO PRODUCTO</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg" style={{ color: "#92400E" }}><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
            <Field label="Nombre del producto *" error={errors.name}>
              <input ref={nameRef} type="text" value={form.name as string} onChange={(e) => set("name", e.target.value)} placeholder="Ej: Control Samsung Smart TV 4K" className={inputCls(!!errors.name)} />
            </Field>
            <Field label="Marca *" error={errors.brand}>
              <div className="relative">
                <select value={form.brand as string} onChange={(e) => set("brand", e.target.value)} className={`${inputCls(!!errors.brand)} appearance-none pr-8 cursor-pointer`}>
                  <option value="">Seleccionar marca…</option>
                  {allBrands.map((b) => <option key={b} value={b}>{b}</option>)}
                  <option value="__new__">+ Nueva marca</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#777" }} />
              </div>
            </Field>
            {isNewBrand && (
              <Field label="Nombre de la nueva marca *" error={errors.customBrand}>
                <input type="text" value={form.customBrand as string} onChange={(e) => set("customBrand", e.target.value)} placeholder="Ej: Hisense" className={inputCls(!!errors.customBrand)} autoFocus />
              </Field>
            )}
            {isNewBrand && (
              <Field label="Color de la marca">
                <div className="flex gap-2 flex-wrap">
                  {PALETTE_OPTIONS.map((p, i) => (
                    <button key={i} type="button" onClick={() => set("paletteIndex", i)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${form.paletteIndex === i ? "scale-110 shadow-md" : ""}`}
                      style={{ background: p.bg, borderColor: form.paletteIndex === i ? "#1A1A1A" : "transparent" }}>
                      <span className="block w-3 h-3 rounded-full" style={{ background: p.color }} />
                    </button>
                  ))}
                </div>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio unidad (S/.) *" error={errors.price}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: "#777" }}>S/.</span>
                  <input type="number" value={form.price as string} onChange={(e) => set("price", e.target.value)} placeholder="0.00" min="0.01" step="0.01" className={`${inputCls(!!errors.price)} pl-9`} />
                </div>
              </Field>
              <Field label="Precio mayor (S/.) *" error={errors.bulkPrice}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: "#D97706" }}>S/.</span>
                  <input type="number" value={form.bulkPrice as string} onChange={(e) => set("bulkPrice", e.target.value)} placeholder="0.00" min="0.01" step="0.01" className={`${inputCls(!!errors.bulkPrice)} pl-9`} style={{ borderColor: "#FDE68A", background: "#FFFBEB" }} />
                </div>
              </Field>
            </div>
            <Field label="Cantidad mínima para precio mayor *" error={errors.bulkMinQty}>
              <input type="number" value={form.bulkMinQty as string} onChange={(e) => set("bulkMinQty", e.target.value)} placeholder="5" min="1" step="1" className={inputCls(!!errors.bulkMinQty)} />
            </Field>
            <Field label="Descripción">
              <textarea value={form.description as string} onChange={(e) => set("description", e.target.value)} placeholder="Modelos compatibles, características…" rows={2} className={`${inputCls(false)} resize-none`} />
            </Field>
            <Field label="Imagen del producto">
              <ImageField value={form.image as string} onChange={(src) => set("image", src)} />
            </Field>
          </form>

          <div className="px-5 pb-5 pt-3 flex gap-3 flex-shrink-0" style={{ borderTop: "1px solid #E5E5E5" }}>
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ border: "1px solid #E5E5E5", color: "#555" }}>Cancelar</button>
            <button type="submit" onClick={handleSubmit} className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110" style={{ background: "#F5A800", color: "#1A1A1A" }}>
              <Plus className="w-4 h-4" /> Agregar producto
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── ImageField — URL + upload desde dispositivo ──────────────────────────────

function ImageField({ value, onChange }: { value: string; onChange: (src: string) => void }) {
  const [tab, setTab] = useState<"url" | "upload">(value && !value.startsWith("data:") ? "url" : value.startsWith("data:") ? "upload" : "url");
  const [urlInput, setUrlInput] = useState(value.startsWith("data:") ? "" : value);
  const [urlError, setUrlError] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const previewSrc = value || null;

  function handleUrlChange(v: string) {
    setUrlInput(v);
    setUrlError(false);
    onChange(v);
  }

  function processFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      onChange(result);
    };
    reader.readAsDataURL(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  return (
    <div className="space-y-2">
      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
        {(["url", "upload"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            style={tab === t
              ? { background: "#2C2C2C", color: "#fff" }
              : { background: "#F9F9F9", color: "#777" }
            }
          >
            {t === "url" ? (
              <><span>🔗</span> URL web</>
            ) : (
              <><span>📁</span> Subir archivo</>
            )}
          </button>
        ))}
      </div>

      {tab === "url" && (
        <input
          type="url"
          value={urlInput}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://ejemplo.com/imagen.jpg"
          className={inputCls(urlError)}
        />
      )}

      {tab === "upload" && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="rounded-xl flex flex-col items-center justify-center gap-2 py-5 cursor-pointer transition-all"
          style={{
            border: `2px dashed ${dragOver ? "#F5A800" : "#D1D5DB"}`,
            background: dragOver ? "#FFFBEA" : "#F9FAFB",
          }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#F4F4F4" }}>
            <span className="text-xl">📷</span>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
              {dragOver ? "Suelta la imagen aquí" : "Haz clic o arrastra una imagen"}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#777" }}>JPG, PNG, WEBP — máx. 5 MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
        </div>
      )}

      {/* Preview */}
      {previewSrc && (
        <div className="relative rounded-xl overflow-hidden" style={{ height: "120px", background: "#F4F4F4", border: "1px solid #E5E5E5" }}>
          <img
            src={previewSrc}
            alt="Vista previa"
            onError={() => { setUrlError(true); onChange(""); }}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => { onChange(""); setUrlInput(""); setUrlError(false); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow"
            style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
            title="Quitar imagen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1" style={{ background: "rgba(0,0,0,0.4)" }}>
            <p className="text-[10px] text-white font-semibold">Vista previa</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ query, isAdmin, onAdd }: { query: string; isAdmin: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24" style={{ color: "#777" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#F4F4F4" }}>
        <Package className="w-8 h-8 opacity-30" />
      </div>
      <p className="font-semibold text-base" style={{ color: "#1A1A1A" }}>Sin resultados</p>
      <p className="text-sm mt-1 text-center max-w-xs">
        {query ? `No encontramos productos para "${query}".` : "No hay productos en esta categoría."}
      </p>
      {isAdmin && (
        <button onClick={onAdd} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold hover:brightness-110" style={{ background: "#F5A800", color: "#1A1A1A" }}>
          <Plus className="w-4 h-4" /> Agregar producto
        </button>
      )}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{label}</label>
      {children}
      {error && <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors border ${hasError ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`;
}

function WhatsAppIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
