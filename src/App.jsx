import React, { useState, useEffect, useMemo } from "react";
import {
  Search, MapPin, Phone, Briefcase, UserPlus, Building2, X,
  Wrench, Hammer, ChevronDown, Clock, Users, Zap, CheckCircle2, Menu,
  ShieldCheck, Eye, AlertTriangle, FileText, Sparkles, Lock, PlusCircle, Trash2
} from "lucide-react";
import { supabase } from "./supabaseClient";

const CIUDADES = [
  "Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay",
  "Ciudad Guayana", "Barcelona / Puerto La Cruz", "San Cristóbal",
  "Mérida", "Maturín", "Cabimas", "Punto Fijo", "Acarigua", "Guanare", "Los Teques"
];

const REGIONES = [
  { nombre: "Occidente", ciudades: ["Maracaibo", "Cabimas", "Punto Fijo", "San Cristóbal", "Mérida", "Barquisimeto", "Acarigua", "Guanare"] },
  { nombre: "Centro", ciudades: ["Caracas", "Valencia", "Maracay", "Los Teques"] },
  { nombre: "Oriente", ciudades: ["Barcelona / Puerto La Cruz", "Maturín"] },
  { nombre: "Guayana", ciudades: ["Ciudad Guayana"] },
];

const OFICIOS = [
  { nombre: "Soldador argonero", categoria: "Industria" },
  { nombre: "Soldador eléctrico", categoria: "Industria" },
  { nombre: "Electricista industrial", categoria: "Industria" },
  { nombre: "Electricista residencial", categoria: "Construcción" },
  { nombre: "Mecánico industrial", categoria: "Industria" },
  { nombre: "Técnico en refrigeración", categoria: "Industria" },
  { nombre: "Operador de maquinaria pesada", categoria: "Construcción" },
  { nombre: "Albañil", categoria: "Construcción" },
  { nombre: "Herrero", categoria: "Construcción" },
  { nombre: "Carpintero", categoria: "Construcción" },
  { nombre: "Plomero", categoria: "Construcción" },
  { nombre: "Pintor industrial", categoria: "Construcción" },
  { nombre: "Supervisor de obra", categoria: "Construcción" },
  { nombre: "Ayudante general de obra", categoria: "Construcción" },
  { nombre: "Ingeniero civil", categoria: "Ingeniería" },
  { nombre: "Ingeniero mecánico", categoria: "Ingeniería" },
  { nombre: "Ingeniero eléctrico", categoria: "Ingeniería" },
  { nombre: "Técnico agropecuario", categoria: "Agro" },
  { nombre: "Operador de maquinaria agrícola", categoria: "Agro" },
  { nombre: "Obrero agrícola", categoria: "Agro" },
  { nombre: "Chofer / transporte de carga", categoria: "Logística" },
  { nombre: "Otro (especificar)", categoria: "Industria" },
];

const CATEGORIA_COLOR = {
  Industria: "#33495E",
  Construcción: "#C97F0B",
  Ingeniería: "#1C2E45",
  Agro: "#3F8F5F",
  Logística: "#5B4636",
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const DIAS_VENCIMIENTO = 30;
const ADMIN_PASSWORD = "oficiove2026"; // cámbiala por una propia

// Los valores de precios/WhatsApp ahora se cargan desde la tabla "configuracion" en Supabase (editables desde el panel Admin).

function diasRestantes(fechaMs) {
  const vencePara = fechaMs + DIAS_VENCIMIENTO * 24 * 60 * 60 * 1000;
  return Math.ceil((vencePara - Date.now()) / (24 * 60 * 60 * 1000));
}

function estaVencido(fechaMs) {
  return diasRestantes(fechaMs) <= 0;
}

function credencial(id) {
  return "VE-" + id.slice(-6).toUpperCase();
}

async function subirArchivo(archivo, prefijo) {
  if (!archivo) return null;
  const extension = archivo.name.split(".").pop();
  const ruta = `${prefijo}-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("documentos").upload(ruta, archivo);
  if (error) return null;
  const { data } = supabase.storage.from("documentos").getPublicUrl(ruta);
  return data.publicUrl;
}

function waLink(telefono, texto) {
  const digits = (telefono || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(texto)}`;
}

const inputStyle = {
  width: "100%",
  padding: "11px 13px",
  borderRadius: 8,
  border: "1.5px solid #C9CFCE",
  fontSize: 15,
  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  background: "#fff",
  color: "#1C2321",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: 12.5,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#5B655F",
  marginBottom: 6,
  display: "block",
};

export default function App() {
  const [perfiles, setPerfiles] = useState([]);
  const [vacantes, setVacantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("directorio");
  const [showPerfilForm, setShowPerfilForm] = useState(false);
  const [showVacanteForm, setShowVacanteForm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [fCiudad, setFCiudad] = useState("Todas");
  const [fOficio, setFOficio] = useState("Todos");
  const [fTexto, setFTexto] = useState("");

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);

  const [config, setConfig] = useState({
    pagos_activos: false,
    precio_busca_trabajo: 1,
    precio_ofrece_trabajo: 5,
    whatsapp_contacto: "584128412750",
  });

  const [accesoDesbloqueado, setAccesoDesbloqueado] = useState(false);
  const [showDesbloqueoModal, setShowDesbloqueoModal] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("oficiove-acceso") === "si") setAccesoDesbloqueado(true);
    } catch (e) {}
  }, []);

  async function cargarConfig() {
    const { data, error } = await supabase.from("configuracion").select("*").eq("id", 1).single();
    if (!error && data) setConfig(data);
  }

  async function guardarConfig(nuevaConfig) {
    const { error } = await supabase.from("configuracion").update(nuevaConfig).eq("id", 1);
    if (!error) {
      setConfig((prev) => ({ ...prev, ...nuevaConfig }));
      showToast("Configuración guardada.");
    } else {
      showToast("No se pudo guardar la configuración.");
    }
  }

  useEffect(() => {
    (async () => {
      const { data: p, error: ep } = await supabase.from("perfiles").select("*").order("fecha", { ascending: false });
      if (!ep && p) setPerfiles(p);
      const { data: v, error: ev } = await supabase.from("vacantes").select("*").order("fecha", { ascending: false });
      if (!ev && v) setVacantes(v);
      await cargarConfig();
      setLoading(false);
    })();
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  async function addPerfil(perfil) {
    const { error } = await supabase.from("perfiles").insert(perfil);
    if (error) {
      showToast("No se pudo guardar el perfil. Intenta de nuevo.");
      return;
    }
    setPerfiles((prev) => [perfil, ...prev]);
    showToast("Tu perfil quedó publicado en el directorio.");
  }

  async function addVacante(vac) {
    const { error } = await supabase.from("vacantes").insert(vac);
    if (error) {
      showToast("No se pudo publicar la vacante. Intenta de nuevo.");
      return;
    }
    setVacantes((prev) => [vac, ...prev]);
    showToast("Vacante publicada.");
  }

  async function borrarPerfil(id) {
    const { error } = await supabase.from("perfiles").delete().eq("id", id);
    if (error) {
      showToast("No se pudo borrar. Intenta de nuevo.");
      return;
    }
    setPerfiles((prev) => prev.filter((p) => p.id !== id));
    showToast("Perfil borrado.");
  }

  async function borrarVacante(id) {
    const { error } = await supabase.from("vacantes").delete().eq("id", id);
    if (error) {
      showToast("No se pudo borrar. Intenta de nuevo.");
      return;
    }
    setVacantes((prev) => prev.filter((v) => v.id !== id));
    showToast("Vacante borrada.");
  }

  async function editarPerfil(id, cambios) {
    const { error } = await supabase.from("perfiles").update(cambios).eq("id", id);
    if (error) {
      showToast("No se pudo guardar el cambio.");
      return;
    }
    setPerfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
    showToast("Perfil actualizado.");
  }

  async function editarVacante(id, cambios) {
    const { error } = await supabase.from("vacantes").update(cambios).eq("id", id);
    if (error) {
      showToast("No se pudo guardar el cambio.");
      return;
    }
    setVacantes((prev) => prev.map((v) => (v.id === id ? { ...v, ...cambios } : v)));
    showToast("Vacante actualizada.");
  }

  const perfilesFiltrados = useMemo(() => {
    return perfiles.filter((p) => {
      if (estaVencido(p.fecha)) return false;
      if (fCiudad !== "Todas" && p.ciudad !== fCiudad) return false;
      if (fOficio !== "Todos" && p.oficio !== fOficio) return false;
      if (fTexto.trim()) {
        const q = fTexto.toLowerCase();
        if (!(p.nombre.toLowerCase().includes(q) || p.oficio.toLowerCase().includes(q) || (p.descripcion || "").toLowerCase().includes(q))) return false;
      }
      return true;
    }).sort((a, b) => b.fecha - a.fecha);
  }, [perfiles, fCiudad, fOficio, fTexto]);

  const vacantesFiltradas = useMemo(() => {
    return vacantes.filter((v) => {
      if (estaVencido(v.fecha)) return false;
      if (fCiudad !== "Todas" && v.ciudad !== fCiudad) return false;
      if (fOficio !== "Todos" && v.oficio !== fOficio) return false;
      if (fTexto.trim()) {
        const q = fTexto.toLowerCase();
        if (!(v.empresa.toLowerCase().includes(q) || v.oficio.toLowerCase().includes(q) || (v.descripcion || "").toLowerCase().includes(q))) return false;
      }
      return true;
    }).sort((a, b) => (b.urgente - a.urgente) || (b.fecha - a.fecha));
  }, [vacantes, fCiudad, fOficio, fTexto]);

  function buscarAhora() {
    setTab("directorio");
    setTimeout(() => {
      const el = document.getElementById("zona-resultados");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", background: "#E7EAE8", minHeight: "100%", color: "#1C2321" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        * { box-sizing: border-box; }
        .oswald { font-family: 'Oswald', 'Arial Narrow', sans-serif; letter-spacing: 0.01em; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .btn-amber {
          background: #F2A71B; color: #1C2321; border: none; font-weight: 700;
          padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 14.5px;
          display: inline-flex; align-items: center; gap: 8px; transition: transform .12s, background .12s;
        }
        .btn-amber:hover { background: #E29B15; transform: translateY(-1px); }
        .btn-steel {
          background: #33495E; color: #fff; border: none; font-weight: 700;
          padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 14.5px;
          display: inline-flex; align-items: center; gap: 8px; transition: transform .12s, background .12s;
        }
        .btn-steel:hover { background: #26374A; transform: translateY(-1px); }
        .btn-outline {
          background: transparent; color: #33495E; border: 1.5px solid #33495E; font-weight: 600;
          padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 14px;
        }
        .card-lift { transition: transform .15s ease, box-shadow .15s ease; }
        .card-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(28,35,33,0.14); }
        .badge-notch::before {
          content: ""; position: absolute; top: -8px; left: 50%; transform: translateX(-50%);
          width: 34px; height: 14px; background: #E7EAE8; border-radius: 0 0 10px 10px;
          border-left: 1.5px dashed #C9CFCE; border-right: 1.5px dashed #C9CFCE; border-bottom: 1.5px dashed #C9CFCE;
        }
        select { appearance: none; -webkit-appearance: none; }
        ::placeholder { color: #8A928C; }
        @media (max-width: 720px) {
          .hide-mobile { display: none !important; }
          .stack-mobile { flex-direction: column !important; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{ background: "#1C2321", padding: "14px 20px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: "#F2A71B", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-4deg)" }}>
              <Wrench size={18} color="#1C2321" strokeWidth={2.5} />
            </div>
            <span className="oswald" style={{ color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: "0.03em" }}>OFICIOVE</span>
          </div>
          <nav className="hide-mobile" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setTab("directorio")} className="btn-outline" style={{ borderColor: tab === "directorio" ? "#F2A71B" : "#4A5450", color: tab === "directorio" ? "#F2A71B" : "#C9CFCE", background: "transparent" }}>Directorio</button>
            <button onClick={() => setTab("vacantes")} className="btn-outline" style={{ borderColor: tab === "vacantes" ? "#F2A71B" : "#4A5450", color: tab === "vacantes" ? "#F2A71B" : "#C9CFCE", background: "transparent" }}>Vacantes</button>
            <button onClick={() => setTab("mapa")} className="btn-outline" style={{ borderColor: tab === "mapa" ? "#F2A71B" : "#4A5450", color: tab === "mapa" ? "#F2A71B" : "#C9CFCE", background: "transparent" }}>Mapa</button>
            <button onClick={() => setShowPerfilForm(true)} className="btn-amber"><UserPlus size={16} /> Ofrezco mis servicios</button>
            <button onClick={() => setShowVacanteForm(true)} className="btn-steel" style={{ background: "#3D5A73" }}><Building2 size={16} /> Publicar vacante</button>
          </nav>
          <button className="hide-mobile-inverse" onClick={() => setMenuOpen(!menuOpen)} style={{ display: "none", background: "none", border: "none" }}>
            <Menu color="#fff" />
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer" }} className="show-mobile">
            <Menu color="#fff" size={24} style={{ display: "none" }} className="mobile-menu-icon" />
          </button>
        </div>
      </header>

      {/* mobile nav simple fallback */}
      <div className="hide-mobile" style={{ display: "none" }} />

      {/* HERO */}
      <section style={{
        background: "linear-gradient(135deg, #1C2321 0%, #2A342F 55%, #33453C 100%)",
        padding: "52px 20px 64px", position: "relative", overflow: "hidden"
      }}>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.06 }} preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(242,167,27,0.14)", border: "1px solid rgba(242,167,27,0.4)", borderRadius: 20, padding: "5px 12px", marginBottom: 18 }}>
            <span className="mono" style={{ color: "#F2A71B", fontSize: 12, fontWeight: 600 }}>PROTOTIPO — VENEZUELA</span>
          </div>
          <h1 className="oswald" style={{ color: "#fff", fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.08, fontWeight: 700, margin: "0 0 14px", maxWidth: 700 }}>
            El profesional que tu obra necesita, en tu ciudad.
          </h1>
          <p style={{ color: "#C9CFCE", fontSize: 16.5, maxWidth: 560, marginBottom: 30, lineHeight: 1.5 }}>
            Soldadores, ingenieros, electricistas, obreros y técnicos agropecuarios registrados por zona. Busca, contacta por WhatsApp y listo.
          </p>

          {/* SEARCH BAR */}
          <div className="stack-mobile" style={{ background: "#fff", borderRadius: 12, padding: 14, display: "flex", gap: 10, boxShadow: "0 16px 40px rgba(0,0,0,0.28)", maxWidth: 900 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, borderRight: "1px solid #E2E5E3", paddingRight: 10 }}>
              <MapPin size={18} color="#5B655F" />
              <select value={fCiudad} onChange={(e) => setFCiudad(e.target.value)} style={{ border: "none", fontSize: 14.5, width: "100%", color: "#1C2321", background: "transparent" }}>
                <option>Todas</option>
                {CIUDADES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, borderRight: "1px solid #E2E5E3", paddingRight: 10 }}>
              <Briefcase size={18} color="#5B655F" />
              <select value={fOficio} onChange={(e) => setFOficio(e.target.value)} style={{ border: "none", fontSize: 14.5, width: "100%", color: "#1C2321", background: "transparent" }}>
                <option>Todos</option>
                {OFICIOS.map((o) => <option key={o.nombre}>{o.nombre}</option>)}
              </select>
            </div>
            <div style={{ flex: 1.3, display: "flex", alignItems: "center", gap: 8 }}>
              <Search size={18} color="#5B655F" />
              <input
                value={fTexto}
                onChange={(e) => setFTexto(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") buscarAhora(); }}
                placeholder="Buscar por nombre u oficio..."
                style={{ border: "none", fontSize: 14.5, width: "100%", outline: "none" }}
              />
            </div>
            <button onClick={buscarAhora} className="btn-amber" style={{ flexShrink: 0 }}>
              <Search size={16} /> Buscar
            </button>
          </div>

          <div id="resultado-busqueda-ancla" />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 16, maxWidth: 620 }}>
            <AlertTriangle size={15} color="#F2A71B" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ color: "#9AA39D", fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
              Antes de contratar o aceptar un trabajo: verifica identidad, acuerda el pago claramente y, en un primer encuentro, prefiere un lugar público. La plataforma no garantiza a los usuarios.
            </p>
          </div>

          <div style={{ display: "flex", gap: 22, marginTop: 22, flexWrap: "wrap" }}>
            <div>
              <div className="oswald" style={{ color: "#F2A71B", fontSize: 26, fontWeight: 700 }}>{perfiles.length}</div>
              <div style={{ color: "#9AA39D", fontSize: 12.5 }}>profesionales registrados</div>
            </div>
            <div>
              <div className="oswald" style={{ color: "#F2A71B", fontSize: 26, fontWeight: 700 }}>{vacantes.length}</div>
              <div style={{ color: "#9AA39D", fontSize: 12.5 }}>vacantes publicadas</div>
            </div>
            <div>
              <div className="oswald" style={{ color: "#F2A71B", fontSize: 26, fontWeight: 700 }}>{CIUDADES.length}</div>
              <div style={{ color: "#9AA39D", fontSize: 12.5 }}>ciudades cubiertas</div>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE CTA BAR */}
      <div className="show-mobile" style={{ display: "flex", gap: 8, padding: "14px 16px", background: "#fff", borderBottom: "1px solid #E2E5E3" }}>
        <button onClick={() => setShowPerfilForm(true)} className="btn-amber" style={{ flex: 1, justifyContent: "center" }}><UserPlus size={16} /> Ofrecer servicio</button>
        <button onClick={() => setShowVacanteForm(true)} className="btn-steel" style={{ flex: 1, justifyContent: "center" }}><Building2 size={16} /> Publicar vacante</button>
      </div>

      {/* TABS (mobile) */}
      <div className="show-mobile" style={{ display: "flex", gap: 8, padding: "12px 16px 0" }}>
        <button onClick={() => setTab("directorio")} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer", background: tab === "directorio" ? "#1C2321" : "#E2E5E3", color: tab === "directorio" ? "#fff" : "#5B655F" }}>Directorio</button>
        <button onClick={() => setTab("vacantes")} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer", background: tab === "vacantes" ? "#1C2321" : "#E2E5E3", color: tab === "vacantes" ? "#fff" : "#5B655F" }}>Vacantes</button>
        <button onClick={() => setTab("mapa")} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer", background: tab === "mapa" ? "#1C2321" : "#E2E5E3", color: tab === "mapa" ? "#fff" : "#5B655F" }}>Mapa</button>
      </div>

      {/* CONTENT */}
      <main id="zona-resultados" style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 20px 80px" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#5B655F", padding: "60px 0" }}>Cargando directorio...</p>
        ) : tab === "mapa" ? (
          <MapaView perfiles={perfiles} onSelectCiudad={(c) => { setFCiudad(c); setTab("directorio"); }} />
        ) : tab === "directorio" ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 className="oswald" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Directorio de profesionales</h2>
              <span style={{ color: "#5B655F", fontSize: 14 }}>{perfilesFiltrados.length} resultado{perfilesFiltrados.length !== 1 ? "s" : ""}</span>
            </div>
            {perfilesFiltrados.length === 0 ? (
              <EmptyState
                icon={<Users size={26} color="#8A928C" />}
                titulo="Todavía no hay nadie registrado con estos filtros"
                texto="Sé el primero en aparecer aquí — te toma menos de un minuto."
                accion={() => setShowPerfilForm(true)}
                accionTexto="Registrar mi perfil"
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 20 }}>
                {perfilesFiltrados.map((p) => (
                  <PerfilCard
                    key={p.id}
                    p={p}
                    bloqueado={config.pagos_activos && !accesoDesbloqueado}
                    onRequierePago={() => setShowDesbloqueoModal(true)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 className="oswald" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Vacantes publicadas</h2>
              <span style={{ color: "#5B655F", fontSize: 14 }}>{vacantesFiltradas.length} resultado{vacantesFiltradas.length !== 1 ? "s" : ""}</span>
            </div>
            {vacantesFiltradas.length === 0 ? (
              <EmptyState
                icon={<Building2 size={26} color="#8A928C" />}
                titulo="No hay vacantes con estos filtros todavía"
                texto="Publica lo que necesitas y los profesionales de la zona lo verán."
                accion={() => setShowVacanteForm(true)}
                accionTexto="Publicar vacante"
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                {vacantesFiltradas.map((v) => (
                  <VacanteCard
                    key={v.id}
                    v={v}
                    bloqueado={config.pagos_activos && !accesoDesbloqueado}
                    onRequierePago={() => setShowDesbloqueoModal(true)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {adminAuthed && (
          <AdminPanel
            perfiles={perfiles}
            vacantes={vacantes}
            onBorrarPerfil={borrarPerfil}
            onBorrarVacante={borrarVacante}
            onEditarPerfil={editarPerfil}
            onEditarVacante={editarVacante}
            config={config}
            onGuardarConfig={guardarConfig}
            onCerrar={() => setAdminAuthed(false)}
          />
        )}
      </main>

      <SeccionPrecios config={config} />

      <footer style={{ background: "#1C2321", padding: "24px 20px", textAlign: "center" }}>
        <p style={{ color: "#8A928C", fontSize: 12.5, margin: "0 0 8px", maxWidth: 560, marginInline: "auto" }}>
          Los perfiles y vacantes que publiques aquí quedan visibles para cualquiera que use este enlace — no ingreses datos que no quieras compartir públicamente. Las publicaciones vencen automáticamente a los {DIAS_VENCIMIENTO} días.
        </p>
        {!adminAuthed && (
          <button onClick={() => setShowAdminLogin(true)} style={{ background: "none", border: "none", color: "#5B655F", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>
            Admin
          </button>
        )}
      </footer>

      {showAdminLogin && (
        <AdminLogin
          onClose={() => setShowAdminLogin(false)}
          onSuccess={() => { setAdminAuthed(true); setShowAdminLogin(false); }}
        />
      )}

      {showDesbloqueoModal && (
        <DesbloqueoModal
          config={config}
          onClose={() => setShowDesbloqueoModal(false)}
          onDesbloqueado={() => {
            setAccesoDesbloqueado(true);
            try { localStorage.setItem("oficiove-acceso", "si"); } catch (e) {}
            setShowDesbloqueoModal(false);
            showToast("¡Acceso desbloqueado! Ya puedes ver los contactos.");
          }}
        />
      )}

      {showPerfilForm && <PerfilForm onClose={() => setShowPerfilForm(false)} onSubmit={(p) => { addPerfil(p); setShowPerfilForm(false); }} />}
      {showVacanteForm && <VacanteForm onClose={() => setShowVacanteForm(false)} onSubmit={(v) => { addVacante(v); setShowVacanteForm(false); }} />}

      {toast && (
        <div style={{
          position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)",
          background: "#1C2321", color: "#fff", padding: "12px 20px", borderRadius: 10,
          display: "flex", alignItems: "center", gap: 8, boxShadow: "0 12px 30px rgba(0,0,0,0.3)", zIndex: 100, fontSize: 14
        }}>
          <CheckCircle2 size={18} color="#F2A71B" /> {toast}
        </div>
      )}

      <style>{`
        .show-mobile { display: none; }
        @media (max-width: 720px) {
          .show-mobile { display: flex; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function MapaView({ perfiles, onSelectCiudad }) {
  const conteoPorCiudad = useMemo(() => {
    const m = {};
    perfiles.forEach((p) => { m[p.ciudad] = (m[p.ciudad] || 0) + 1; });
    return m;
  }, [perfiles]);

  const maxConteo = Math.max(1, ...Object.values(conteoPorCiudad));

  return (
    <div>
      <h2 className="oswald" style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>Cobertura por zona</h2>
      <p style={{ color: "#5B655F", fontSize: 14, margin: "0 0 22px", maxWidth: 620, lineHeight: 1.5 }}>
        Estos son los profesionales <strong>registrados directamente en esta plataforma</strong>, agrupados por región. El tamaño del punto indica cuántos hay en esa ciudad. No se importan datos de redes sociales, Google Maps ni LinkedIn — cada punto es alguien que se registró voluntariamente.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {REGIONES.map((region) => {
          const totalRegion = region.ciudades.reduce((acc, c) => acc + (conteoPorCiudad[c] || 0), 0);
          return (
            <div key={region.nombre} style={{ background: "#fff", border: "1px solid #E2E5E3", borderRadius: 14, overflow: "hidden" }}>
              <div style={{
                background: "#1C2321", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <span className="oswald" style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: "0.03em" }}>{region.nombre.toUpperCase()}</span>
                <span className="mono" style={{ color: "#F2A71B", fontSize: 12.5 }}>{totalRegion} registrado{totalRegion !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ padding: 18, display: "flex", flexWrap: "wrap", gap: 12 }}>
                {region.ciudades.map((ciudad) => {
                  const n = conteoPorCiudad[ciudad] || 0;
                  const tamano = 10 + Math.round((n / maxConteo) * 16);
                  return (
                    <button
                      key={ciudad}
                      onClick={() => onSelectCiudad(ciudad)}
                      style={{
                        display: "flex", alignItems: "center", gap: 9, background: n > 0 ? "#F1F2F0" : "#FAFAF9",
                        border: n > 0 ? "1.5px solid #DDE1DE" : "1.5px dashed #DDE1DE", borderRadius: 24,
                        padding: "8px 14px 8px 10px", cursor: "pointer", fontFamily: "inherit"
                      }}
                    >
                      <span style={{
                        width: tamano, height: tamano, borderRadius: "50%",
                        background: n > 0 ? "#F2A71B" : "#C9CFCE", flexShrink: 0,
                        border: "2px solid #fff", boxShadow: "0 0 0 1.5px " + (n > 0 ? "#F2A71B" : "#C9CFCE")
                      }} />
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1C2321" }}>{ciudad}</span>
                      <span className="mono" style={{ fontSize: 12, color: "#5B655F" }}>{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ icon, titulo, texto, accion, accionTexto }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 14, border: "1.5px dashed #C9CFCE" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#EEF0EE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>{icon}</div>
      <p className="oswald" style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px" }}>{titulo}</p>
      <p style={{ color: "#5B655F", fontSize: 14, margin: "0 0 18px" }}>{texto}</p>
      <button onClick={accion} className="btn-amber">{accionTexto}</button>
    </div>
  );
}

function PerfilCard({ p, bloqueado, onRequierePago }) {
  const [revelado, setRevelado] = useState(false);
  const color = CATEGORIA_COLOR[p.categoria] || "#33495E";
  const iniciales = p.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  function clicVerContacto() {
    if (bloqueado) onRequierePago();
    else setRevelado(true);
  }

  return (
    <div className="card-lift" style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #E2E5E3", position: "relative" }}>
      <div style={{ height: 8, background: color }} />
      <div className="badge-notch" style={{ position: "relative", padding: "22px 18px 18px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
          {p.foto_url ? (
            <img src={p.foto_url} alt={p.nombre} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${color}` }} />
          ) : (
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }} className="oswald">
              {iniciales}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
            <div style={{ color, fontSize: 17, fontWeight: 700 }}>{p.oficio}</div>
          </div>
          {p.verificado ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 700, color: "#3F8F5F", background: "#E7F3EB", padding: "4px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
              <ShieldCheck size={11} /> VERIFICADO
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 700, color: "#8A928C", background: "#F1F2F0", padding: "4px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
              NUEVO
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "#5B655F", background: "#F1F2F0", padding: "4px 9px", borderRadius: 20 }}>
            <MapPin size={12} /> {p.ciudad}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "#5B655F", background: "#F1F2F0", padding: "4px 9px", borderRadius: 20 }}>
            <Clock size={12} /> {p.experiencia} años
          </span>
        </div>
        {p.descripcion && <p style={{ fontSize: 13.5, color: "#3F4642", lineHeight: 1.45, margin: "0 0 14px" }}>{p.descripcion}</p>}
        {p.documento_url && (
          bloqueado ? (
            <button onClick={onRequierePago} className="btn-outline" style={{ padding: "7px 14px", fontSize: 12.5, marginBottom: 12, width: "100%", justifyContent: "center", color: "#8A928C", borderColor: "#C9CFCE" }}>
              <Lock size={13} /> Ver currículum (de pago)
            </button>
          ) : (
            <a href={p.documento_url} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ padding: "7px 14px", fontSize: 12.5, marginBottom: 12, width: "100%", justifyContent: "center", textDecoration: "none" }}>
              <FileText size={13} /> Ver currículum
            </a>
          )
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px dashed #E2E5E3", paddingTop: 12 }}>
          <span className="mono" style={{ fontSize: 11, color: "#8A928C" }}>{credencial(p.id)}</span>
          {revelado && !bloqueado ? (
            <a href={waLink(p.telefono, `Hola ${p.nombre.split(" ")[0]}, vi tu perfil como ${p.oficio} en OficioVE y quisiera contactarte.`)} target="_blank" rel="noopener noreferrer" className="btn-amber" style={{ padding: "8px 14px", fontSize: 13, textDecoration: "none" }}>
              <Phone size={14} /> WhatsApp
            </a>
          ) : (
            <button onClick={clicVerContacto} className="btn-outline" style={{ padding: "8px 14px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
              {bloqueado ? <Lock size={14} /> : <Eye size={14} />} {bloqueado ? "Desbloquear contacto" : "Ver contacto"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function VacanteCard({ v, bloqueado, onRequierePago }) {
  const [revelado, setRevelado] = useState(false);
  const color = CATEGORIA_COLOR[v.categoria] || "#33495E";

  function clicVerContacto() {
    if (bloqueado) onRequierePago();
    else setRevelado(true);
  }

  return (
    <div className="card-lift" style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E5E3", padding: 18, position: "relative" }}>
      {v.urgente && (
        <span style={{ position: "absolute", top: -10, right: 14, background: "#C1432B", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
          <Zap size={11} /> URGENTE
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 16.5, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.02em" }}>{v.oficio}</div>
        {v.verificado ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 700, color: "#3F8F5F", background: "#E7F3EB", padding: "3px 7px", borderRadius: 20 }}>
            <ShieldCheck size={11} /> VERIFICADO
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 700, color: "#8A928C", background: "#F1F2F0", padding: "3px 7px", borderRadius: 20 }}>
            NUEVO
          </span>
        )}
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{v.empresa}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "#5B655F", background: "#F1F2F0", padding: "4px 9px", borderRadius: 20 }}>
          <MapPin size={12} /> {v.ciudad}
        </span>
      </div>
      {v.descripcion && <p style={{ fontSize: 13.5, color: "#3F4642", lineHeight: 1.45, margin: "0 0 14px" }}>{v.descripcion}</p>}
      {revelado && !bloqueado ? (
        <a href={waLink(v.telefono, `Hola, vi la vacante de ${v.oficio} en ${v.empresa} publicada en OficioVE. Me interesa postularme.`)} target="_blank" rel="noopener noreferrer" className="btn-steel" style={{ padding: "9px 14px", fontSize: 13, textDecoration: "none", width: "100%", justifyContent: "center" }}>
          <Phone size={14} /> Postularme por WhatsApp
        </a>
      ) : (
        <button onClick={clicVerContacto} className="btn-outline" style={{ padding: "9px 14px", fontSize: 13, width: "100%", justifyContent: "center" }}>
          {bloqueado ? <Lock size={14} /> : <Eye size={14} />} {bloqueado ? "Desbloquear contacto" : "Ver contacto"}
        </button>
      )}
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,35,33,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 90 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", padding: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 className="oswald" style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "#F1F2F0", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PerfilForm({ onClose, onSubmit }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState(CIUDADES[0]);
  const [oficio, setOficio] = useState(OFICIOS[0].nombre);
  const [oficioPersonalizado, setOficioPersonalizado] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [foto, setFoto] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    const oficioFinal = oficio === "Otro (especificar)" ? oficioPersonalizado.trim() : oficio;
    if (!nombre.trim() || !telefono.trim() || !experiencia || !oficioFinal) {
      setErr("Completa nombre, WhatsApp, oficio y años de experiencia.");
      return;
    }
    if (!aceptaTerminos) {
      setErr("Debes aceptar el compromiso de información veraz para publicar.");
      return;
    }
    const categoria = OFICIOS.find((o) => o.nombre === oficio)?.categoria || "Industria";
    const id = genId();

    setSubiendo(true);
    const documento_url = await subirArchivo(archivo, `doc-${id}`);
    const foto_url = await subirArchivo(foto, `foto-${id}`);
    setSubiendo(false);

    onSubmit({
      id, nombre: nombre.trim(), telefono: telefono.trim(), ciudad, oficio: oficioFinal, categoria,
      experiencia: Number(experiencia), descripcion: descripcion.trim(), fecha: Date.now(), verificado: false,
      documento_url, foto_url,
    });
  }

  return (
    <ModalShell title="Ofrezco mis servicios" onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Nombre completo</label>
          <input style={inputStyle} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: José Rodríguez" />
        </div>
        <div>
          <label style={labelStyle}>WhatsApp (con código de país)</label>
          <input style={inputStyle} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 58412XXXXXXX" />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Ciudad</label>
            <select style={inputStyle} value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
              {CIUDADES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Años de experiencia</label>
            <input type="number" min="0" style={inputStyle} value={experiencia} onChange={(e) => setExperiencia(e.target.value)} placeholder="5" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Oficio</label>
          <select style={inputStyle} value={oficio} onChange={(e) => setOficio(e.target.value)}>
            {OFICIOS.map((o) => <option key={o.nombre}>{o.nombre}</option>)}
          </select>
          {oficio === "Otro (especificar)" && (
            <input style={{ ...inputStyle, marginTop: 8 }} value={oficioPersonalizado} onChange={(e) => setOficioPersonalizado(e.target.value)} placeholder="Escribe tu oficio" />
          )}
        </div>
        <div>
          <label style={labelStyle}>Breve descripción (opcional)</label>
          <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Certificaciones, tipo de proyectos, disponibilidad..." />
        </div>
        <div>
          <label style={labelStyle}>Foto de perfil (opcional)</label>
          <input type="file" accept=".jpg,.jpeg,.png" style={inputStyle} onChange={(e) => setFoto(e.target.files[0] || null)} />
        </div>
        <div>
          <label style={labelStyle}>Currículo o tarjeta de presentación (opcional)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={inputStyle} onChange={(e) => setArchivo(e.target.files[0] || null)} />
          <p style={{ fontSize: 11.5, color: "#8A928C", margin: "4px 0 0" }}>PDF o imagen, máximo 5 MB.</p>
        </div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "#5B655F", cursor: "pointer", lineHeight: 1.4 }}>
          <input type="checkbox" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} style={{ marginTop: 2 }} />
          Confirmo que mis datos son reales y me comprometo a no publicar información falsa. Entiendo que la plataforma no verifica identidades por defecto.
        </label>
        {err && <p style={{ color: "#C1432B", fontSize: 13, margin: 0 }}>{err}</p>}
        <button type="submit" disabled={subiendo} className="btn-amber" style={{ justifyContent: "center", marginTop: 4 }}>
          {subiendo ? "Subiendo archivos..." : "Publicar mi perfil"}
        </button>
      </form>
    </ModalShell>
  );
}

function VacanteForm({ onClose, onSubmit }) {
  const [empresa, setEmpresa] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState(CIUDADES[0]);
  const [oficio, setOficio] = useState(OFICIOS[0].nombre);
  const [descripcion, setDescripcion] = useState("");
  const [urgente, setUrgente] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!empresa.trim() || !telefono.trim()) {
      setErr("Completa el nombre de contacto/empresa y el WhatsApp.");
      return;
    }
    if (!aceptaTerminos) {
      setErr("Debes aceptar el compromiso de información veraz para publicar.");
      return;
    }
    const categoria = OFICIOS.find((o) => o.nombre === oficio)?.categoria || "Industria";
    onSubmit({
      id: genId(), empresa: empresa.trim(), telefono: telefono.trim(), ciudad, oficio, categoria,
      descripcion: descripcion.trim(), urgente, fecha: Date.now(), verificado: false,
    });
  }

  return (
    <ModalShell title="Publicar vacante" onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Empresa o nombre de contacto</label>
          <input style={inputStyle} value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Ej: Constructora Andes C.A." />
        </div>
        <div>
          <label style={labelStyle}>WhatsApp de contacto</label>
          <input style={inputStyle} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 58412XXXXXXX" />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Ciudad</label>
            <select style={inputStyle} value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
              {CIUDADES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Oficio requerido</label>
            <select style={inputStyle} value={oficio} onChange={(e) => setOficio(e.target.value)}>
              {OFICIOS.map((o) => <option key={o.nombre}>{o.nombre}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Descripción</label>
          <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Duración del trabajo, pago, requisitos..." />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} />
          Es una necesidad urgente
        </label>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "#5B655F", cursor: "pointer", lineHeight: 1.4 }}>
          <input type="checkbox" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} style={{ marginTop: 2 }} />
          Confirmo que esta oferta es real y me comprometo a no publicar información falsa. Entiendo que la plataforma no verifica identidades por defecto.
        </label>
        {err && <p style={{ color: "#C1432B", fontSize: 13, margin: 0 }}>{err}</p>}
        <button type="submit" className="btn-steel" style={{ justifyContent: "center", marginTop: 4 }}>Publicar vacante</button>
      </form>
    </ModalShell>
  );
}

function AdminLogin({ onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setErr("Contraseña incorrecta.");
    }
  }

  return (
    <ModalShell title="Acceso de administrador" onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Contraseña</label>
          <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoFocus />
        </div>
        {err && <p style={{ color: "#C1432B", fontSize: 13, margin: 0 }}>{err}</p>}
        <button type="submit" className="btn-steel" style={{ justifyContent: "center" }}>Entrar</button>
      </form>
    </ModalShell>
  );
}

function FilaAdminPerfil({ p, onBorrar, onEditar }) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(p.nombre);
  const [oficio, setOficio] = useState(p.oficio);
  const [ciudad, setCiudad] = useState(p.ciudad);
  const [telefono, setTelefono] = useState(p.telefono);
  const [experiencia, setExperiencia] = useState(p.experiencia);
  const [descripcion, setDescripcion] = useState(p.descripcion || "");
  const [verificado, setVerificado] = useState(!!p.verificado);
  const [nuevoArchivo, setNuevoArchivo] = useState(null);
  const [nuevaFoto, setNuevaFoto] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const dias = diasRestantes(p.fecha);
  const vencido = dias <= 0;

  async function guardar() {
    setGuardando(true);
    const cambios = { nombre, oficio, ciudad, telefono, experiencia: Number(experiencia), descripcion, verificado };
    if (nuevoArchivo) {
      const url = await subirArchivo(nuevoArchivo, `doc-${p.id}`);
      if (url) cambios.documento_url = url;
    }
    if (nuevaFoto) {
      const url = await subirArchivo(nuevaFoto, `foto-${p.id}`);
      if (url) cambios.foto_url = url;
    }
    setGuardando(false);
    onEditar(p.id, cambios);
    setEditando(false);
  }

  if (editando) {
    return (
      <div style={{ background: "#fff", border: "1.5px solid #33495E", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ ...inputStyle, flex: 1, minWidth: 140 }} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" />
          <input style={{ ...inputStyle, flex: 1, minWidth: 140 }} value={oficio} onChange={(e) => setOficio(e.target.value)} placeholder="Oficio (escribe libremente)" />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select style={{ ...inputStyle, flex: 1, minWidth: 140 }} value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
            {CIUDADES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input style={{ ...inputStyle, flex: 1, minWidth: 140 }} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" />
          <input type="number" style={{ ...inputStyle, width: 90 }} value={experiencia} onChange={(e) => setExperiencia(e.target.value)} placeholder="Años" />
        </div>
        <textarea style={{ ...inputStyle, minHeight: 50 }} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer" }}>
          <input type="checkbox" checked={verificado} onChange={(e) => setVerificado(e.target.checked)} /> Marcar como verificado
        </label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ ...labelStyle, marginBottom: 4 }}>Cambiar/subir foto de perfil</label>
            <input type="file" accept=".jpg,.jpeg,.png" style={inputStyle} onChange={(e) => setNuevaFoto(e.target.files[0] || null)} />
            {p.foto_url && !nuevaFoto && <span style={{ fontSize: 11, color: "#5B655F" }}>Ya tiene foto — sube una para reemplazarla.</span>}
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ ...labelStyle, marginBottom: 4 }}>Cambiar/subir currículo</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={inputStyle} onChange={(e) => setNuevoArchivo(e.target.files[0] || null)} />
            {p.documento_url && !nuevoArchivo && <span style={{ fontSize: 11, color: "#5B655F" }}>Ya tiene archivo — sube uno para reemplazarlo.</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={guardar} disabled={guardando} className="btn-amber" style={{ padding: "7px 14px", fontSize: 12.5 }}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
          <button onClick={() => setEditando(false)} className="btn-outline" style={{ padding: "7px 14px", fontSize: 12.5 }}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #E2E5E3", borderRadius: 10, padding: "10px 14px", gap: 10, flexWrap: "wrap" }}>
      <div style={{ fontSize: 13.5 }}>
        <strong>{p.nombre}</strong> — {p.oficio} — {p.ciudad}{" "}
        <span style={{ color: vencido ? "#C1432B" : "#5B655F" }}>
          ({vencido ? "vencido" : `${dias} días restantes`})
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setEditando(true)} className="btn-outline" style={{ padding: "6px 12px", fontSize: 12.5 }}>Editar</button>
        <button onClick={() => { if (window.confirm(`¿Borrar el perfil de ${p.nombre}?`)) onBorrar(p.id); }} className="btn-outline" style={{ padding: "6px 12px", fontSize: 12.5, borderColor: "#C1432B", color: "#C1432B" }}>
          Borrar
        </button>
      </div>
    </div>
  );
}

function FilaAdminVacante({ v, onBorrar, onEditar }) {
  const [editando, setEditando] = useState(false);
  const [empresa, setEmpresa] = useState(v.empresa);
  const [oficio, setOficio] = useState(v.oficio);
  const [ciudad, setCiudad] = useState(v.ciudad);
  const [telefono, setTelefono] = useState(v.telefono);
  const [descripcion, setDescripcion] = useState(v.descripcion || "");
  const dias = diasRestantes(v.fecha);
  const vencido = dias <= 0;

  function guardar() {
    onEditar(v.id, { empresa, oficio, ciudad, telefono, descripcion });
    setEditando(false);
  }

  if (editando) {
    return (
      <div style={{ background: "#fff", border: "1.5px solid #33495E", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ ...inputStyle, flex: 1, minWidth: 140 }} value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Empresa" />
          <input style={{ ...inputStyle, flex: 1, minWidth: 140 }} value={oficio} onChange={(e) => setOficio(e.target.value)} placeholder="Oficio (escribe libremente)" />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select style={{ ...inputStyle, flex: 1, minWidth: 140 }} value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
            {CIUDADES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input style={{ ...inputStyle, flex: 1, minWidth: 140 }} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="WhatsApp" />
        </div>
        <textarea style={{ ...inputStyle, minHeight: 50 }} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={guardar} className="btn-amber" style={{ padding: "7px 14px", fontSize: 12.5 }}>Guardar</button>
          <button onClick={() => setEditando(false)} className="btn-outline" style={{ padding: "7px 14px", fontSize: 12.5 }}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #E2E5E3", borderRadius: 10, padding: "10px 14px", gap: 10, flexWrap: "wrap" }}>
      <div style={{ fontSize: 13.5 }}>
        <strong>{v.empresa}</strong> — {v.oficio} — {v.ciudad}{" "}
        <span style={{ color: vencido ? "#C1432B" : "#5B655F" }}>
          ({vencido ? "vencido" : `${dias} días restantes`})
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setEditando(true)} className="btn-outline" style={{ padding: "6px 12px", fontSize: 12.5 }}>Editar</button>
        <button onClick={() => { if (window.confirm(`¿Borrar la vacante de ${v.empresa}?`)) onBorrar(v.id); }} className="btn-outline" style={{ padding: "6px 12px", fontSize: 12.5, borderColor: "#C1432B", color: "#C1432B" }}>
          Borrar
        </button>
      </div>
    </div>
  );
}

function ConfiguracionAdmin({ config, onGuardar }) {
  const [pagosActivos, setPagosActivos] = useState(config.pagos_activos);
  const [precioBusca, setPrecioBusca] = useState(config.precio_busca_trabajo);
  const [precioOfrece, setPrecioOfrece] = useState(config.precio_ofrece_trabajo);
  const [whatsapp, setWhatsapp] = useState(config.whatsapp_contacto);

  function guardar() {
    onGuardar({
      pagos_activos: pagosActivos,
      precio_busca_trabajo: Number(precioBusca),
      precio_ofrece_trabajo: Number(precioOfrece),
      whatsapp_contacto: whatsapp,
    });
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E5E3", borderRadius: 12, padding: 18, marginBottom: 28 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 16, cursor: "pointer" }}>
        <input type="checkbox" checked={pagosActivos} onChange={(e) => setPagosActivos(e.target.checked)} />
        Cobro activado (si está desmarcado, todo sigue gratis y solo se muestra el precio como aviso)
      </label>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={labelStyle}>Tarifa: busca trabajo (USD)</label>
          <input type="number" step="0.5" min="0" style={inputStyle} value={precioBusca} onChange={(e) => setPrecioBusca(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={labelStyle}>Tarifa: ofrece trabajo (USD)</label>
          <input type="number" step="0.5" min="0" style={inputStyle} value={precioOfrece} onChange={(e) => setPrecioOfrece(e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>WhatsApp de contacto (con código de país, ej: 584128412750)</label>
        <input style={inputStyle} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </div>
      <button onClick={guardar} className="btn-steel">Guardar configuración</button>
    </div>
  );
}

function AdminPanel({ perfiles, vacantes, onBorrarPerfil, onBorrarVacante, onEditarPerfil, onEditarVacante, config, onGuardarConfig, onCerrar }) {
  return (
    <div style={{ marginTop: 40, borderTop: "3px solid #1C2321", paddingTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 className="oswald" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Panel de administrador</h2>
        <button onClick={onCerrar} className="btn-outline" style={{ padding: "6px 12px", fontSize: 13 }}>Cerrar panel</button>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Configuración de tarifas y contacto</h3>
      <ConfiguracionAdmin config={config} onGuardar={onGuardarConfig} />

      <CuentasPagoAdmin />
      <CodigosAccesoAdmin />

      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Perfiles ({perfiles.length})</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
        {perfiles.map((p) => (
          <FilaAdminPerfil key={p.id} p={p} onBorrar={onBorrarPerfil} onEditar={onEditarPerfil} />
        ))}
        {perfiles.length === 0 && <p style={{ fontSize: 13.5, color: "#8A928C" }}>No hay perfiles registrados.</p>}
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Vacantes ({vacantes.length})</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {vacantes.map((v) => (
          <FilaAdminVacante key={v.id} v={v} onBorrar={onBorrarVacante} onEditar={onEditarVacante} />
        ))}
        {vacantes.length === 0 && <p style={{ fontSize: 13.5, color: "#8A928C" }}>No hay vacantes publicadas.</p>}
      </div>
    </div>
  );
}

function SeccionPrecios({ config }) {
  return (
    <section style={{ background: "#F1F2F0", padding: "44px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFF4DE", border: "1px solid #F2A71B", borderRadius: 20, padding: "5px 14px", marginBottom: 14 }}>
          <Sparkles size={13} color="#C97F0B" />
          <span className="mono" style={{ fontSize: 11.5, color: "#C97F0B", fontWeight: 700 }}>
            {config.pagos_activos ? "PLANES ACTIVOS" : "PRÓXIMAMENTE — POR AHORA TODO ES GRATIS"}
          </span>
        </div>
        <h2 className="oswald" style={{ fontSize: 24, fontWeight: 700, margin: "0 0 10px" }}>Precios de acceso a la búsqueda</h2>
        <p style={{ color: "#5B655F", fontSize: 14, maxWidth: 560, margin: "0 auto 20px" }}>
          Hoy puedes registrarte y buscar totalmente gratis. Cuando se active el cobro, esto es lo que costará acceder a la búsqueda:
        </p>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
          <div style={{ background: "#fff", border: "1px solid #E2E5E3", borderRadius: 14, padding: 26, width: 240 }}>
            <div className="oswald" style={{ fontSize: 34, fontWeight: 700, color: "#F2A71B" }}>${config.precio_busca_trabajo}</div>
            <div style={{ fontSize: 13, color: "#5B655F", marginBottom: 12 }}>por acceso, profesionales y obreros</div>
            <p style={{ fontSize: 12.5, color: "#3F4642", margin: 0 }}>Para quienes buscan trabajo: acceder a las vacantes publicadas.</p>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E2E5E3", borderRadius: 14, padding: 26, width: 240 }}>
            <div className="oswald" style={{ fontSize: 34, fontWeight: 700, color: "#33495E" }}>${config.precio_ofrece_trabajo}</div>
            <div style={{ fontSize: 13, color: "#5B655F", marginBottom: 12 }}>por acceso, empleadores</div>
            <p style={{ fontSize: 12.5, color: "#3F4642", margin: 0 }}>Para quienes ofrecen trabajo: acceder al directorio de profesionales.</p>
          </div>
        </div>
        <a
          href={`https://wa.me/${(config.whatsapp_contacto || "").replace(/\D/g, "")}?text=${encodeURIComponent("Hola, tengo una consulta sobre OficioVE.")}`}
          target="_blank" rel="noopener noreferrer"
          className="btn-steel"
          style={{ textDecoration: "none", display: "inline-flex" }}
        >
          <Phone size={16} /> ¿Dudas? Escríbenos por WhatsApp
        </a>
      </div>
    </section>
  );
}

function DesbloqueoModal({ config, onClose, onDesbloqueado }) {
  const [cuentas, setCuentas] = useState([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(true);
  const [codigo, setCodigo] = useState("");
  const [err, setErr] = useState("");
  const [validando, setValidando] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("cuentas_pago").select("*").eq("activo", true);
      setCuentas(data || []);
      setCargandoCuentas(false);
    })();
  }, []);

  async function validarCodigo(e) {
    e.preventDefault();
    setErr("");
    if (!codigo.trim()) {
      setErr("Escribe el código que te dieron.");
      return;
    }
    setValidando(true);
    const { data, error } = await supabase.from("codigos_acceso").select("*").eq("codigo", codigo.trim().toUpperCase()).eq("usado", false).maybeSingle();
    if (error || !data) {
      setValidando(false);
      setErr("Código incorrecto o ya usado. Verifica con quien te lo dio.");
      return;
    }
    await supabase.from("codigos_acceso").update({ usado: true }).eq("id", data.id);
    setValidando(false);
    onDesbloqueado();
  }

  return (
    <ModalShell title="Desbloquear contactos" onClose={onClose}>
      <p style={{ fontSize: 13.5, color: "#5B655F", marginTop: -6, marginBottom: 16, lineHeight: 1.5 }}>
        Para ver los números de WhatsApp y currículos, primero realiza el pago a una de estas cuentas y luego escríbenos por WhatsApp para que te demos tu código de acceso.
      </p>

      {cargandoCuentas ? (
        <p style={{ fontSize: 13, color: "#8A928C" }}>Cargando cuentas de pago...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {cuentas.map((c) => (
            <div key={c.id} style={{ background: "#F7F8F7", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{c.metodo}</div>
              <div style={{ fontSize: 12.5, color: "#3F4642" }}>{c.datos}</div>
            </div>
          ))}
          {cuentas.length === 0 && <p style={{ fontSize: 13, color: "#8A928C" }}>Todavía no hay cuentas de pago cargadas. Escríbenos por WhatsApp para coordinar.</p>}
        </div>
      )}

      <a
        href={`https://wa.me/${(config.whatsapp_contacto || "").replace(/\D/g, "")}?text=${encodeURIComponent("Hola, ya realicé el pago en OficioVE y quisiera mi código de acceso.")}`}
        target="_blank" rel="noopener noreferrer"
        className="btn-steel"
        style={{ textDecoration: "none", width: "100%", justifyContent: "center", marginBottom: 20 }}
      >
        <Phone size={15} /> Ya pagué, pedir mi código por WhatsApp
      </a>

      <div style={{ borderTop: "1px dashed #E2E5E3", paddingTop: 16 }}>
        <form onSubmit={validarCodigo} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={labelStyle}>¿Ya tienes tu código de acceso?</label>
          <input style={inputStyle} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Escribe tu código aquí" />
          {err && <p style={{ color: "#C1432B", fontSize: 12.5, margin: 0 }}>{err}</p>}
          <button type="submit" disabled={validando} className="btn-amber" style={{ justifyContent: "center" }}>
            {validando ? "Validando..." : "Desbloquear con mi código"}
          </button>
        </form>
      </div>
    </ModalShell>
  );
}

function CuentasPagoAdmin() {
  const [cuentas, setCuentas] = useState([]);
  const [metodo, setMetodo] = useState("");
  const [datos, setDatos] = useState("");

  async function cargar() {
    const { data } = await supabase.from("cuentas_pago").select("*").order("metodo");
    setCuentas(data || []);
  }

  useEffect(() => { cargar(); }, []);

  async function agregar() {
    if (!metodo.trim() || !datos.trim()) return;
    await supabase.from("cuentas_pago").insert({ metodo: metodo.trim(), datos: datos.trim(), activo: true });
    setMetodo("");
    setDatos("");
    cargar();
  }

  async function toggleActivo(c) {
    await supabase.from("cuentas_pago").update({ activo: !c.activo }).eq("id", c.id);
    cargar();
  }

  async function borrar(id) {
    if (!window.confirm("¿Borrar esta cuenta de pago?")) return;
    await supabase.from("cuentas_pago").delete().eq("id", id);
    cargar();
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E5E3", borderRadius: 12, padding: 18, marginBottom: 28 }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Cuentas de pago (Pago Móvil, Zelle, Binance, etc.)</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {cuentas.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#F7F8F7", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 13 }}>{c.metodo}</strong> — <span style={{ fontSize: 12.5, color: "#5B655F" }}>{c.datos}</span>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#5B655F" }}>
              <input type="checkbox" checked={c.activo} onChange={() => toggleActivo(c)} /> Activa
            </label>
            <button onClick={() => borrar(c.id)} style={{ background: "none", border: "none", color: "#C1432B", cursor: "pointer" }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {cuentas.length === 0 && <p style={{ fontSize: 13, color: "#8A928C" }}>No hay cuentas cargadas todavía.</p>}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input style={{ ...inputStyle, flex: 1, minWidth: 140 }} value={metodo} onChange={(e) => setMetodo(e.target.value)} placeholder="Método (ej: Pago Móvil)" />
        <input style={{ ...inputStyle, flex: 2, minWidth: 200 }} value={datos} onChange={(e) => setDatos(e.target.value)} placeholder="Datos (banco, teléfono, cédula, correo...)" />
        <button onClick={agregar} className="btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <PlusCircle size={15} /> Agregar
        </button>
      </div>
    </div>
  );
}

function CodigosAccesoAdmin() {
  const [codigos, setCodigos] = useState([]);
  const [generando, setGenerando] = useState(false);

  async function cargar() {
    const { data } = await supabase.from("codigos_acceso").select("*").order("fecha", { ascending: false }).limit(20);
    setCodigos(data || []);
  }

  useEffect(() => { cargar(); }, []);

  function generarCodigoTexto() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let c = "";
    for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return c;
  }

  async function generar() {
    setGenerando(true);
    const codigo = generarCodigoTexto();
    await supabase.from("codigos_acceso").insert({ codigo, usado: false, fecha: Date.now() });
    setGenerando(false);
    cargar();
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E5E3", borderRadius: 12, padding: 18, marginBottom: 28 }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>Códigos de acceso</h4>
      <p style={{ fontSize: 12.5, color: "#5B655F", margin: "0 0 12px" }}>
        Cuando alguien te confirme el pago, genera un código y envíaselo por WhatsApp. Es de un solo uso.
      </p>
      <button onClick={generar} disabled={generando} className="btn-amber" style={{ marginBottom: 14 }}>
        {generando ? "Generando..." : "Generar nuevo código"}
      </button>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {codigos.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F7F8F7", borderRadius: 8, padding: "6px 12px" }}>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{c.codigo}</span>
            <span style={{ fontSize: 11.5, color: c.usado ? "#8A928C" : "#3F8F5F", fontWeight: 600 }}>
              {c.usado ? "Usado" : "Disponible"}
            </span>
          </div>
        ))}
        {codigos.length === 0 && <p style={{ fontSize: 13, color: "#8A928C" }}>Aún no has generado ningún código.</p>}
      </div>
    </div>
  );
}
