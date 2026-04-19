import React from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

export type ModalType = 'success' | 'error' | 'confirm' | 'info'

interface ProfessionalModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  type?: ModalType
  confirmLabel?: string
  cancelLabel?: string
}

const ProfessionalModal: React.FC<ProfessionalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler'
}) => {
  if (!isOpen) return null

  const icons = {
    success: <CheckCircle2 className="text-green-500" size={24} />,
    error: <AlertCircle className="text-red-500" size={24} />,
    confirm: <Info className="text-blue-500" size={24} />,
    info: <Info className="text-blue-500" size={24} />
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#0f0f0f] border border-neutral-800 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
              {icons[type]}
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-white">{title}</h3>
          </div>
          
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {onConfirm ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white hover:bg-neutral-900 transition-all"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => {
                    onConfirm()
                    onClose()
                  }}
                  className={`flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg ${
                    type === 'error' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/10' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/10'
                  }`}
                >
                  {confirmLabel}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-neutral-800"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-neutral-600 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

export default ProfessionalModal
