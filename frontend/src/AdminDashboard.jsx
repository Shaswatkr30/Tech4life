import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminRecoverySettings from "./AdminRecoverySettings.jsx";

import {
  LayoutDashboard,
  Hospital,
  Droplets,
  BedDouble,
  HeartPulse,
  Wrench,
  Activity,
  LogOut,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const API =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  
function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [hospitalAdmins, setHospitalAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedHospital, setSelectedHospital] =
    useState(null);

  const [hospitalResources, setHospitalResources] =
    useState(null);

  const [resourceLoading, setResourceLoading] =
    useState(false);

  const [resourceAction, setResourceAction] =
    useState(null);

  const [editingResource, setEditingResource] =
    useState(null);

  const [resourceForm, setResourceForm] =
    useState({});

  const token = localStorage.getItem(
    "tech4life_admin_token"
  );

  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };

      const [
        statsResponse,
        hospitalsResponse,
        hospitalAdminsResponse,
      ] = await Promise.all([
        fetch(`${API}/api/admin/stats`, {
          headers,
        }),

        fetch(`${API}/api/admin/hospitals`, {
          headers,
        }),
        fetch(`${API}/api/admin/hospital-admins`, { headers }),
      ]);

      if (
        statsResponse.status === 401 ||
        hospitalsResponse.status === 401 ||
        hospitalAdminsResponse.status === 401
      ) {
        localStorage.removeItem(
          "tech4life_admin_token"
        );

        navigate("/admin/login");
        return;
      }

      const statsData =
        await statsResponse.json();

      const hospitalsData =
        await hospitalsResponse.json();
      const hospitalAdminsData = await hospitalAdminsResponse.json();

      console.log(
        "ADMIN HOSPITALS:",
        hospitalsData
      );

      setStats(statsData);

      setHospitals(
        Array.isArray(hospitalsData)
          ? hospitalsData
          : []
      );
      setHospitalAdmins(Array.isArray(hospitalAdminsData) ? hospitalAdminsData : []);
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );

      setError(
        "Unable to connect to Tech4Life server."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateHospitalAdminStatus = async (hospitalAdminId, isActive) => {
    try {
      const response = await fetch(
        `${API}/api/admin/hospital-admins/${hospitalAdminId}/status?is_active=${Boolean(isActive)}`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to update hospital admin approval.");
      await loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================
  // APPROVE / DEACTIVATE HOSPITAL
  // ============================================================

  const updateHospitalStatus = async (
    hospitalId,
    status
  ) => {
    try {
      setError("");

      const isActive = Boolean(status);

      const response = await fetch(
        `${API}/api/admin/hospitals/${hospitalId}/status?is_active=${isActive}`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      console.log(
        "STATUS RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to update hospital status"
        );
      }

      alert(
        isActive
          ? "Hospital approved successfully!"
          : "Hospital deactivated successfully!"
      );

      // Refresh complete dashboard
      await loadDashboard();
    } catch (error) {
      console.error(
        "Approval error:",
        error
      );

      alert(
        error.message ||
          "Unable to update hospital status"
      );
    }
  };

  // ============================================================
  // DELETE HOSPITAL
  // ============================================================

  const deleteHospital = async (
    hospitalId
  ) => {
    const confirmed = window.confirm(
      "Delete this hospital and all its resource records?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/admin/hospitals/${hospitalId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to delete hospital"
        );
      }

      alert(
        "Hospital deleted successfully!"
      );

      await loadDashboard();
    } catch (error) {
      console.error(
        "Delete hospital error:",
        error
      );

      alert(error.message);
    }
  };

  // ============================================================
  // VIEW HOSPITAL RESOURCES
  // ============================================================

  const viewHospitalResources = async (
    hospitalId
  ) => {
    try {
      setResourceLoading(true);
      setHospitalResources(null);

      const response = await fetch(
        `${API}/api/admin/hospitals/${hospitalId}/resources`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load hospital resources"
        );
      }

      setSelectedHospital(data.hospital);

      setHospitalResources({
        ...data,
        blood: data.blood || [],
        icu: data.icu || [],
        organs: data.organs || [],
        equipment: data.equipment || [],
      });
    } catch (error) {
      console.error(
        "Resource loading error:",
        error
      );

      alert(error.message);
    } finally {
      setResourceLoading(false);
    }
  };

  // ============================================================
  // ADD RESOURCE
  // ============================================================

  const openAddResource = (type) => {
    setEditingResource(null);
    setResourceAction(type);

    if (type === "blood") {
      setResourceForm({
        blood_group: "",
        units_available: 0,
      });
    }

    if (type === "icu") {
      setResourceForm({
        total_beds: 0,
        available_beds: 0,
      });
    }

    if (type === "organ") {
      setResourceForm({
        organ_name: "",
        available: false,
      });
    }

    if (type === "equipment") {
      setResourceForm({
        equipment_name: "",
        total_quantity: 0,
        available_quantity: 0,
      });
    }
  };

  // ============================================================
  // EDIT RESOURCE
  // ============================================================

  const openEditResource = (
    type,
    resource
  ) => {
    setEditingResource(resource);
    setResourceAction(type);

    if (type === "blood") {
      setResourceForm({
        blood_group:
          resource.blood_group,
        units_available:
          resource.units_available,
      });
    }

    if (type === "icu") {
      setResourceForm({
        total_beds:
          resource.total_beds,
        available_beds:
          resource.available_beds,
      });
    }

    if (type === "organ") {
      setResourceForm({
        organ_name:
          resource.organ_name,
        available:
          resource.available,
      });
    }

    if (type === "equipment") {
      setResourceForm({
        equipment_name:
          resource.equipment_name,

        total_quantity:
          resource.total_quantity,

        available_quantity:
          resource.available_quantity,
      });
    }
  };

  // ============================================================
  // ADD / UPDATE RESOURCE
  // ============================================================

  const handleResourceSubmit = async (
    e
  ) => {
    e.preventDefault();

    try {
      let url = "";
      let method = "";

      // ---------------- BLOOD ----------------

      if (resourceAction === "blood") {
        url = editingResource
          ? `${API}/api/admin/blood/${editingResource.id}`
          : `${API}/api/admin/hospitals/${selectedHospital.id}/blood`;

        method = editingResource
          ? "PUT"
          : "POST";
      }

      // ---------------- ICU ----------------

      if (resourceAction === "icu") {
        url = editingResource
          ? `${API}/api/admin/icu/${editingResource.id}`
          : `${API}/api/admin/hospitals/${selectedHospital.id}/icu`;

        method = editingResource
          ? "PUT"
          : "POST";
      }

      // ---------------- ORGAN ----------------

      if (resourceAction === "organ") {
        url = editingResource
          ? `${API}/api/admin/organs/${editingResource.id}`
          : `${API}/api/admin/hospitals/${selectedHospital.id}/organs`;

        method = editingResource
          ? "PUT"
          : "POST";
      }

      // ---------------- EQUIPMENT ----------------

      if (
        resourceAction ===
        "equipment"
      ) {
        url = editingResource
          ? `${API}/api/admin/equipment/${editingResource.id}`
          : `${API}/api/admin/hospitals/${selectedHospital.id}/equipment`;

        method = editingResource
          ? "PUT"
          : "POST";
      }

      const params =
        new URLSearchParams();

      Object.entries(resourceForm).forEach(
        ([key, value]) => {
          params.append(key, value);
        }
      );

      const response = await fetch(
        `${url}?${params.toString()}`,
        {
          method,

          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to save resource"
        );
      }

      alert(
        editingResource
          ? "Resource updated successfully!"
          : "Resource added successfully!"
      );

      setResourceAction(null);
      setEditingResource(null);
      setResourceForm({});

      await viewHospitalResources(
        selectedHospital.id
      );
    } catch (error) {
      console.error(
        "Resource save error:",
        error
      );

      alert(error.message);
    }
  };

  // ============================================================
  // DELETE RESOURCE
  // ============================================================

  const deleteResource = async (
    type,
    id
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resource?"
    );

    if (!confirmed) {
      return;
    }

    let url = "";

    if (type === "blood") {
      url = `${API}/api/admin/blood/${id}`;
    }

    if (type === "icu") {
      url = `${API}/api/admin/icu/${id}`;
    }

    if (type === "organ") {
      url = `${API}/api/admin/organs/${id}`;
    }

    if (type === "equipment") {
      url = `${API}/api/admin/equipment/${id}`;
    }

    try {
      const response = await fetch(
        url,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to delete resource"
        );
      }

      alert(
        "Resource deleted successfully!"
      );

      await viewHospitalResources(
        selectedHospital.id
      );
    } catch (error) {
      console.error(
        "Resource delete error:",
        error
      );

      alert(error.message);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    localStorage.removeItem(
      "tech4life_admin_token"
    );

    navigate("/admin/login");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="admin-new-loading">
        <Activity size={28} />

        <span>
          Loading Tech4Life Admin...
        </span>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="admin-new-layout">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="admin-sidebar">

        <div className="admin-sidebar-brand">

          <div className="admin-sidebar-logo">
            <HeartPulse size={24} />
          </div>

          <div>
            <h2>Tech4Life</h2>

            <span>
              ADMIN CONSOLE
            </span>
          </div>

        </div>

        <div className="admin-menu-title">
          MANAGEMENT
        </div>

        <div className="admin-sidebar-menu">

          <button
            className="admin-menu-item active"
          >
            <LayoutDashboard
              size={18}
            />

            Dashboard
          </button>

          <button
            className="admin-menu-item"
            onClick={() =>
              document
                .getElementById(
                  "hospitals-section"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <Hospital size={18} />

            Hospitals
          </button>

          <button
            className="admin-menu-item"
            onClick={() =>
              document
                .getElementById(
                  "resources-section"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <Activity size={18} />

            Resources
          </button>

        </div>

        <div className="admin-sidebar-bottom">

          <div className="admin-system-status">

            <span className="status-dot"></span>

            <div>

              <strong>
                System Online
              </strong>

              <small>
                All services operational
              </small>

            </div>

          </div>

          <button
            className="admin-sidebar-logout"
            onClick={logout}
          >
            <LogOut size={17} />

            Logout
          </button>

        </div>

      </aside>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="admin-main">

        {/* TOP BAR */}

        <header className="admin-topbar">

          <div>

            <div className="admin-breadcrumb">
              Administration / Dashboard
            </div>

            <h1>
              Overview
            </h1>

            <p>
              Monitor hospitals and healthcare
              resources across Tech4Life.
            </p>

          </div>

          <div className="admin-top-actions">

            <button
              className="admin-refresh"
              onClick={loadDashboard}
              title="Refresh"
            >
              <RefreshCw
                size={18}
              />
            </button>

            <div className="admin-profile">

              <div className="admin-profile-icon">
                <ShieldCheck
                  size={19}
                />
              </div>

              <div>

                <strong>
                  Administrator
                </strong>

                <span>
                  System Admin
                </span>

              </div>

            </div>

          </div>

        </header>

        {/* ERROR */}

        {error && (
          <div className="admin-new-error">
            {error}
          </div>
        )}

        <AdminRecoverySettings token={token} />

        {/* ====================================================
            STATS
        ==================================================== */}

        {stats && (

          <section className="admin-overview-grid">

            {/* TOTAL HOSPITALS */}

            <div className="admin-overview-card blue">

              <div className="overview-icon">
                <Hospital size={21} />
              </div>

              <div className="overview-content">

                <span>
                  Total Hospitals
                </span>

                <strong>
                  {stats.total_hospitals ??
                    0}
                </strong>

                <small>
                  Registered facilities
                </small>

              </div>

            </div>

            {/* ACTIVE */}

            <div className="admin-overview-card green">

              <div className="overview-icon">
                <CheckCircle2
                  size={21}
                />
              </div>

              <div className="overview-content">

                <span>
                  Active Hospitals
                </span>

                <strong>
                  {stats.active_hospitals ??
                    0}
                </strong>

                <small>
                  Currently operational
                </small>

              </div>

            </div>

            {/* PENDING */}

            <div className="admin-overview-card orange">

              <div className="overview-icon">
                <Activity size={21} />
              </div>

              <div className="overview-content">

                <span>
                  Pending Hospitals
                </span>

                <strong>
                  {stats.pending_hospitals ??
                    0}
                </strong>

                <small>
                  Waiting for approval
                </small>

              </div>

            </div>

            {/* BLOOD */}

            <div className="admin-overview-card red">

              <div className="overview-icon">
                <Droplets size={21} />
              </div>

              <div className="overview-content">

                <span>
                  Blood Records
                </span>

                <strong>
                  {stats.total_blood_records ??
                    0}
                </strong>

                <small>
                  Inventory records
                </small>

              </div>

            </div>

            {/* ICU */}

            <div className="admin-overview-card purple">

              <div className="overview-icon">
                <BedDouble size={21} />
              </div>

              <div className="overview-content">

                <span>
                  ICU Records
                </span>

                <strong>
                  {stats.total_icu_records ??
                    0}
                </strong>

                <small>
                  ICU resource records
                </small>

              </div>

            </div>

            {/* ORGAN */}

            <div className="admin-overview-card pink">

              <div className="overview-icon">
                <HeartPulse
                  size={21}
                />
              </div>

              <div className="overview-content">

                <span>
                  Organ Records
                </span>

                <strong>
                  {stats.total_organ_records ??
                    0}
                </strong>

                <small>
                  Organ inventory
                </small>

              </div>

            </div>

            {/* EQUIPMENT */}

            <div className="admin-overview-card orange">

              <div className="overview-icon">
                <Wrench size={21} />
              </div>

              <div className="overview-content">

                <span>
                  Equipment
                </span>

                <strong>
                  {stats.total_equipment_records ??
                    0}
                </strong>

                <small>
                  Medical equipment
                </small>

              </div>

            </div>

          </section>
        )}

        {/* ====================================================
            RESOURCE SUMMARY
        ==================================================== */}

        <section
          id="resources-section"
          className="admin-summary-panel"
        >

          <div className="admin-panel-heading">

            <div>

              <span className="panel-label">
                RESOURCE NETWORK
              </span>

              <h2>
                Healthcare Resource Overview
              </h2>

            </div>

            <div className="live-indicator">

              <span></span>

              Live Database

            </div>

          </div>

          <div className="resource-summary-grid">

            <div>
              <Droplets size={18} />

              <span>
                Blood
              </span>

              <strong>
                {stats?.total_blood_records ??
                  0}
              </strong>
            </div>

            <div>
              <BedDouble size={18} />

              <span>
                ICU
              </span>

              <strong>
                {stats?.total_icu_records ??
                  0}
              </strong>
            </div>

            <div>
              <HeartPulse size={18} />

              <span>
                Organs
              </span>

              <strong>
                {stats?.total_organ_records ??
                  0}
              </strong>
            </div>

            <div>
              <Wrench size={18} />

              <span>
                Equipment
              </span>

              <strong>
                {stats?.total_equipment_records ??
                  0}
              </strong>
            </div>

          </div>

        </section>

        <section className="hospital-admin-approvals">
          <div className="admin-panel-heading">
            <div><span className="panel-label">ADMIN ACCESS REVIEW</span><h2>Hospital Admin Applications</h2><p>Approve each hospital’s designated administrator before they can verify and publish hospital information.</p></div>
            <span className="hospital-admin-pending-count">{hospitalAdmins.filter((item) => !item.is_active).length} pending</span>
          </div>
          {hospitalAdmins.length === 0 ? <div className="hospital-admin-empty">No hospital admin applications yet.</div> : <div className="hospital-admin-app-list">{hospitalAdmins.map((item) => <article className="hospital-admin-app-row" key={item.id}><div className="hospital-admin-app-icon"><ShieldCheck size={19} /></div><div className="hospital-admin-app-info"><strong>{item.name}</strong><span>{item.email}</span><small>{item.hospital_name} · {item.hospital_is_active ? "Hospital approved" : "Hospital approval required first"}</small></div><span className={`hospital-admin-app-status ${item.is_active ? "approved" : "pending"}`}>{item.is_active ? "Approved" : "Awaiting review"}</span><button disabled={!item.is_active && !item.hospital_is_active} className={`hospital-admin-app-action ${item.is_active ? "revoke" : "approve"}`} onClick={() => updateHospitalAdminStatus(item.id, !item.is_active)}>{item.is_active ? "Revoke access" : item.hospital_is_active ? "Approve admin" : "Approve hospital first"}</button></article>)}</div>}
        </section>

        {/* ====================================================
            HOSPITAL MANAGEMENT
        ==================================================== */}

        <section
          id="hospitals-section"
          className="admin-hospitals-panel"
        >

          <div className="admin-panel-heading">

            <div>

              <span className="panel-label">
                HOSPITAL MANAGEMENT
              </span>

              <h2>
                Registered Hospitals
              </h2>

              <p>
                Manage hospitals connected to
                the Tech4Life network.
              </p>

            </div>

            <div className="hospital-total">
              {hospitals.length} Hospitals
            </div>

          </div>

          {hospitals.length === 0 ? (

            <div className="admin-no-hospitals">

              <Hospital size={35} />

              <h3>
                No Hospitals Registered
              </h3>

              <p>
                Registered hospitals will
                appear here.
              </p>

            </div>

          ) : (

            <div className="admin-table-wrapper">

              <table className="admin-hospital-table">

                <thead>

                  <tr>
                    <th>
                      Hospital
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {hospitals.map(
                    (hospital) => (

                      <tr
                        key={
                          hospital.id
                        }
                      >

                        {/* HOSPITAL */}

                        <td>

                          <div className="hospital-table-name">

                            <div className="hospital-table-icon">

                              <Hospital
                                size={18}
                              />

                            </div>

                            <div>

                              <strong>
                                {
                                  hospital.name
                                }
                              </strong>

                              <span>
                                ID #
                                {
                                  hospital.id
                                }
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* LOCATION */}

                        <td>

                          <div className="table-location">

                            <strong>
                              {
                                hospital.city
                              }
                            </strong>

                            <span>
                              {
                                hospital.state
                              }
                            </span>

                          </div>

                        </td>

                        {/* CONTACT */}

                        <td>

                          <div className="table-contact">

                            <span>
                              {
                                hospital.email
                              }
                            </span>

                            {hospital.phone && (
                              <small>
                                {
                                  hospital.phone
                                }
                              </small>
                            )}

                          </div>

                        </td>

                        {/* STATUS */}

                        <td>

                          {hospital.is_active ? (

                            <span className="hospital-status active">

                              <CheckCircle2
                                size={13}
                              />

                              Approved

                            </span>

                          ) : (

                            <span className="hospital-status inactive">

                              <XCircle
                                size={13}
                              />

                              Pending Approval

                            </span>

                          )}

                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="hospital-table-actions">

                            <button
                              className="table-view-button"
                              onClick={() =>
                                viewHospitalResources(
                                  hospital.id
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              className="table-status-button"
                              onClick={() =>
                                updateHospitalStatus(
                                  hospital.id,
                                  !hospital.is_active
                                )
                              }
                            >
                              {hospital.is_active
                                ? "Deactivate"
                                : "Approve"}
                            </button>

                            <button
                              className="table-delete-button"
                              onClick={() =>
                                deleteHospital(
                                  hospital.id
                                )
                              }
                              title="Delete hospital"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="admin-footer">

          <span>
            © 2026 Tech4Life
          </span>

          <span>
            Healthcare Resource Management
          </span>

          <span className="footer-online">

            <span></span>

            System Operational

          </span>

        </footer>

        {/* ====================================================
            HOSPITAL DETAILS MODAL
        ==================================================== */}

        {selectedHospital && (

          <div className="hospital-details-overlay">

            <div className="hospital-details-modal">

              {/* HEADER */}

              <div className="hospital-details-header">

                <div>

                  <span className="panel-label">
                    HOSPITAL DETAILS
                  </span>

                  <h2>
                    {
                      selectedHospital.name
                    }
                  </h2>

                  <p>
                    {
                      selectedHospital.city
                    }
                    ,{" "}
                    {
                      selectedHospital.state
                    }
                  </p>

                </div>

                <button
                  className="hospital-details-close"
                  onClick={() => {

                    setSelectedHospital(
                      null
                    );

                    setHospitalResources(
                      null
                    );

                    setResourceAction(
                      null
                    );

                    setEditingResource(
                      null
                    );

                  }}
                >
                  ×
                </button>

              </div>

              {resourceLoading ? (

                <div className="hospital-resource-loading">

                  <Activity
                    size={28}
                  />

                  <span>
                    Loading hospital resources...
                  </span>

                </div>

              ) : hospitalResources ? (

                <div className="hospital-resource-content">

                  {/* ==================================================
                      BLOOD
                  ================================================== */}

                  <div className="resource-detail-card blood-card">

                    <div className="resource-card-header">

                      <div className="resource-detail-title">

                        <Droplets
                          size={21}
                        />

                        <div>

                          <h3>
                            Blood Inventory
                          </h3>

                          <span>
                            Blood availability
                          </span>

                        </div>

                      </div>

                      <button
                        className="resource-add-button"
                        onClick={() =>
                          openAddResource(
                            "blood"
                          )
                        }
                      >
                        + Add
                      </button>

                    </div>

                    <div className="resource-detail-list">

                      {hospitalResources
                        .blood
                        .length ===
                      0 ? (

                        <p className="no-resource">
                          No blood records
                          available
                        </p>

                      ) : (

                        hospitalResources
                          .blood
                          .map(
                            (blood) => (

                              <div
                                className="resource-row"
                                key={
                                  blood.id
                                }
                              >

                                <div>

                                  <strong>
                                    {
                                      blood.blood_group
                                    }
                                  </strong>

                                  <small>
                                    {
                                      blood.units_available
                                    }{" "}
                                    units
                                  </small>

                                </div>

                                <div className="resource-actions">

                                  <button
                                    className="resource-edit-button"
                                    onClick={() =>
                                      openEditResource(
                                        "blood",
                                        blood
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    className="resource-delete-button"
                                    onClick={() =>
                                      deleteResource(
                                        "blood",
                                        blood.id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>

                                </div>

                              </div>

                            )
                          )

                      )}

                    </div>

                  </div>

                  {/* ==================================================
                      ICU
                  ================================================== */}

                  <div className="resource-detail-card icu-card">

                    <div className="resource-card-header">

                      <div className="resource-detail-title">

                        <BedDouble
                          size={21}
                        />

                        <div>

                          <h3>
                            ICU Beds
                          </h3>

                          <span>
                            ICU availability
                          </span>

                        </div>

                      </div>

                      <button
                        className="resource-add-button"
                        onClick={() =>
                          openAddResource(
                            "icu"
                          )
                        }
                      >
                        + Add
                      </button>

                    </div>

                    <div className="resource-detail-list">

                      {hospitalResources
                        .icu
                        .length ===
                      0 ? (

                        <p className="no-resource">
                          No ICU records
                          available
                        </p>

                      ) : (

                        hospitalResources
                          .icu
                          .map(
                            (icu) => (

                              <div
                                className="resource-row"
                                key={
                                  icu.id
                                }
                              >

                                <div>

                                  <strong>
                                    ICU
                                  </strong>

                                  <small>
                                    {
                                      icu.available_beds
                                    }{" "}
                                    /{" "}
                                    {
                                      icu.total_beds
                                    }{" "}
                                    available
                                  </small>

                                </div>

                                <div className="resource-actions">

                                  <button
                                    className="resource-edit-button"
                                    onClick={() =>
                                      openEditResource(
                                        "icu",
                                        icu
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    className="resource-delete-button"
                                    onClick={() =>
                                      deleteResource(
                                        "icu",
                                        icu.id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>

                                </div>

                              </div>

                            )
                          )

                      )}

                    </div>

                  </div>

                  {/* ==================================================
                      ORGANS
                  ================================================== */}

                  <div className="resource-detail-card organ-card">

                    <div className="resource-card-header">

                      <div className="resource-detail-title">

                        <HeartPulse
                          size={21}
                        />

                        <div>

                          <h3>
                            Organs
                          </h3>

                          <span>
                            Organ availability
                          </span>

                        </div>

                      </div>

                      <button
                        className="resource-add-button"
                        onClick={() =>
                          openAddResource(
                            "organ"
                          )
                        }
                      >
                        + Add
                      </button>

                    </div>

                    <div className="resource-detail-list">

                      {hospitalResources
                        .organs
                        .length ===
                      0 ? (

                        <p className="no-resource">
                          No organ records
                          available
                        </p>

                      ) : (

                        hospitalResources
                          .organs
                          .map(
                            (organ) => (

                              <div
                                className="resource-row"
                                key={
                                  organ.id
                                }
                              >

                                <div>

                                  <strong>
                                    {
                                      organ.organ_name
                                    }
                                  </strong>

                                  <small
                                    className={
                                      organ.available
                                        ? "resource-available"
                                        : "resource-unavailable"
                                    }
                                  >
                                    {organ.available
                                      ? "Available"
                                      : "Not Available"}
                                  </small>

                                </div>

                                <div className="resource-actions">

                                  <button
                                    className="resource-edit-button"
                                    onClick={() =>
                                      openEditResource(
                                        "organ",
                                        organ
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    className="resource-delete-button"
                                    onClick={() =>
                                      deleteResource(
                                        "organ",
                                        organ.id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>

                                </div>

                              </div>

                            )
                          )

                      )}

                    </div>

                  </div>

                  {/* ==================================================
                      EQUIPMENT
                  ================================================== */}

                  <div className="resource-detail-card equipment-card">

                    <div className="resource-card-header">

                      <div className="resource-detail-title">

                        <Wrench
                          size={21}
                        />

                        <div>

                          <h3>
                            Equipment
                          </h3>

                          <span>
                            Medical equipment
                          </span>

                        </div>

                      </div>

                      <button
                        className="resource-add-button"
                        onClick={() =>
                          openAddResource(
                            "equipment"
                          )
                        }
                      >
                        + Add
                      </button>

                    </div>

                    <div className="resource-detail-list">

                      {hospitalResources
                        .equipment
                        .length ===
                      0 ? (

                        <p className="no-resource">
                          No equipment records
                          available
                        </p>

                      ) : (

                        hospitalResources
                          .equipment
                          .map(
                            (equipment) => (

                              <div
                                className="resource-row"
                                key={
                                  equipment.id
                                }
                              >

                                <div>

                                  <strong>
                                    {
                                      equipment.equipment_name
                                    }
                                  </strong>

                                  <small>
                                    {
                                      equipment.available_quantity
                                    }{" "}
                                    /{" "}
                                    {
                                      equipment.total_quantity
                                    }{" "}
                                    available
                                  </small>

                                </div>

                                <div className="resource-actions">

                                  <button
                                    className="resource-edit-button"
                                    onClick={() =>
                                      openEditResource(
                                        "equipment",
                                        equipment
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    className="resource-delete-button"
                                    onClick={() =>
                                      deleteResource(
                                        "equipment",
                                        equipment.id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>

                                </div>

                              </div>

                            )
                          )

                      )}

                    </div>

                  </div>

                </div>

              ) : null}

              {/* ====================================================
                  ADD / EDIT RESOURCE FORM
              ==================================================== */}

              {resourceAction && (

                <div className="resource-form-overlay">

                  <div className="resource-form-card">

                    <div className="resource-form-header">

                      <div>

                        <span>
                          {editingResource
                            ? "UPDATE RESOURCE"
                            : "ADD RESOURCE"}
                        </span>

                        <h3>

                          {resourceAction ===
                            "blood" &&
                            "Blood Inventory"}

                          {resourceAction ===
                            "icu" &&
                            "ICU Beds"}

                          {resourceAction ===
                            "organ" &&
                            "Organ Resource"}

                          {resourceAction ===
                            "equipment" &&
                            "Medical Equipment"}

                        </h3>

                      </div>

                      <button
                        type="button"
                        onClick={() => {

                          setResourceAction(
                            null
                          );

                          setEditingResource(
                            null
                          );

                        }}
                      >
                        ×
                      </button>

                    </div>

                    <form
                      onSubmit={
                        handleResourceSubmit
                      }
                      className="resource-form"
                    >

                      {/* BLOOD */}

                      {resourceAction ===
                        "blood" && (
                        <>
                          <label>
                            Blood Group
                          </label>

                          <select
                            value={
                              resourceForm.blood_group ||
                              ""
                            }
                            onChange={(e) =>
                              setResourceForm({
                                ...resourceForm,

                                blood_group:
                                  e.target.value,
                              })
                            }
                            required
                          >
                            <option value="">
                              Select Blood Group
                            </option>

                            <option value="A+">
                              A+
                            </option>

                            <option value="A-">
                              A-
                            </option>

                            <option value="B+">
                              B+
                            </option>

                            <option value="B-">
                              B-
                            </option>

                            <option value="AB+">
                              AB+
                            </option>

                            <option value="AB-">
                              AB-
                            </option>

                            <option value="O+">
                              O+
                            </option>

                            <option value="O-">
                              O-
                            </option>
                          </select>

                          <label>
                            Units Available
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={
                              resourceForm.units_available ??
                              0
                            }
                            onChange={(e) =>
                              setResourceForm({
                                ...resourceForm,

                                units_available:
                                  Number(
                                    e.target.value
                                  ),
                              })
                            }
                            required
                          />
                        </>
                      )}

                      {/* ICU */}

                      {resourceAction ===
                        "icu" && (
                        <>
                          <label>
                            Total ICU Beds
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={
                              resourceForm.total_beds ??
                              0
                            }
                            onChange={(e) =>
                              setResourceForm({
                                ...resourceForm,

                                total_beds:
                                  Number(
                                    e.target.value
                                  ),
                              })
                            }
                            required
                          />

                          <label>
                            Available ICU Beds
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={
                              resourceForm.available_beds ??
                              0
                            }
                            onChange={(e) =>
                              setResourceForm({
                                ...resourceForm,

                                available_beds:
                                  Number(
                                    e.target.value
                                  ),
                              })
                            }
                            required
                          />
                        </>
                      )}

                      {/* ORGAN */}

                      {resourceAction ===
                        "organ" && (
                        <>
                          <label>
                            Organ Name
                          </label>

                          <input
                            type="text"
                            placeholder="e.g. Kidney"
                            value={
                              resourceForm.organ_name ||
                              ""
                            }
                            onChange={(e) =>
                              setResourceForm({
                                ...resourceForm,

                                organ_name:
                                  e.target.value,
                              })
                            }
                            required
                          />

                          <label>
                            Availability
                          </label>

                          <select
                            value={
                              resourceForm.available
                                ? "true"
                                : "false"
                            }
                            onChange={(e) =>
                              setResourceForm({
                                ...resourceForm,

                                available:
                                  e.target.value ===
                                  "true",
                              })
                            }
                          >
                            <option value="true">
                              Available
                            </option>

                            <option value="false">
                              Not Available
                            </option>
                          </select>
                        </>
                      )}

                      {/* EQUIPMENT */}

                      {resourceAction ===
                        "equipment" && (
                        <>
                          <label>
                            Equipment Name
                          </label>

                          <input
                            type="text"
                            placeholder="e.g. Ventilator"
                            value={
                              resourceForm.equipment_name ||
                              ""
                            }
                            onChange={(e) =>
                              setResourceForm({
                                ...resourceForm,

                                equipment_name:
                                  e.target.value,
                              })
                            }
                            required
                          />

                          <label>
                            Total Quantity
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={
                              resourceForm.total_quantity ??
                              0
                            }
                            onChange={(e) =>
                              setResourceForm({
                                ...resourceForm,

                                total_quantity:
                                  Number(
                                    e.target.value
                                  ),
                              })
                            }
                            required
                          />

                          <label>
                            Available Quantity
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={
                              resourceForm.available_quantity ??
                              0
                            }
                            onChange={(e) =>
                              setResourceForm({
                                ...resourceForm,

                                available_quantity:
                                  Number(
                                    e.target.value
                                  ),
                              })
                            }
                            required
                          />
                        </>
                      )}

                      {/* FORM BUTTONS */}

                      <div className="resource-form-actions">

                        <button
                          type="button"
                          className="resource-cancel-button"
                          onClick={() => {

                            setResourceAction(
                              null
                            );

                            setEditingResource(
                              null
                            );

                          }}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="resource-save-button"
                        >
                          {editingResource
                            ? "Update Resource"
                            : "Add Resource"}
                        </button>

                      </div>

                    </form>

                  </div>

                </div>

              )}

            </div>

          </div>

        )}

      </main>

    </div>
  );
}

export default AdminDashboard;
