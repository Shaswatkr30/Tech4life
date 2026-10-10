import AdminLogin from "./AdminLogin.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import HospitalAdminPortal from "./HospitalAdminPortal.jsx";
import { EmergencyDashboard, EmergencyReport } from "./EmergencyCenter.jsx";
import GeoIntelligence from "./GeoIntelligence.jsx";
import "./PagesPolish.css";

import { useEffect, useState } from "react";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Droplets,
  HeartPulse,
  Hospital,
  LogIn,
  LogOut,
  Mail,
  LockKeyhole,
  ArrowLeft,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";

import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";


// ============================================================
// COMMON HELPERS
// ============================================================

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      "Something went wrong. Please try again.";

    throw new Error(message);
  }

  return data;

  
}


function getToken() {
  return localStorage.getItem("tech4life_token");
}


function authHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function formatUpdatedAt(dateString) {
  if (!dateString) {
    return "Update time unavailable";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Update time unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ============================================================
// NAVBAR
// ============================================================

function Navbar() {
  const navigate = useNavigate();

  const token = getToken();

  const handleLogout = () => {
    localStorage.removeItem("tech4life_token");
    navigate("/");
    window.location.reload();
  };

  return (
    <nav className="navbar">

      {/* Logo */}
      <div
        className="navbar-logo"
        onClick={() => navigate("/")}
      >
        <div className="logo-icon">
          <HeartPulse size={24} />
        </div>

        <div className="logo-text">
          <h2>Tech4Life</h2>
          <span>Healthcare Network</span>
        </div>
      </div>


      {/* Navigation */}
      <div className="navbar-links">

        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/resources"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Resources
        </NavLink>

        <NavLink
          to="/geo-intelligence"
          className={({ isActive }) => isActive ? "nav-link geo-nav-link active" : "nav-link geo-nav-link"}
        >
          <MapPin size={15} /> Geo Intelligence
        </NavLink>

        <NavLink to="/emergency/dashboard" className={({ isActive }) => isActive ? "nav-link emergency-nav-link active" : "nav-link emergency-nav-link"}>
          <AlertTriangle size={15} /> Emergency
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          About
        </NavLink>

        {token ? (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive
                  ? "nav-link active"
                  : "nav-link"
              }
            >
              Dashboard
            </NavLink>

            <button
              className="nav-logout"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive
                  ? "nav-link active"
                  : "nav-link"
              }
            >
              Login
            </NavLink>

            <NavLink
              to="/register"
              className="nav-register"
            >
              <UserPlus size={16} />
              Register Hospital
            </NavLink>
          </>
        )}

        {/* Admin */}
        <NavLink
          to="/admin/login"
          className={({ isActive }) =>
            isActive
              ? "nav-admin active"
              : "nav-admin"
          }
        >
          <ShieldCheck size={16} />
          Admin Portal
        </NavLink>

      </div>

    </nav>
  );
}


// ============================================================
// HOME PAGE
// ============================================================

function Home() {
  const navigate = useNavigate();

  return (
    <main>
      <section className="hero">
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <div className="hero-badge">
            <Activity size={16} />
            Healthcare Resource Network
          </div>

          <h1>
            Healthcare resources,
            <span> connected.</span>
          </h1>

          <p>
            Find blood, ICU beds, organs and medical equipment reported by
            registered hospitals through one centralized platform.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-button large"
              onClick={() => navigate("/geo-intelligence")}
            >
              Find Resources
              <ArrowRight size={19} />
            </button>

            <button
              className="secondary-button large"
              onClick={() => navigate("/register")}
            >
              Register Hospital
            </button>
          </div>

          <div className="hero-trust">
            <div>
              <CheckCircle2 size={17} />
              Registered hospitals
            </div>

            <div>
              <ShieldCheck size={17} />
              Secure hospital accounts
            </div>

            <div>
              <Clock3 size={17} />
              Resource updates
            </div>
          </div>
        </div>

        <aside className="hero-callout">
          <div className="hero-callout-photo"><img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=85" alt="Healthcare team coordinating patient care" /><span>HEALTHCARE RESOURCE NETWORK</span></div>
          <div className="hero-callout-top"><span>CONNECTED CARE</span><div><HeartPulse size={19} /></div></div>
          <h2>One network.<br />The resources that matter.</h2>
          <p>Find verified hospital updates in one clear place.</p>
          <div className="hero-resource-notes" aria-label="Resource categories">
            <button className="note-blood" onClick={() => navigate("/resources")}>Blood</button>
            <button className="note-icu" onClick={() => navigate("/resources")}>ICU beds</button>
            <button className="note-organs" onClick={() => navigate("/resources")}>Organs</button>
            <button className="note-equipment" onClick={() => navigate("/resources")}>Equipment</button>
          </div>
          <div className="hero-callout-bottom"><span><Building2 size={15} /> Hospitals</span><span><MapPin size={15} /> Nearby map</span></div>
        </aside>
      </section>


      <section className="stats-section">
        <div className="stats-grid">

          <button type="button" className="stat-card stat-card-button" onClick={() => navigate("/register")} aria-label="Register a hospital">
            <div className="stat-icon blue">
              <Building2 />
            </div>

            <div>
              <h3>Hospitals</h3>
              <p>Registered healthcare providers</p>
            </div>
            <img className="stat-photo stat-photo-hospital" src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=240&q=80" alt="" />
          </button>

          <button type="button" className="stat-card stat-card-button" onClick={() => navigate("/resources?search=blood")} aria-label="Browse blood availability">
            <div className="stat-icon red">
              <Droplets />
            </div>

            <div>
              <h3>Blood</h3>
              <p>Blood group availability</p>
            </div>
            <img className="stat-photo stat-photo-blood" src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=240&q=80" alt="" />
          </button>

          <button type="button" className="stat-card stat-card-button" onClick={() => navigate("/resources?search=icu")} aria-label="Browse ICU beds">
            <div className="stat-icon purple">
              <BedDouble />
            </div>

            <div>
              <h3>ICU Beds</h3>
              <p>Total and available beds</p>
            </div>
            <img className="stat-photo stat-photo-icu" src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=240&q=80" alt="" />
          </button>

          <button type="button" className="stat-card stat-card-button" onClick={() => navigate("/resources?search=equipment")} aria-label="Browse medical equipment">
            <div className="stat-icon green">
              <Wrench />
            </div>

            <div>
              <h3>Equipment</h3>
              <p>Medical equipment availability</p>
            </div>
            <img className="stat-photo stat-photo-equipment" src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=240&q=80" alt="" />
          </button>

        </div>
      </section>


      <section className="home-photo-gallery" aria-label="Healthcare network photos">
        <figure className="home-photo-card home-photo-card-main">
          <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85" alt="Healthcare professionals coordinating patient care" />
          <figcaption><span>CONNECTED CARE</span><strong>Care teams, working together</strong></figcaption>
        </figure>
        <figure className="home-photo-card">
          <img src="https://images.unsplash.com/photo-1584516150909-c43483ee7932?auto=format&fit=crop&w=900&q=85" alt="Doctor speaking with a patient" />
          <figcaption><span>PEOPLE FIRST</span><strong>Care that starts with people</strong></figcaption>
        </figure>
        <figure className="home-photo-card">
          <img src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=85" alt="Modern hospital interior" />
          <figcaption><span>CARE NETWORK</span><strong>Hospitals in one network</strong></figcaption>
        </figure>
      </section>


      <section className="features-section">
        <div className="section-heading">
          <span>CARE, CONNECTED</span>
          <h2>Find what you need, faster</h2>
          <p>
            Tech4Life brings hospital resource information together in a
            simple and searchable interface.
          </p>
        </div>

        <div className="feature-grid">

          <div className="feature-card" role="link" tabIndex={0} onClick={() => navigate("/resources")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate("/resources"); } }}>
            <img className="feature-photo" src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=320&q=80" alt="Blood donation" />
            <Droplets className="feature-icon red-text" />
            <h3>Blood Availability</h3>
            <p>
              Search hospitals and see reported blood groups and available
              units.
            </p>
          </div>

          <div className="feature-card" role="link" tabIndex={0} onClick={() => navigate("/resources")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate("/resources"); } }}>
            <img className="feature-photo" src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=320&q=80" alt="Hospital patient room" />
            <BedDouble className="feature-icon purple-text" />
            <h3>ICU Beds</h3>
            <p>
              View total ICU beds and currently available beds reported by
              hospitals.
            </p>
          </div>

          <div className="feature-card" role="link" tabIndex={0} onClick={() => navigate("/resources")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate("/resources"); } }}>
            <img className="feature-photo" src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=320&q=80" alt="Healthcare professionals coordinating care" />
            <HeartPulse className="feature-icon pink-text" />
            <h3>Organ Availability</h3>
            <p>
              View organ availability information provided by registered
              hospitals.
            </p>
          </div>

          <div className="feature-card" role="link" tabIndex={0} onClick={() => navigate("/resources")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate("/resources"); } }}>
            <img className="feature-photo" src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=320&q=80" alt="Medical equipment" />
            <Wrench className="feature-icon orange-text" />
            <h3>Medical Equipment</h3>
            <p>
              Check important medical equipment and available quantities.
            </p>
          </div>

        </div>

        <div className="home-join-card">
          <div><span>FOR HOSPITALS</span><h2>Make your resources easier to find.</h2><p>Join the network and keep your availability up to date for your community.</p></div>
          <button className="primary-button" onClick={() => navigate("/register")}>Register your hospital <ArrowRight size={17} /></button>
        </div>
      </section>
    </main>
  );
}


// ============================================================
// RESOURCES PAGE
// ============================================================

function Resources() {
  const [hospitals, setHospitals] = useState([]);
  const [blood, setBlood] = useState([]);
  const [icu, setIcu] = useState([]);
  const [organs, setOrgans] = useState([]);
  const [equipment, setEquipment] = useState([]);

  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("search") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const [
        hospitalsRes,
        bloodRes,
        icuRes,
        organsRes,
        equipmentRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/hospitals/`),
        fetch(`${API_BASE_URL}/api/blood/public`),
        fetch(`${API_BASE_URL}/api/icu/public`),
        fetch(`${API_BASE_URL}/api/organs/public`),
        fetch(`${API_BASE_URL}/api/equipment/public`)
      ]);

      const hospitalsData = await hospitalsRes.json();
      const bloodData = await bloodRes.json();
      const icuData = await icuRes.json();
      const organsData = await organsRes.json();
      const equipmentData = await equipmentRes.json();

      setHospitals(hospitalsData);
      setBlood(bloodData);
      setIcu(icuData);
      setOrgans(organsData);
      setEquipment(equipmentData);

    } catch (error) {
      console.error("Resource loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SEARCH ONLY RESOURCES
  // =====================================================

  const query = search.trim().toLowerCase();

  const resourceMatchesHospital = (hospital) => {
    if (!query) return true;

    const hospitalBlood = blood.filter(
      item => item.hospital_id === hospital.id
    );

    const hospitalICU = icu.filter(
      item => item.hospital_id === hospital.id
    );

    const hospitalOrgans = organs.filter(
      item => item.hospital_id === hospital.id
    );

    const hospitalEquipment = equipment.filter(
      item => item.hospital_id === hospital.id
    );

    // Blood search
    const bloodMatch = hospitalBlood.some(item =>
      query === "blood" ||
      item.blood_group.toLowerCase().includes(query)
    );

    // ICU search
    const icuMatch = hospitalICU.some(item =>
      query === "icu" ||
      query === "beds" ||
      query === "icu beds"
    );

    // Organ search
    const organMatch = hospitalOrgans.some(item =>
      query === "organ" ||
      item.organ_name.toLowerCase().includes(query)
    );

    // Equipment search
    const equipmentMatch = hospitalEquipment.some(item =>
      query === "equipment" ||
      item.equipment_name.toLowerCase().includes(query)
    );

    return (
      bloodMatch ||
      icuMatch ||
      organMatch ||
      equipmentMatch
    );
  };

  const filteredHospitals = hospitals.filter(resourceMatchesHospital);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-box">
          Loading healthcare resources...
        </div>
      </div>
    );
  }

  return (
    <div className="page resources-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="resources-header">

        <div>
          <span className="page-eyebrow"><Activity size={16} /> LIVE RESOURCE DIRECTORY</span>
          <h1>Care resources,<br /><em>all together.</em></h1>

          <p>
            Search hospital-reported blood, organs, ICU beds and medical equipment.
          </p>
          <Link className="resource-map-link" to="/geo-intelligence"><MapPin size={16} /> Explore the live map <ArrowRight size={15} /></Link>
        </div>

        <div className="resource-count"><strong>{filteredHospitals.length}</strong><span>{query ? "matching hospitals" : "hospitals in network"}</span></div>

      </div>


      {/* =================================================
          RESOURCE SEARCH
      ================================================= */}

      <div className="resource-search-wrapper">

        <div className="resource-search">

          <span className="search-icon">
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blood, A+, kidney, ICU, ventilator..."
          />

          {search && (
            <button
              className="clear-search"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}

        </div>

        <div className="search-hints">

          <button onClick={() => setSearch("blood")}>
            🩸 Blood
          </button>

          <button onClick={() => setSearch("icu")}>
            🛏️ ICU
          </button>

          <button onClick={() => setSearch("organ")}>
            🫀 Organs
          </button>

          <button onClick={() => setSearch("equipment")}>
            🛠️ Equipment
          </button>

          <button onClick={() => setSearch("A+")}>
            A+
          </button>

          <button onClick={() => setSearch("kidney")}>
            Kidney
          </button>

          <button onClick={() => setSearch("ventilator")}>
            Ventilator
          </button>

        </div>

      </div>


      {/* =================================================
          SEARCH RESULT
      ================================================= */}

      {query && (
        <div className="search-result-text">

          Showing hospitals with resource:
          <strong> {search}</strong>

        </div>
      )}


      {/* =================================================
          HOSPITAL CARDS
      ================================================= */}

      <div className="hospital-resource-grid">

        {filteredHospitals.map((hospital) => {

          const hospitalBlood = blood.filter(
            item => item.hospital_id === hospital.id
          );

          const hospitalICU = icu.filter(
            item => item.hospital_id === hospital.id
          );

          const hospitalOrgans = organs.filter(
            item => item.hospital_id === hospital.id
          );

          const hospitalEquipment = equipment.filter(
            item => item.hospital_id === hospital.id
          );

          return (

            <div
              className="hospital-resource-card"
              key={hospital.id}
            >

              {/* ================================
                  HOSPITAL HEADER
              ================================= */}

              <div className="hospital-card-header">

                <div>

                  <h2>
                    🏥 {hospital.name}
                  </h2>

                  <p>
                    📍 {hospital.city}, {hospital.state}
                  </p>

                </div>

                <span className="hospital-id">
                  ID: {hospital.id}
                </span>

              </div>


              {/* ================================
                  CONTACT
              ================================= */}

              <div className="hospital-contact">

                {hospital.phone && (
                  <span>
                    📞 {hospital.phone}
                  </span>
                )}

                {hospital.email && (
                  <span>
                    ✉️ {hospital.email}
                  </span>
                )}

              </div>


              {/* ================================
                  BLOOD
              ================================= */}

              <div className="resource-section resource-blood">

                <h3>
                  🩸 Blood Availability
                </h3>

                {hospitalBlood.length === 0 ? (

                  <p className="no-resource">
                    No blood information
                  </p>

                ) : (

                  <div className="resource-items">

                    {hospitalBlood.map((item) => (

                      <div className="resource-mini-card" key={item.id}>
  <span className="resource-item-emoji" aria-hidden="true">🩸</span>

  <strong>
    {item.blood_group}
  </strong>

  <span>
    {item.units_available} units
  </span>

  <small className="resource-updated">
    🕒 Updated: {formatUpdatedAt(item.updated_at)}
  </small>

</div>

                    ))}

                  </div>

                )}

              </div>


              {/* ================================
                  ICU
              ================================= */}

              <div className="resource-section resource-icu">

                <h3>
                  🛏️ ICU Beds
                </h3>

                {hospitalICU.length === 0 ? (

                  <p className="no-resource">
                    No ICU information
                  </p>

                ) : (

                  hospitalICU.map((item) => (

                   <div
  className="icu-box"
  key={item.id}
>

  <span>
    <span className="resource-item-emoji" aria-hidden="true">🛏️</span>
    Total Beds:
    <strong>
      {item.total_beds}
    </strong>
  </span>

  <span>
    Available:
    <strong>
      {item.available_beds}
    </strong>
  </span>

  <small className="resource-updated">
    🕒 Updated: {formatUpdatedAt(item.updated_at)}
  </small>

</div>

                  ))

                )}

              </div>


              {/* ================================
                  ORGANS
              ================================= */}

              <div className="resource-section resource-organs">

                <h3>
                  🫀 Organ Availability
                </h3>

                {hospitalOrgans.length === 0 ? (

                  <p className="no-resource">
                    No organ information
                  </p>

                ) : (

                  <div className="resource-items">

                    {hospitalOrgans.map((item) => (

                      <div
  className="resource-mini-card"
  key={item.id}
>
  <span className="resource-item-emoji" aria-hidden="true">🫀</span>

  <strong>
    {item.organ_name}
  </strong>

  <span
    className={
      item.available
        ? "available"
        : "not-available"
    }
  >
    {item.available
      ? "Available"
      : "Not Available"}
  </span>

  <small className="resource-updated">
    🕒 Updated: {formatUpdatedAt(item.updated_at)}
  </small>

</div>

                    ))}

                  </div>

                )}

              </div>


              {/* ================================
                  EQUIPMENT
              ================================= */}

              <div className="resource-section resource-equipment">

                <h3>
                  🛠️ Medical Equipment
                </h3>

                {hospitalEquipment.length === 0 ? (

                  <p className="no-resource">
                    No equipment information
                  </p>

                ) : (

                  <div className="resource-items">

                    {hospitalEquipment.map((item) => (

                     <div
  className="resource-mini-card"
  key={item.id}
>
  <span className="resource-item-emoji" aria-hidden="true">🛠️</span>

  <strong>
    {item.equipment_name}
  </strong>

  <span>
    {item.available_quantity}
    {" / "}
    {item.total_quantity} available
  </span>

  <small className="resource-updated">
    🕒 Updated: {formatUpdatedAt(item.updated_at)}
  </small>

</div>

                    ))}

                  </div>

                )}

              </div>

            </div>

          );

        })}

      </div>


      {/* =================================================
          NO RESULTS
      ================================================= */}

      {filteredHospitals.length === 0 && (

        <div className="no-results">

          <div className="no-results-icon">
            🔎
          </div>

          <h2>
            No resource found
          </h2>

          <p>
            Try searching for blood, ICU, organ,
            equipment, A+, kidney, ventilator, etc.
          </p>

          <button
            onClick={() => setSearch("")}
          >
            Show All Resources
          </button>

        </div>

      )}

    </div>
  );
}


// ============================================================
// HOSPITAL CARD
// ============================================================

function HospitalCard({ hospital }) {
  return (
    <article className="hospital-card">

      <div className="hospital-card-header">

        <div className="hospital-title-area">

          <div className="hospital-icon">
            <Hospital size={25} />
          </div>

          <div>
            <h2>{hospital.name}</h2>

            <p className="hospital-location">
              <MapPin size={15} />
              {hospital.city}, {hospital.state}
            </p>
          </div>

        </div>

        <span className="hospital-id">
          ID #{hospital.id}
        </span>

      </div>


      <div className="hospital-contact">

        {hospital.phone && (
          <a href={`tel:${hospital.phone}`}>
            <Phone size={16} />
            {hospital.phone}
          </a>
        )}

        {hospital.email && (
          <a href={`mailto:${hospital.email}`}>
            <Mail size={16} />
            {hospital.email}
          </a>
        )}

      </div>


      <div className="hospital-address">
        <MapPin size={15} />
        <span>{hospital.address}</span>
      </div>


      <div className="resource-section">

        <div className="resource-section-title">
          <Droplets size={19} />
          <span>Blood Availability</span>
        </div>

        {hospital.blood.length === 0 ? (
          <div className="no-resource">
            No blood information
          </div>
        ) : (
          <div className="mini-grid">

            {hospital.blood.map((item) => (
              <div className="mini-card blood-card" key={item.id}>
                <strong>{item.blood_group}</strong>
                <span>{item.units_available} units</span>
              </div>
            ))}

          </div>
        )}

      </div>


      <div className="resource-section">

        <div className="resource-section-title">
          <BedDouble size={19} />
          <span>ICU Beds</span>
        </div>

        {hospital.icu.length === 0 ? (
          <div className="no-resource">
            No ICU information
          </div>
        ) : (
          hospital.icu.map((item) => (
            <div className="icu-card" key={item.id}>
              <div>
                <span>Total Beds</span>
                <strong>{item.total_beds}</strong>
              </div>

              <div>
                <span>Available</span>
                <strong className="available-text">
                  {item.available_beds}
                </strong>
              </div>
            </div>
          ))
        )}

      </div>


      <div className="resource-section">

        <div className="resource-section-title">
          <HeartPulse size={19} />
          <span>Organ Availability</span>
        </div>

        {hospital.organs.length === 0 ? (
          <div className="no-resource">
            No organ information
          </div>
        ) : (
          <div className="mini-grid">

            {hospital.organs.map((item) => (
              <div className="mini-card organ-card" key={item.id}>
                <strong>{item.organ_name}</strong>

                <span
                  className={
                    item.available
                      ? "status-available"
                      : "status-unavailable"
                  }
                >
                  {item.available ? "Available" : "Not available"}
                </span>
              </div>
            ))}

          </div>
        )}

      </div>


      <div className="resource-section">

        <div className="resource-section-title">
          <Wrench size={19} />
          <span>Medical Equipment</span>
        </div>

        {hospital.equipment.length === 0 ? (
          <div className="no-resource">
            No equipment information
          </div>
        ) : (
          <div className="equipment-list">

            {hospital.equipment.map((item) => (
              <div className="equipment-row" key={item.id}>

                <div>
                  <strong>{item.equipment_name}</strong>
                  <span>
                    {item.total_quantity} total
                  </span>
                </div>

                <div className="equipment-available">
                  {item.available_quantity} available
                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </article>
  );
}


// ============================================================
// LOGIN
// ============================================================

function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetComplete, setResetComplete] = useState(false);


  function updateField(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }


  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(`${API_BASE_URL}/api/hospitals/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      localStorage.setItem("tech4life_token", data.access_token);

      navigate("/dashboard");
      window.location.reload();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    try {
      await apiRequest(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_type: "hospital", identifier: form.email }),
      });
      setResetSent(true);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  }

  async function handleOtpReset(e) {
    e.preventDefault();
    setResetLoading(true); setResetError("");
    try {
      await apiRequest(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_type: "hospital", identifier: form.email, otp: resetOtp, password: resetPassword }),
      });
      setResetComplete(true);
    } catch (err) { setResetError(err.message); } finally { setResetLoading(false); }
  }


  return (
    <main className="auth-page">

      <div className="auth-card">

        <div className="auth-icon">
          {resetMode ? <LockKeyhole size={27} /> : <LogIn size={27} />}
        </div>

        <div className="auth-heading">
          <span>TECH4LIFE · HOSPITAL NETWORK</span>
          <h1>{resetMode ? "Reset your password" : "Welcome back"}</h1>
          <p>{resetMode ? "We’ll send a six-digit password reset code to your registered Gmail address." : "Sign in to manage your hospital resources and keep your community connected."}</p>
        </div>

        {resetMode ? (
          resetComplete ? (
            <div className="reset-success" role="status">
              <CheckCircle2 size={22} />
              <div><strong>Password updated</strong><p>Your password changed successfully. You can sign in now.</p></div>
            </div>
          ) : resetSent ? (
            <form className="reset-form" onSubmit={handleOtpReset}>
              <p className="otp-destination">If an account exists, a six-digit code was sent to {form.email}.</p>
              <div className="form-group"><label htmlFor="hospital-reset-otp">Email verification code</label><input id="hospital-reset-otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={resetOtp} onChange={e => setResetOtp(e.target.value.replace(/\D/g, ""))} required /></div>
              <div className="form-group"><label htmlFor="hospital-reset-new-password">New password</label><input id="hospital-reset-new-password" type="password" minLength={8} value={resetPassword} onChange={e => setResetPassword(e.target.value)} required /></div>
              {resetError && <div className="form-error" role="alert">{resetError}</div>}
              <button className="primary-button full" disabled={resetLoading}>{resetLoading ? "Updating password…" : "Verify code and update password"}<ArrowRight size={18} /></button>
              <button type="button" className="forgot-password-link" onClick={() => { setResetSent(false); setResetOtp(""); }}>Send another code</button>
            </form>
          ) : (
            <form className="reset-form" onSubmit={handlePasswordReset}>
              <div className="form-group">
                <label htmlFor="reset-email">Hospital email address</label>
                <div className="input-wrapper"><Mail size={18} /><input id="reset-email" name="email" type="email" value={form.email} onChange={updateField} placeholder="name@hospital.com" required /></div>
              </div>
              {resetError && <div className="form-error" role="alert">{resetError}</div>}
              <button className="primary-button full" disabled={resetLoading}>{resetLoading ? "Sending code…" : "Send Gmail code"}<ArrowRight size={18} /></button>
            </form>
          )
        ) : <>
        {error && (
          <div className="form-error">
            {error}
          </div>
        )}


        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Email Address</label>

            <div className="input-wrapper">
              <Mail size={18} />

              <input
                id="hospital-email"
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="hospital@example.com"
                required
              />
            </div>
          </div>


          <div className="form-group">
            <label>Password</label>

            <input
              id="hospital-password"
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="button" className="forgot-password-link" onClick={() => { setResetMode(true); setResetSent(false); setResetComplete(false); setResetError(""); setError(""); }}>
            Forgot password?
          </button>


          <button
            className="primary-button full"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
            {!loading && <ArrowRight size={18} />}
          </button>

        </form>


        <p className="auth-bottom">
          Don't have a hospital account?

          <Link to="/register">
            Register Hospital
          </Link>
        </p>
        <div className="hospital-admin-entry">
          <span>Hospital administrator?</span>
          <Link to="/hospital-admin/login">Open admin sign in</Link>
          <Link to="/hospital-admin/register">Register admin for approval</Link>
        </div>
        </>}

        {resetMode ? (
          <button className="auth-back-link" onClick={() => { setResetMode(false); setResetSent(false); setResetComplete(false); setResetError(""); }}><ArrowLeft size={16} /> Back to hospital login</button>
        ) : null}
      </div>

    </main>
  );
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!token) return setError("This reset link is missing its token. Request a new link.");
    if (password !== confirmPassword) return setError("Your passwords do not match.");
    setLoading(true);
    try {
      await apiRequest(`${API_BASE_URL}/api/hospitals/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      setComplete(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-page"><section className="auth-card reset-card">
    <div className="auth-icon"><LockKeyhole size={27} /></div>
    <div className="auth-heading"><span>SECURE ACCOUNT RECOVERY</span><h1>{complete ? "Password updated" : "Create a new password"}</h1><p>{complete ? "Your hospital account is ready. Sign in with your new password." : "Choose a strong password with at least 8 characters."}</p></div>
    {complete ? <div className="reset-success" role="status"><CheckCircle2 size={22} /><div><strong>You’re all set</strong><p>Your password has been changed successfully.</p></div></div> : <form onSubmit={handleSubmit}>
      <div className="form-group"><label htmlFor="new-password">New password</label><input id="new-password" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} autoComplete="new-password" placeholder="At least 8 characters" required /></div>
      <div className="form-group"><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} autoComplete="new-password" placeholder="Enter it again" required /></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary-button full" disabled={loading}>{loading ? "Updating password…" : "Update password"}<ArrowRight size={18} /></button>
    </form>}
    <button className="auth-back-link" onClick={() => navigate("/login")}><ArrowLeft size={16} /> Back to hospital login</button>
  </section></main>;
}


// ============================================================
// REGISTER
// ============================================================

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    password: "",
    latitude: "",
    longitude: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  function updateField(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }


  async function handleSubmit(e) {
    e.preventDefault();

    const latitude = form.latitude === "" ? null : Number(form.latitude);
    const longitude = form.longitude === "" ? null : Number(form.longitude);

    if ((latitude === null) !== (longitude === null)) {
      setError("Enter both latitude and longitude to place your hospital on the map.");
      return;
    }

    if (latitude !== null && (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)) {
      setError("Please enter valid coordinates (latitude −90 to 90, longitude −180 to 180).");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name,
        address: form.address,
        city: form.city,
        state: form.state,
        phone: form.phone || null,
        email: form.email,
        password: form.password,
        latitude,
        longitude,
      };

      await apiRequest(`${API_BASE_URL}/api/hospitals/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setSuccess(
        "Hospital registered successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="auth-page">

      <div className="register-card">

        <div className="auth-icon">
          <UserPlus size={27} />
        </div>

        <div className="auth-heading">
          <span>JOIN TECH4LIFE</span>
          <h1>Register Hospital</h1>
          <p>
            Create a secure hospital account and manage your resources.
          </p>
        </div>


        {error && (
          <div className="form-error">
            {error}
          </div>
        )}


        {success && (
          <div className="form-success">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}


        <form onSubmit={handleSubmit}>

          <div className="form-section-title">
            <Building2 size={18} />
            Hospital Information
          </div>


          <div className="form-grid">

            <div className="form-group">
              <label>Hospital Name *</label>

              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="City Care Hospital"
                required
              />
            </div>


            <div className="form-group">
              <label>Phone Number</label>

              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>


            <div className="form-group full-width">
              <label>Hospital Address *</label>

              <input
                name="address"
                value={form.address}
                onChange={updateField}
                placeholder="Complete hospital address"
                required
              />
            </div>


            <div className="form-group">
              <label>City *</label>

              <input
                name="city"
                value={form.city}
                onChange={updateField}
                placeholder="Dehradun"
                required
              />
            </div>


            <div className="form-group">
              <label>State *</label>

              <input
                name="state"
                value={form.state}
                onChange={updateField}
                placeholder="Uttarakhand"
                required
              />
            </div>

          </div>


          <div className="form-section-title">
            <ShieldCheck size={18} />
            Account Security
          </div>


          <div className="form-grid">

            <div className="form-group">
              <label>Email Address *</label>

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="hospital@example.com"
                required
              />
            </div>


            <div className="form-group">
              <label>Password *</label>

              <input
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                placeholder="Create password"
                required
              />
            </div>

          </div>


          <div className="form-section-title optional-title">
            <MapPin size={18} />
            Location Coordinates
            <span>Optional</span>
          </div>

          <p className="coordinate-hint">Add both coordinates to place your hospital on the live Geo Intelligence map after approval.</p>


          <div className="form-grid">

            <div className="form-group">
              <label>Latitude</label>

              <input
                id="hospital-latitude"
                name="latitude"
                type="number"
                min="-90"
                max="90"
                step="any"
                required
                value={form.latitude}
                onChange={updateField}
                placeholder="30.3165"
              />
            </div>


            <div className="form-group">
              <label>Longitude</label>

              <input
                id="hospital-longitude"
                name="longitude"
                type="number"
                min="-180"
                max="180"
                step="any"
                required
                value={form.longitude}
                onChange={updateField}
                placeholder="78.0322"
              />
            </div>

          </div>


          <button
            className="primary-button full register-submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register Hospital"}
            {!loading && <ArrowRight size={18} />}
          </button>

        </form>
        <p className="auth-bottom">
          Already registered?

          <Link to="/login">
            Login here
          </Link>
        </p>

      </div>

    </main>
  );
}


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard() {
  const navigate = useNavigate();

  const [hospital, setHospital] = useState(null);

  const [blood, setBlood] = useState([]);
  const [icu, setIcu] = useState([]);
  const [organs, setOrgans] = useState([]);
  const [equipment, setEquipment] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    loadDashboard();
  }, []);


  async function loadDashboard() {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        hospitalData,
        bloodData,
        icuData,
        organData,
        equipmentData,
      ] = await Promise.all([
        apiRequest(`${API_BASE_URL}/api/hospitals/me`, { headers }),
        apiRequest(`${API_BASE_URL}/api/blood/my`, { headers }),
        apiRequest(`${API_BASE_URL}/api/icu/my`, { headers }),
        apiRequest(`${API_BASE_URL}/api/organs/my`, { headers }),
        apiRequest(`${API_BASE_URL}/api/equipment/my`, { headers }),
      ]);

      setHospital(hospitalData);
      setBlood(bloodData || []);
      setIcu(icuData || []);
      setOrgans(organData || []);
      setEquipment(equipmentData || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteHospital() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this hospital account? All its resources will also be deleted."
    );

    if (!confirmed) return;

    try {
      await apiRequest(`${API_BASE_URL}/api/hospitals/delete`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      localStorage.removeItem("tech4life_token");

      alert("Hospital account deleted successfully.");

      navigate("/");
      window.location.reload();

    } catch (err) {
      alert(err.message);
    }
  }


  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="loading-box">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </main>
    );
  }


  if (error) {
    return (
      <main className="dashboard-page">
        <div className="error-box">
          <strong>Dashboard error</strong>
          <p>{error}</p>

          <button
            className="primary-button"
            onClick={() => {
              localStorage.removeItem("tech4life_token");
              navigate("/login");
            }}
          >
            Login Again
          </button>
        </div>
      </main>
    );
  }


  return (
    <main className="dashboard-page">

      <section className="dashboard-top">

        <div>
          <div className="page-eyebrow">
            <Activity size={17} />
            HOSPITAL MANAGEMENT
          </div>

          <h1>{hospital?.name}</h1>

          <p>
            Manage your hospital information and available resources.
          </p>
        </div>

        <div className="dashboard-status">
          <span></span>
          Account Active
        </div>

      </section>


      <section className="hospital-profile">

        <div className="profile-icon">
          <Hospital size={31} />
        </div>

        <div className="profile-main">
          <h2>{hospital?.name}</h2>

          <div className="profile-details">

            <span>
              <Mail size={15} />
              {hospital?.email}
            </span>

            <span>
              <Phone size={15} />
              {hospital?.phone || "Phone not added"}
            </span>

            <span>
              <MapPin size={15} />
              {hospital?.city}, {hospital?.state}
            </span>

          </div>
        </div>

      </section>

      <section className="hospital-admin-callout">
        <div className="hospital-admin-callout-icon"><ShieldCheck size={21} /></div>
        <div><span>SEPARATE ADMIN ACCESS</span><h2>Hospital Admin verification</h2><p>Sign in as your hospital’s approved admin to review submitted details and publish them to the public directory.</p></div>
        <button className="primary-button" onClick={() => navigate("/hospital-admin/login")}>Open admin dashboard <ArrowRight size={16} /></button>
      </section>

      <div className="dashboard-stats">

        <DashboardStat
          icon={<Droplets />}
          title="Blood Groups"
          value={blood.length}
          className="red"
        />

        <DashboardStat
          icon={<BedDouble />}
          title="ICU Records"
          value={icu.length}
          className="purple"
        />

        <DashboardStat
          icon={<HeartPulse />}
          title="Organs"
          value={organs.length}
          className="pink"
        />

        <DashboardStat
          icon={<Wrench />}
          title="Equipment"
          value={equipment.length}
          className="orange"
        />

      </div>


      <ResourceManager
        title="Blood Availability"
        icon={<Droplets />}
        type="blood"
        items={blood}
        setItems={setBlood}
      />


      <ResourceManager
        title="ICU Beds"
        icon={<BedDouble />}
        type="icu"
        items={icu}
        setItems={setIcu}
      />


      <ResourceManager
        title="Organ Availability"
        icon={<HeartPulse />}
        type="organ"
        items={organs}
        setItems={setOrgans}
      />


      <ResourceManager
        title="Medical Equipment"
        icon={<Wrench />}
        type="equipment"
        items={equipment}
        setItems={setEquipment}
      />


      <section className="danger-zone">

        <div>
          <h3>Delete Hospital Account</h3>

          <p>
            Permanently delete your hospital account and all associated
            resource records.
          </p>
        </div>

        <button
          className="delete-hospital-button"
          onClick={deleteHospital}
        >
          <Trash2 size={18} />
          Delete Hospital
        </button>

      </section>

    </main>
  );
}


// ============================================================
// DASHBOARD STAT
// ============================================================

function DashboardStat({
  icon,
  title,
  value,
  className,
}) {
  return (
    <div className="dashboard-stat">

      <div className={`dashboard-stat-icon ${className}`}>
        {icon}
      </div>

      <div>
        <strong>{value}</strong>
        <span>{title}</span>
      </div>

    </div>
  );
}


// ============================================================
// RESOURCE MANAGER
// ============================================================

function ResourceManager({
  title,
  icon,
  type,
  items,
  setItems,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({});

  const [saving, setSaving] = useState(false);


  function resetForm() {
    if (type === "blood") {
      setForm({
        blood_group: "",
        units_available: "",
      });
    }

    if (type === "icu") {
      setForm({
        total_beds: "",
        available_beds: "",
      });
    }

    if (type === "organ") {
      setForm({
        organ_name: "",
        available: true,
      });
    }

    if (type === "equipment") {
      setForm({
        equipment_name: "",
        total_quantity: "",
        available_quantity: "",
      });
    }
  }


  function openCreate() {
    resetForm();
    setEditingId(null);
    setShowForm(true);
  }


  function openEdit(item) {
    if (type === "blood") {
      setForm({
        blood_group: item.blood_group,
        units_available: item.units_available,
      });
    }

    if (type === "icu") {
      setForm({
        total_beds: item.total_beds,
        available_beds: item.available_beds,
      });
    }

    if (type === "organ") {
      setForm({
        organ_name: item.organ_name,
        available: item.available,
      });
    }

    if (type === "equipment") {
      setForm({
        equipment_name: item.equipment_name,
        total_quantity: item.total_quantity,
        available_quantity: item.available_quantity,
      });
    }

    setEditingId(item.id);
    setShowForm(true);
  }


  function updateForm(e) {
    const { name, value, type: inputType, checked } = e.target;

    setForm({
      ...form,
      [name]: inputType === "checkbox" ? checked : value,
    });
  }


  function endpoint() {
    if (type === "blood") return "blood";
    if (type === "icu") return "icu";
    if (type === "organ") return "organs";
    return "equipment";
  }


  function createPayload() {
    if (type === "blood") {
      return {
        blood_group: form.blood_group,
        units_available: Number(form.units_available),
      };
    }

    if (type === "icu") {
      return {
        total_beds: Number(form.total_beds),
        available_beds: Number(form.available_beds),
      };
    }

    if (type === "organ") {
      return {
        organ_name: form.organ_name,
        available: form.available,
      };
    }

    return {
      equipment_name: form.equipment_name,
      total_quantity: Number(form.total_quantity),
      available_quantity: Number(form.available_quantity),
    };
  }


  async function saveResource(e) {
    e.preventDefault();

    try {
      setSaving(true);

      const url = editingId
        ? `${API_BASE_URL}/api/${endpoint()}/${editingId}`
        : `${API_BASE_URL}/api/${endpoint()}/`;

      const method = editingId ? "PUT" : "POST";

      const data = await apiRequest(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(createPayload()),
      });

      if (editingId) {
        setItems(
          items.map((item) =>
            item.id === editingId ? data : item
          )
        );
      } else {
        setItems([...items, data]);
      }

      setShowForm(false);
      setEditingId(null);
      resetForm();

    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }


  async function deleteResource(id) {
    const confirmed = window.confirm(
      "Delete this resource?"
    );

    if (!confirmed) return;

    try {
      await apiRequest(
        `${API_BASE_URL}/api/${endpoint()}/${id}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      setItems(
        items.filter((item) => item.id !== id)
      );

    } catch (err) {
      alert(err.message);
    }
  }


  return (
    <section className="manager-section">

      <div className="manager-header">

        <div className="manager-title">

          <div className={`manager-icon ${type}`}>
            {icon}
          </div>

          <div>
            <h2>{title}</h2>
            <p>Manage your {title.toLowerCase()} records.</p>
          </div>

        </div>

        <button
          className="small-primary-button"
          onClick={openCreate}
        >
          + Add
        </button>

      </div>


      {showForm && (
        <form
          className="resource-form"
          onSubmit={saveResource}
        >

          <div className="resource-form-header">
            <h3>
              {editingId ? "Update Resource" : "Add Resource"}
            </h3>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="close-form-button"
            >
              <X size={18} />
            </button>
          </div>


          {type === "blood" && (
            <div className="resource-form-grid">

              <div className="form-group">
                <label>Blood Group</label>

                <select
                  name="blood_group"
                  value={form.blood_group || ""}
                  onChange={updateForm}
                  required
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>


              <div className="form-group">
                <label>Available Units</label>

                <input
                  type="number"
                  min="0"
                  name="units_available"
                  value={form.units_available ?? ""}
                  onChange={updateForm}
                  required
                />
              </div>

            </div>
          )}


          {type === "icu" && (
            <div className="resource-form-grid">

              <div className="form-group">
                <label>Total Beds</label>

                <input
                  type="number"
                  min="0"
                  name="total_beds"
                  value={form.total_beds ?? ""}
                  onChange={updateForm}
                  required
                />
              </div>


              <div className="form-group">
                <label>Available Beds</label>

                <input
                  type="number"
                  min="0"
                  name="available_beds"
                  value={form.available_beds ?? ""}
                  onChange={updateForm}
                  required
                />
              </div>

            </div>
          )}


          {type === "organ" && (
            <div className="resource-form-grid">

              <div className="form-group">
                <label>Organ Name</label>

                <input
                  name="organ_name"
                  value={form.organ_name || ""}
                  onChange={updateForm}
                  placeholder="Kidney"
                  required
                />
              </div>


              <label className="checkbox-field">

                <input
                  type="checkbox"
                  name="available"
                  checked={!!form.available}
                  onChange={updateForm}
                />

                <span>Currently Available</span>

              </label>

            </div>
          )}


          {type === "equipment" && (
            <div className="resource-form-grid">

              <div className="form-group">
                <label>Equipment Name</label>

                <input
                  name="equipment_name"
                  value={form.equipment_name || ""}
                  onChange={updateForm}
                  placeholder="Ventilator"
                  required
                />
              </div>


              <div className="form-group">
                <label>Total Quantity</label>

                <input
                  type="number"
                  min="0"
                  name="total_quantity"
                  value={form.total_quantity ?? ""}
                  onChange={updateForm}
                  required
                />
              </div>


              <div className="form-group">
                <label>Available Quantity</label>

                <input
                  type="number"
                  min="0"
                  name="available_quantity"
                  value={form.available_quantity ?? ""}
                  onChange={updateForm}
                  required
                />
              </div>

            </div>
          )}


          <button
            className="primary-button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Resource"
              : "Save Resource"}
          </button>

        </form>
      )}


      {items.length === 0 ? (
        <div className="manager-empty">
          <span>No records added yet.</span>

          <button onClick={openCreate}>
            Add your first record
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <div className="manager-list">

          {items.map((item) => (

            <div className="manager-item" key={item.id}>

              <div className="manager-item-info">

                {type === "blood" && (
                  <>
                    <strong>{item.blood_group}</strong>
                    <span>
                      {item.units_available} units available
                    </span>
                  </>
                )}

                {type === "icu" && (
                  <>
                    <strong>ICU Beds</strong>
                    <span>
                      {item.available_beds} available /{" "}
                      {item.total_beds} total
                    </span>
                  </>
                )}

                {type === "organ" && (
                  <>
                    <strong>{item.organ_name}</strong>
                    <span>
                      {item.available
                        ? "Available"
                        : "Not available"}
                    </span>
                  </>
                )}

                {type === "equipment" && (
                  <>
                    <strong>{item.equipment_name}</strong>
                    <span>
                      {item.available_quantity} available /{" "}
                      {item.total_quantity} total
                    </span>
                  </>
                )}

              </div>


              <div className="manager-actions">

                <button
                  className="edit-button"
                  onClick={() => openEdit(item)}
                >
                  Edit
                </button>

                <button
                  className="item-delete-button"
                  onClick={() => deleteResource(item.id)}
                >
                  <Trash2 size={16} />
                </button>

              </div>

            </div>

          ))}

        </div>
      )}

    </section>
  );
}


// ============================================================
// ABOUT
// ============================================================

function About() {
  const navigate = useNavigate();

  return (
    <main className="about-page">

      <div className="about-hero-layout">
        <div className="about-hero">
          <div className="page-eyebrow"><HeartPulse size={17} /> ABOUT TECH4LIFE</div>
          <h1>Better connected care, <span>for every community.</span></h1>
          <p>Tech4Life brings hospital resource updates into one shared network—so people can discover availability and hospitals can keep information current.</p>
          <div className="about-hero-actions"><button className="primary-button" onClick={() => navigate("/geo-intelligence")}>Explore Geo Intelligence <ArrowRight size={17} /></button><button className="secondary-button" onClick={() => navigate("/register")}>Join the network</button></div>
        </div>
        <div className="about-photo-grid">
          <figure className="about-photo about-photo-main"><img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85" alt="Healthcare professionals coordinating patient care" /><figcaption><span>ONE SHARED NETWORK</span><strong>Better information.<br />More connected care.</strong></figcaption></figure>
          <figure className="about-photo"><img src="https://images.unsplash.com/photo-1584516150909-c43483ee7932?auto=format&fit=crop&w=900&q=85" alt="Doctor speaking with a patient" /><figcaption><span>PEOPLE FIRST</span><strong>Care begins with people</strong></figcaption></figure>
          <figure className="about-photo"><img src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=85" alt="Modern hospital interior" /><figcaption><span>CARE NETWORK</span><strong>Connected hospitals</strong></figcaption></figure>
        </div>
      </div>


      <div className="about-grid">

        <div className="about-card" role="link" tabIndex={0} onClick={() => navigate("/resources")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate("/resources"); } }}>
          <img className="about-card-photo" src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=260&q=80" alt="Blood donation resource" />
          <ShieldCheck />
          <span className="about-card-step">01 · RESOURCE SEARCH</span>
          <h3>Search what you need</h3>
          <p>Browse hospital listings for blood groups, ICU beds, organs and medical equipment.</p>
        </div>

        <div className="about-card" role="link" tabIndex={0} onClick={() => navigate("/geo-intelligence")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate("/geo-intelligence"); } }}>
          <img className="about-card-photo" src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=260&q=80" alt="Hospital building" />
          <MapPin />
          <span className="about-card-step">02 · GEO INTELLIGENCE</span>
          <h3>Find nearby hospitals</h3>
          <p>Search around Shivalik College or enter coordinates to see hospitals ordered by distance.</p>
        </div>

        <div className="about-card" role="link" tabIndex={0} onClick={() => navigate("/resources")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate("/resources"); } }}>
          <img className="about-card-photo" src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=260&q=80" alt="Hospital patient room" />
          <Activity />
          <span className="about-card-step">03 · AVAILABILITY</span>
          <h3>Review reported stock</h3>
          <p>See the availability details hospitals have shared for each listed resource.</p>
        </div>

        <div className="about-card" role="link" tabIndex={0} onClick={() => navigate("/register")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate("/register"); } }}>
          <img className="about-card-photo" src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=260&q=80" alt="Healthcare team" />
          <Building2 />
          <span className="about-card-step">04 · HOSPITAL NETWORK</span>
          <h3>Hospitals share updates</h3>
          <p>Hospital accounts can maintain their resource listings for people to discover.</p>
        </div>

      </div>

      <section className="about-principle"><div><span>OUR PURPOSE</span><h2>Useful information should be easier to reach.</h2><p>Tech4Life helps people explore what hospitals report, while giving healthcare teams a straightforward way to maintain their listings.</p></div><div className="about-principle-mark"><HeartPulse size={31} /><span>Tech4Life</span><small>Healthcare Network</small></div></section>

    </main>
  );
}


// ============================================================
// APP
// ============================================================

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route path="/" element={<Home />} />

        <Route
          path="/resources"
          element={<Resources />}
        />

        <Route path="/geo-intelligence" element={<GeoIntelligence />} />
        <Route path="/emergency" element={<EmergencyDashboard />} />
        <Route path="/emergency/dashboard" element={<EmergencyDashboard />} />
        <Route path="/emergency/report" element={<EmergencyReport />} />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/hospital-admin/login" element={<HospitalAdminPortal mode="login" />} />
        <Route path="/hospital-admin/register" element={<HospitalAdminPortal mode="register" />} />
        <Route path="/hospital-admin/dashboard" element={<HospitalAdminPortal mode="dashboard" />} />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

      </Routes>

      <footer className="footer">
        {/* existing footer code */}
      </footer>

    </BrowserRouter>
  );
}

export default App;


