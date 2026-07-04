import { useEffect, useRef, useState } from "react";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterPos, setFilterPos] = useState("");
  const [customPos, setCustomPos] = useState("");

  // image upload
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const load = () =>
    getAdminCandidates()
      .then((r) => setCandidates(r.data.data))
      .catch(() => toast.error("Failed to load candidates"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const positions = [...new Set(candidates.map((c) => c.position))].sort();

  const filtered = filterPos
    ? candidates.filter((c) => c.position === filterPos)
    : candidates;

  const grouped = filtered.reduce((acc, c) => {
    if (!acc[c.position]) acc[c.position] = [];
    acc[c.position].push(c);
    return acc;
  }, {});

  const openCreate = () => {
    setEdit(null);
    setForm(EMPTY);
    setPhotoFile(null);
    setPhotoPreview(null);
    setCustomPos("");
    setModal(true);
  };

  const openEdit = (c) => {
    setEdit(c);
    setForm({
      fullname: c.fullname,
      position: c.position,
      department: c.department || "",
      manifesto: c.manifesto || "",
    });

    setPhotoFile(null);
    setPhotoPreview(c.photo || null);
    setCustomPos("");
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEdit(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // image change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please drop an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // save
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const finalPosition =
      form.position === "custom" ? customPos : form.position;

    if (!finalPosition) {
      toast.error("Please select a position");
      setSaving(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("fullname", form.fullname);
      fd.append("position", finalPosition);
      fd.append("department", form.department || "");
      fd.append("manifesto", form.manifesto || "");

      if (photoFile) fd.append("photo", photoFile);

      if (edit) {
        await API.put(`/admin/candidates/${edit.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Candidate updated");
      } else {
        await API.post("/admin/candidates", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Candidate added");
      }

      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete ${c.fullname}?`)) return;

    try {
      await deleteCandidate(c.id);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cannot delete");
    }
  };

  return (
    <div style={s.root}>
      {/* HEADER */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Candidates</h1>
          <p style={s.pageSub}>
            {candidates.length} candidates · {positions.length} positions
          </p>
        </div>

        <button onClick={openCreate} style={s.btnGreen}>
          + Add Candidate
        </button>
      </div>

      {/* FILTER */}
      <div style={s.filterRow}>
        <button
          onClick={() => setFilterPos("")}
          style={{
            ...s.filterBtn,
            ...(filterPos === "" ? s.filterBtnActive : {}),
          }}
        >
          All
        </button>

        {positions.map((p) => (
          <button
            key={p}
            onClick={() => setFilterPos(p)}
            style={{
              ...s.filterBtn,
              ...(filterPos === p ? s.filterBtnActive : {}),
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div style={s.loadingRow}>
          <div style={spinEl} />
        </div>
      ) : candidates.length === 0 ? (
        <div style={s.emptyState}>
          <p>No candidates yet</p>
          <button onClick={openCreate} style={s.btnGreen}>
            Add First Candidate
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([position, list]) => (
          <div key={position} style={s.posGroup}>
            <h3 style={s.posLabel}>
              {position} ({list.length})
            </h3>

            <div style={s.cardGrid}>
              {list.map((c, i) => (
                <div key={c.id} style={s.card}>
                  <div style={s.cardPhoto}>
                    {c.photo ? (
                      <img
                        src={c.photo}
                        alt={c.fullname}
                        style={s.cardPhotoImg}
                      />
                    ) : (
                      <div style={s.cardInitial}>{c.fullname[0]}</div>
                    )}

                    <div style={s.voteBadge}>{c.votes} votes</div>
                  </div>

                  <div style={s.cardBody}>
                    <div style={s.cardName}>{c.fullname}</div>
                    <div style={s.cardDept}>{c.department}</div>
                    <div style={s.cardManifesto}>{c.manifesto}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* MODAL */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.overlayBg} onClick={closeModal} />

          <div style={s.modal}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>
                {edit ? "Edit Candidate" : "Add Candidate"}
              </h2>
              <button onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSave} style={s.modalBody}>
              <input
                placeholder="Full Name"
                required
                value={form.fullname}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fullname: e.target.value }))
                }
                style={s.input}
              />

              <select
                required
                value={form.position}
                onChange={(e) =>
                  setForm((p) => ({ ...p, position: e.target.value }))
                }
                style={s.select}
              >
                <option value="">Select Position</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>

              {form.position === "custom" && (
                <input
                  placeholder="Custom position"
                  value={customPos}
                  onChange={(e) => setCustomPos(e.target.value)}
                  style={s.input}
                />
              )}

              <input
                placeholder="Department"
                value={form.department}
                onChange={(e) =>
                  setForm((p) => ({ ...p, department: e.target.value }))
                }
                style={s.input}
              />

              <textarea
                placeholder="Manifesto"
                value={form.manifesto}
                onChange={(e) =>
                  setForm((p) => ({ ...p, manifesto: e.target.value }))
                }
                style={s.input}
              />

              <button disabled={saving} style={s.btnGreen}>
                {saving ? "Saving..." : edit ? "Update" : "Add"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}