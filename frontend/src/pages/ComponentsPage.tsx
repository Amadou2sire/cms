import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComponentItem {
  id: string;
  name: string;
  type: string;
  default_props: Record<string, any>;
}

export const ComponentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComponents = async () => {
    if (!currentProject) return;
    try {
      const res = await client.get('/components/');
      setComponents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, [currentProject]);

  if (!currentProject) {
    return <p className="text-neutral-500">Selectionnez un projet pour gerer les composants.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase">Composants globaux</h1>
          <p className="text-sm text-neutral-400 mt-2 max-w-2xl">
            Creez des composants reutilisables et reutilisez-les dans le builder via le bloc "Composant Global".
          </p>
        </div>
        <Link
          to="/dashboard/components/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full font-bold text-xs uppercase"
        >
          <Plus size={14} /> Creer
        </Link>
      </header>

      <section className="mb-8">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-5">
          <h2 className="text-sm font-black uppercase text-neutral-400 tracking-[0.3em] mb-4">Utiliser un composant existant</h2>
          <p className="text-[10px] text-neutral-500 leading-relaxed">
            Choisissez un composant deja cree pour le modifier ou le cloner rapidement.
          </p>
          {components.length === 0 ? (
            <p className="mt-4 text-neutral-500 text-sm">Aucun composant global enregistre.</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {components.map((c) => (
                <li key={c.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{c.name}</div>
                    <div className="text-[10px] text-neutral-500 truncate">{c.type}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => navigate(`/dashboard/components/edit/${c.id}`)}
                      className="text-emerald-400 text-[10px] uppercase tracking-[0.3em] font-black"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => navigate('/dashboard/components/new', { state: { cloneFromId: c.id } })}
                      className="text-blue-400 text-[10px] uppercase tracking-[0.3em] font-black"
                    >
                      Cloner
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

    </div>
  );
};
