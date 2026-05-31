import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useProject } from '../contexts/ProjectContext';
import { Plus, Trash2, Link as LinkIcon, Activity, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
}

interface Delivery {
  id: string;
  event_type: string;
  status_code: number | null;
  success: boolean | null;
  attempt: number;
  created_at: string;
}

const AVAILABLE_EVENTS = [
  { event: 'page.created', label: 'Page créée' },
  { event: 'page.updated', label: 'Page mise à jour' },
  { event: 'page.published', label: 'Page publiée' },
  { event: 'page.deleted', label: 'Page supprimée' },
  { event: 'article.created', label: 'Article créé' },
  { event: 'article.published', label: 'Article publié' },
  { event: 'form.submitted', label: 'Formulaire soumis' },
  { event: 'member.invited', label: 'Membre invité' },
  { event: 'member.joined', label: 'Membre a rejoint' },
];

export const WebhooksPage: React.FC = () => {
  const { currentProject } = useProject();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeliveries, setShowDeliveries] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    url: '',
    events: [] as string[],
    active: true
  });

  const fetchWebhooks = async () => {
    if (!currentProject) return;
    try {
      const res = await client.get('/webhooks');
      setWebhooks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [currentProject]);

  const fetchDeliveries = async (webhookId: string) => {
    setDeliveriesLoading(true);
    try {
      const res = await client.get(`/webhooks/${webhookId}/deliveries`);
      setDeliveries(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!currentProject || !form.name || !form.url) return;
    try {
      await client.post('/webhooks', form);
      setShowCreateModal(false);
      setForm({ name: '', url: '', events: [], active: true });
      fetchWebhooks();
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la création du webhook');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce webhook ?')) return;
    try {
      await client.delete(`/webhooks/${id}`);
      fetchWebhooks();
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la suppression');
    }
  };

  const handleToggleEvent = (event: string) => {
    setForm({
      ...form,
      events: form.events.includes(event)
        ? form.events.filter(e => e !== event)
        : [...form.events, event]
    });
  };

  if (!currentProject) {
    return <p className="text-neutral-500">Sélectionnez un projet.</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase">Webhooks</h1>
          <p className="text-sm text-neutral-500 mt-1">Recevez des notifications en temps réel pour les événements de votre projet</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full font-bold text-xs uppercase"
        >
          <Plus size={14} /> Créer
        </button>
      </header>

      {/* Available Events Box */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 mb-8">
        <h2 className="text-sm font-bold uppercase text-neutral-400 mb-4">Événements disponibles</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AVAILABLE_EVENTS.map(({ event, label }) => (
            <div key={event} className="bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2">
              <p className="text-xs font-mono text-blue-400">{event}</p>
              <p className="text-[10px] text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-neutral-500 text-center py-12">Chargement…</p>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-neutral-800 rounded-2xl">
            <Activity className="mx-auto text-neutral-600 mb-4" size={48} />
            <p className="text-neutral-500 text-sm">Aucun webhook configuré</p>
          </div>
        ) : (
          webhooks.map((wh) => (
            <div key={wh.id} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{wh.name}</h3>
                    {wh.active ? (
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-[10px] font-bold uppercase">Actif</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-neutral-700 text-neutral-400 border border-neutral-600 rounded text-[10px] font-bold uppercase">Inactif</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
                    <LinkIcon size={14} />
                    <span className="font-mono text-xs">{wh.url}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wh.events.map((event) => {
                      const evt = AVAILABLE_EVENTS.find(e => e.event === event);
                      return (
                        <span key={event} className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-mono">
                          {evt?.label || event}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDeliveries(wh.id);
                      fetchDeliveries(wh.id);
                    }}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                    title="Voir les livraisons"
                  >
                    <Activity size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(wh.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-neutral-800 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase">Créer un webhook</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-neutral-500 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Nom</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Mon Webhook"
                  className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">URL de callback</label>
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://example.com/webhook"
                  className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Événements à surveiller</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {AVAILABLE_EVENTS.map(({ event, label }) => (
                    <label key={event} className="flex items-center gap-2 bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2 cursor-pointer hover:bg-neutral-800">
                      <input
                        type="checkbox"
                        checked={form.events.includes(event)}
                        onChange={() => handleToggleEvent(event)}
                        className="w-4 h-4 rounded bg-neutral-700 border-neutral-600"
                      />
                      <span className="text-xs text-neutral-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  id="active"
                  className="w-4 h-4 rounded bg-neutral-700 border-neutral-600"
                />
                <label htmlFor="active" className="text-xs font-bold uppercase text-neutral-500">Activer ce webhook</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-bold uppercase text-neutral-500 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name || !form.url}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white px-4 py-2 rounded-full text-xs font-bold uppercase"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliveries Modal */}
      {showDeliveries && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase">Historique des livraisons</h3>
              <button onClick={() => setShowDeliveries(null)} className="text-neutral-500 hover:text-white"><X size={18} /></button>
            </div>

            {deliveriesLoading ? (
              <p className="text-neutral-500 text-center py-8">Chargement…</p>
            ) : deliveries.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">Aucune livraison</p>
            ) : (
              <div className="space-y-2">
                {deliveries.map((d) => (
                  <div key={d.id} className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {d.success ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : d.status_code ? (
                        <AlertCircle size={16} className="text-red-500" />
                      ) : (
                        <Clock size={16} className="text-yellow-500" />
                      )}
                      <div>
                        <p className="text-xs font-mono text-blue-400">{d.event_type}</p>
                        <p className="text-[10px] text-neutral-500">{new Date(d.created_at).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">{d.status_code || '–'}</p>
                      <p className="text-[10px] text-neutral-500">Tentative {d.attempt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};