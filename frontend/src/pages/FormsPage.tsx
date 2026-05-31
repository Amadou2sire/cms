import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useProject } from '../contexts/ProjectContext';
import { Plus, X, Edit3, Trash, Eye, ArrowLeft } from 'lucide-react';

interface FormField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface FormDefinition {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  notification_email?: string;
  webhook_url?: string;
  project_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface FormSubmissionData {
  id: string;
  form_id: string;
  data: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export const FormsPage: React.FC = () => {
  const { currentProject } = useProject();
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState<FormDefinition | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    fields: [] as FormField[],
    notification_email: '',
    webhook_url: '',
  });
  const [selectedForm, setSelectedForm] = useState<FormDefinition | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmissionData[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [viewSubmission, setViewSubmission] = useState<FormSubmissionData | null>(null);

  const fetchForms = async () => {
    if (!currentProject) return;
    try {
      const res = await client.get('/forms');
      setForms(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [currentProject]);

  const fetchSubmissions = async (formId: string) => {
    setSubmissionsLoading(true);
    try {
      const res = await client.get(`/forms/${formId}/submissions`);
      setSubmissions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedForm) {
      fetchSubmissions(selectedForm.id);
    }
  }, [selectedForm]);

  const openCreate = () => {
    setEditForm(null);
    setForm({ name: '', description: '', fields: [], notification_email: '', webhook_url: '' });
    setShowModal(true);
  };

  const openEdit = (f: FormDefinition) => {
    setEditForm(f);
    setForm({
      name: f.name,
      description: f.description || '',
      fields: f.fields || [],
      notification_email: f.notification_email || '',
      webhook_url: f.webhook_url || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || form.fields.length === 0) return;
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        fields: form.fields,
        notification_email: form.notification_email || undefined,
        webhook_url: form.webhook_url || undefined,
      };
      if (editForm) {
        await client.put(`/forms/${editForm.id}`, payload);
      } else {
        await client.post('/forms', payload);
      }
      await fetchForms();
      setShowModal(false);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la sauvegarde du formulaire');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce formulaire et toutes ses soumissions ?')) return;
    try {
      await client.delete(`/forms/${id}`);
      if (selectedForm?.id === id) {
        setSelectedForm(null);
        setSubmissions([]);
      }
      await fetchForms();
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la suppression');
    }
  };

  const addField = () => {
    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, { name: '', type: 'text', label: '', required: false, placeholder: '', options: [] }],
    }));
  };

  const updateField = (idx: number, updates: Partial<FormField>) => {
    setForm(prev => {
      const fields = [...prev.fields];
      fields[idx] = { ...fields[idx], ...updates };
      return { ...prev, fields };
    });
  };

  const removeField = (idx: number) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx),
    }));
  };

  if (!currentProject) {
    return <p className="text-neutral-500">Sélectionnez un projet pour gérer les formulaires.</p>;
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black uppercase">Formulaires</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full font-bold text-xs uppercase"
        >
          <Plus size={14} /> Nouveau Formulaire
        </button>
      </header>

      {selectedForm ? (
        <>
          <button
            onClick={() => { setSelectedForm(null); setSubmissions([]); }}
            className="flex items-center gap-2 text-neutral-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> Retour aux formulaires
          </button>

          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black uppercase">{selectedForm.name}</h2>
                {selectedForm.description && (
                  <p className="text-sm text-neutral-500 mt-1">{selectedForm.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(selectedForm)} className="text-blue-500 hover:text-blue-400 p-2">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(selectedForm.id)} className="text-red-500 hover:text-red-400 p-2">
                  <Trash size={16} />
                </button>
              </div>
            </div>
            <p className="text-xs text-neutral-600 mt-2">
              {selectedForm.fields.length} champ{selectedForm.fields.length !== 1 ? 's' : ''} • {submissions.length} soumission{submissions.length !== 1 ? 's' : ''}
              {selectedForm.notification_email && ` • Notification: ${selectedForm.notification_email}`}
            </p>
          </div>

          {submissionsLoading ? (
            <p className="text-neutral-500 text-sm">Chargement des soumissions…</p>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-neutral-800 rounded-xl text-neutral-500 text-sm">
              Aucune soumission pour ce formulaire
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map(s => (
                <div
                  key={s.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex justify-between items-start"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {Object.entries(s.data).slice(0, 3).map(([key, val]) => (
                        <span key={key} className="bg-neutral-800 px-2 py-1 rounded text-xs text-neutral-300">
                          {key}: <strong>{String(val).substring(0, 30)}</strong>
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-neutral-600">
                      {new Date(s.created_at).toLocaleString('fr-FR')}
                      {s.ip_address && ` • ${s.ip_address}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewSubmission(s)}
                    className="text-blue-500 hover:text-blue-400 ml-4 p-1"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {loading ? (
            <p className="text-neutral-500">Chargement…</p>
          ) : forms.length === 0 ? (
            <p className="text-neutral-500">Aucun formulaire. Créez-en un pour commencer.</p>
          ) : (
            <ul className="space-y-4">
              {forms.map(f => (
                <li key={f.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex justify-between items-center">
                  <button
                    onClick={() => setSelectedForm(f)}
                    className="flex-1 text-left"
                  >
                    <h3 className="font-semibold">{f.name}</h3>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {f.fields.length} champ{f.fields.length !== 1 ? 's' : ''}
                      {f.description && ` — ${f.description}`}
                    </p>
                  </button>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => openEdit(f)} className="text-blue-500 hover:text-blue-400 p-2">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-400 p-2">
                      <Trash size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Form Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase">{editForm ? 'Modifier le formulaire' : 'Nouveau Formulaire'}</h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Nom du formulaire"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Description (optionnel)"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white"
              />
              <input
                type="email"
                placeholder="Email de notification (optionnel)"
                value={form.notification_email}
                onChange={e => setForm({ ...form, notification_email: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white"
              />
              <input
                type="url"
                placeholder="Webhook URL (optionnel)"
                value={form.webhook_url}
                onChange={e => setForm({ ...form, webhook_url: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white"
              />
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Champs du formulaire</h4>
                <button onClick={addField} className="text-blue-500 hover:text-blue-400 text-xs font-bold uppercase flex items-center gap-1">
                  <Plus size={12} /> Ajouter un champ
                </button>
              </div>
              {form.fields.length === 0 && (
                <p className="text-neutral-600 text-xs">Ajoutez au moins un champ au formulaire.</p>
              )}
              {form.fields.map((field, idx) => (
                <div key={idx} className="bg-black border border-neutral-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Champ #{idx + 1}</span>
                    <button onClick={() => removeField(idx)} className="text-red-500 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nom technique (ex: email)"
                      value={field.name}
                      onChange={e => updateField(idx, { name: e.target.value })}
                      className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white"
                    />
                    <select
                      value={field.type}
                      onChange={e => updateField(idx, { type: e.target.value })}
                      className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white"
                    >
                      <option value="text">Texte</option>
                      <option value="email">Email</option>
                      <option value="tel">Téléphone</option>
                      <option value="number">Nombre</option>
                      <option value="textarea">Zone de texte</option>
                      <option value="select">Liste déroulante</option>
                      <option value="checkbox">Case à cocher</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Label affiché"
                    value={field.label}
                    onChange={e => updateField(idx, { label: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white"
                  />
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Placeholder"
                      value={field.placeholder || ''}
                      onChange={e => updateField(idx, { placeholder: e.target.value })}
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white"
                    />
                    <label className="flex items-center gap-2 text-xs text-neutral-400">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={e => updateField(idx, { required: e.target.checked })}
                        className="rounded border-neutral-800"
                      />
                      Requis
                    </label>
                  </div>
                  {field.type === 'select' && (
                    <input
                      type="text"
                      placeholder="Options (séparées par des virgules)"
                      value={(field.options || []).join(', ')}
                      onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-black uppercase text-neutral-500 hover:text-white">
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name || form.fields.length === 0}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 text-white px-4 py-2 rounded-full text-xs font-black uppercase"
              >
                {editForm ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Submission Modal */}
      {viewSubmission && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black uppercase text-sm">Détails de la soumission</h3>
              <button onClick={() => setViewSubmission(null)} className="text-neutral-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {Object.entries(viewSubmission.data).map(([key, val]) => (
                <div key={key} className="bg-black border border-neutral-800 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">{key}</p>
                  <p className="text-sm text-white">{String(val)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-800">
              <p className="text-[10px] text-neutral-600">
                Reçu le {new Date(viewSubmission.created_at).toLocaleString('fr-FR')}
                {viewSubmission.ip_address && ` depuis ${viewSubmission.ip_address}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};