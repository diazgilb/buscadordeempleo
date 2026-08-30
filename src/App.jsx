import React, { useState, useEffect, useMemo } from "react";
import {
  Search, MapPin, Phone, Briefcase, UserPlus, Building2, X,
  Wrench, Hammer, ChevronDown, Clock, Users, Zap, CheckCircle2, Menu,
  ShieldCheck, Eye, AlertTriangle
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

function credencial(id) {
  return "VE-" + id.slice(-6).toUpperCase();
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

  useEffect(() => {
    (async () => {
      const { data: p, error: ep } = await supabase.from("perfiles").select("*").order("fecha", { ascending: false });
      if (!ep && p) setPerfiles(p);
      const { data: v, error: ev } = await supabase.from("vacantes").select("*").order("fecha", { ascending: false });
      if (!ev && v) setVacantes(v);
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

  const perfilesFiltrados = useMemo(() => {
    return perfiles.filter((p) => {
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
                {perfilesFiltrados.map((p) => <PerfilCard key={p.id} p={p} />)}
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
                {vacantesFiltradas.map((v) => <VacanteCard key={v.id} v={v} />)}
              </div>
            )}
          </>
        )}
      </main>

      <footer style={{ background: "#1C2321", padding: "24px 20px", textAlign: "center" }}>
        <p style={{ color: "#8A928C", fontSize: 12.5, margin: 0, maxWidth: 560, marginInline: "auto" }}>
          Los perfiles y vacantes que publiques aquí quedan visibles para cualquiera que use este enlace — no ingreses datos que no quieras compartir públicamente.
        </p>
      </footer>

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

function PerfilCard({ p }) {
  const [revelado, setRevelado] = useState(false);
  const color = CATEGORIA_COLOR[p.categoria] || "#33495E";
  const iniciales = p.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className="card-lift" style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #E2E5E3", position: "relative" }}>
      <div style={{ height: 8, background: color }} />
      <div className="badge-notch" style={{ position: "relative", padding: "22px 18px 18px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }} className="oswald">
            {iniciales}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
            <div style={{ color, fontSize: 13, fontWeight: 600 }}>{p.oficio}</div>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px dashed #E2E5E3", paddingTop: 12 }}>
          <span className="mono" style={{ fontSize: 11, color: "#8A928C" }}>{credencial(p.id)}</span>
          {revelado ? (
            <a href={waLink(p.telefono, `Hola ${p.nombre.split(" ")[0]}, vi tu perfil como ${p.oficio} en OficioVE y quisiera contactarte.`)} target="_blank" rel="noopener noreferrer" className="btn-amber" style={{ padding: "8px 14px", fontSize: 13, textDecoration: "none" }}>
              <Phone size={14} /> WhatsApp
            </a>
          ) : (
            <button onClick={() => setRevelado(true)} className="btn-outline" style={{ padding: "8px 14px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Eye size={14} /> Ver contacto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function VacanteCard({ v }) {
  const [revelado, setRevelado] = useState(false);
  const color = CATEGORIA_COLOR[v.categoria] || "#33495E";
  return (
    <div className="card-lift" style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E5E3", padding: 18, position: "relative" }}>
      {v.urgente && (
        <span style={{ position: "absolute", top: -10, right: 14, background: "#C1432B", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
          <Zap size={11} /> URGENTE
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{v.oficio}</div>
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
      {revelado ? (
        <a href={waLink(v.telefono, `Hola, vi la vacante de ${v.oficio} en ${v.empresa} publicada en OficioVE. Me interesa postularme.`)} target="_blank" rel="noopener noreferrer" className="btn-steel" style={{ padding: "9px 14px", fontSize: 13, textDecoration: "none", width: "100%", justifyContent: "center" }}>
          <Phone size={14} /> Postularme por WhatsApp
        </a>
      ) : (
        <button onClick={() => setRevelado(true)} className="btn-outline" style={{ padding: "9px 14px", fontSize: 13, width: "100%", justifyContent: "center" }}>
          <Eye size={14} /> Ver contacto
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
  const [experiencia, setExperiencia] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim() || !experiencia) {
      setErr("Completa nombre, WhatsApp y años de experiencia.");
      return;
    }
    if (!aceptaTerminos) {
      setErr("Debes aceptar el compromiso de información veraz para publicar.");
      return;
    }
    const categoria = OFICIOS.find((o) => o.nombre === oficio)?.categoria || "Industria";
    onSubmit({
      id: genId(), nombre: nombre.trim(), telefono: telefono.trim(), ciudad, oficio, categoria,
      experiencia: Number(experiencia), descripcion: descripcion.trim(), fecha: Date.now(), verificado: false,
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
        </div>
        <div>
          <label style={labelStyle}>Breve descripción (opcional)</label>
          <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Certificaciones, tipo de proyectos, disponibilidad..." />
        </div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "#5B655F", cursor: "pointer", lineHeight: 1.4 }}>
          <input type="checkbox" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} style={{ marginTop: 2 }} />
          Confirmo que mis datos son reales y me comprometo a no publicar información falsa. Entiendo que la plataforma no verifica identidades por defecto.
        </label>
        {err && <p style={{ color: "#C1432B", fontSize: 13, margin: 0 }}>{err}</p>}
        <button type="submit" className="btn-amber" style={{ justifyContent: "center", marginTop: 4 }}>Publicar mi perfil</button>
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
