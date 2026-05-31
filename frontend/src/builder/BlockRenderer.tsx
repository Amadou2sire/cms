import React from 'react'
import { type BlockNode } from './store/builderStore'
import { useBuilderStore } from './store/builderStore'
import { useDroppable } from '@dnd-kit/core'
import { useProject } from '../contexts/ProjectContext'
import { Trash2, ChevronDown, Menu as MenuIcon, X, Monitor, Layers, Activity, Shield, Settings, Cpu, Newspaper, ArrowRight, Calendar, MessageCircle, Mail, Phone, MapPin, Send, Target, Eye, Table, Globe } from 'lucide-react'
import client from '../api/client'

/** Prefix a relative URL with the language code if not already prefixed. */
function normalizeHref(href: string, lang: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return href
  if (/^\/[a-z]{2}(\/|$)/.test(href)) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return `/${lang}${path}`
}

const ICON_MAP: Record<string, any> = {
  Monitor,
  Layers,
  Activity,
  Shield,
  Settings,
  Cpu
}

// --- Leaf blocks (no children) ---

const HeadingBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const { 
    text = 'Titre', 
    level = 2, 
    align = 'left',
    color = '#171717',
    padding = '0px',
    showUnderline = false
  } = node.props

  const Tag = `h${level}` as any

  const getStyle = () => {
    switch (Number(level)) {
      case 1: return 'text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none'
      case 2: return 'text-3xl md:text-5xl font-black uppercase tracking-tighter leading-tight'
      case 3: return 'text-2xl md:text-3xl font-black uppercase tracking-tight'
      default: return 'text-xl font-bold uppercase tracking-widest'
    }
  }

  return (
    <div style={{ padding, textAlign: align as any }} className="w-full">
      <Tag 
        style={{ color }} 
        className={`${getStyle()} transition-all duration-300`}
      >
        {text}
      </Tag>
      {showUnderline === 'true' && (
        <div 
          className="h-1.5 bg-red-600 mt-6 rounded-full transition-all duration-500"
          style={{ 
            width: '80px', 
            marginLeft: align === 'center' ? 'auto' : '0', 
            marginRight: align === 'center' ? 'auto' : '0' 
          }}
        />
      )}
    </div>
  )
}

const TextBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const { 
    content = 'Votre texte ici...', 
    color = '#333333', 
    fontSize = '16px', 
    align = 'left', 
    weight = '400',
    lineHeight = '1.6',
    margin = '0', 
    padding = '0' 
  } = node.props
  return (
    <div style={{ margin, padding }}>
      <div style={{ 
        color, 
        fontSize, 
        textAlign: align as any,
        fontWeight: weight,
        lineHeight: lineHeight
      }} dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}

const ImageBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const { src = 'https://via.placeholder.com/800x400', alt = '', width = '100%', borderRadius = '0px', margin = '0', padding = '0' } = node.props
  return (
    <div style={{ margin, padding }}>
      <img src={src} alt={alt} style={{ width, borderRadius }} className="block mx-auto" />
    </div>
  )
}

const ButtonBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const { label = 'Bouton', color = '#ffffff', bg = '#0070f3', variant = 'primary', margin = '0', padding = '10px 20px' } = node.props
  const baseStyles = "rounded font-medium transition-all inline-block"
  const styles = variant === 'primary'
    ? { backgroundColor: bg, color, padding }
    : { border: `1px solid ${bg}`, color: bg, padding }
  return (
    <div style={{ margin }}>
      <button className={baseStyles} style={styles}>{label}</button>
    </div>
  )
}

// --- Parent blocks (accept dropped children) ---

const DroppableZone: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[40px] rounded transition-colors ${isOver ? 'ring-2 ring-blue-400 ring-inset bg-blue-500/10' : ''}`}
    >
      {children}
    </div>
  )
}

const SectionBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node, mode }) => {
  const { bg = '#ffffff', padding = '48px', maxWidth = '100%', direction = 'column', margin = '0' } = node.props
  return (
    <div 
      style={{ backgroundColor: bg, margin, display: 'flex', flexDirection: direction as any, alignItems: 'center', width: '100%' }}
      className="responsive-section"
    >
      <div 
        style={{ maxWidth, width: '100%', padding }} 
        className="mx-auto"
      >
        <DroppableZone id={node.id}>
          {node.children.length === 0 ? (
            <div className="text-center text-neutral-400 border-2 border-dashed border-neutral-300 p-6 rounded-lg text-sm">
              Glissez des blocs ici
            </div>
          ) : (
            <div className="space-y-4">
              {node.children.map(child => <BlockRenderer key={child.id} node={child} mode={mode} />)}
            </div>
          )}
        </DroppableZone>
      </div>
    </div>
  )
}

const ColumnsBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node, mode }) => {
  const { count = 2, gap = '48px', alignItems = 'center', margin = '0', padding = '0' } = node.props
  const numCols = parseInt(String(count)) || 2

  const columns: BlockNode[][] = Array.from({ length: numCols }, () => [])
  node.children.forEach((child, i) => {
    columns[i % numCols].push(child)
  })

  return (
    <div 
      style={{ 
        margin, 
        padding, 
        gap,
        alignItems: alignItems as any
      }}
      className={`grid w-full grid-cols-1 md:grid-cols-${numCols}`}
    >
      {Array.from({ length: numCols }).map((_, colIndex) => (
        <DroppableZone key={colIndex} id={`${node.id}__col_${colIndex}`}>
          {columns[colIndex].length === 0 ? (
            <div className="text-center text-neutral-400 border-2 border-dashed border-neutral-300 p-8 rounded-2xl text-xs min-h-[120px] flex items-center justify-center bg-neutral-50/50">
              Colonne {colIndex + 1}
            </div>
          ) : (
            <div className="space-y-6">
              {columns[colIndex].map(child => <BlockRenderer key={child.id} node={child} mode={mode} />)}
            </div>
          )}
        </DroppableZone>
      ))}
    </div>
  )
}

const BannerBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node, mode }) => {
  const {
    bgImage = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072',
    overlayColor = '#000000',
    overlayOpacity = '0.6',
    height = '500px',
    justify = 'center',
    margin = '0',
    padding = '0'
  } = node.props

  return (
    <div
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: justify,
        position: 'relative',
        margin,
        width: '100%'
      }}
      className="overflow-hidden"
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundColor: overlayColor,
          opacity: parseFloat(overlayOpacity)
        }}
      />
      
      <div className="z-10 relative w-full px-[10%]" style={{ padding }}>
        <DroppableZone id={node.id}>
          {node.children.length === 0 ? (
            <div className="text-center text-white/30 border-2 border-dashed border-white/10 p-20 rounded-3xl backdrop-blur-sm bg-white/5 animate-pulse">
              <p className="text-sm font-black uppercase tracking-widest">Zone de contenu dynamique</p>
              <p className="text-[10px] opacity-60 mt-2">Glissez des titres, textes ou boutons ici</p>
            </div>
          ) : (
            <div className="space-y-6">
              {node.children.map(child => <BlockRenderer key={child.id} node={child} mode={mode} />)}
            </div>
          )}
        </DroppableZone>
      </div>
    </div>
  )
}

const HeroBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const {
    bgImage = '',
    bgVideo = '',
    overlayOpacity = '0.6',
    title = 'Titre Hero',
    subtitle = 'Sous-titre',
    description = '',
    primaryBtnText = 'Bouton 1',
    primaryBtnHref = '#',
    secondaryBtnText = 'Bouton 2',
    secondaryBtnHref = '#',
    height = '100vh',
    textAlign = 'left'
  } = node.props

  const alignStyles = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right'
  }

  return (
    <div 
      className={`relative w-full overflow-hidden flex flex-col justify-center ${alignStyles[textAlign as keyof typeof alignStyles]}`}
      style={{ 
        minHeight: height,
        padding: '5% 10%'
      }}
    >
      {/* Background Media */}
      {bgVideo ? (
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          src={bgVideo}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : bgImage ? (
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      ) : null}

      <div 
        className="absolute inset-0 bg-black z-10" 
        style={{ opacity: parseFloat(overlayOpacity) }}
      />
      
      <div className="relative z-20 max-w-4xl space-y-6">
        {subtitle && (
          <p className="text-[#e5482d] font-black uppercase tracking-[0.2em] text-sm md:text-base animate-in fade-in slide-in-from-bottom-4 duration-700">
            {subtitle}
          </p>
        )}
        <h1 className="text-white font-black leading-[1.1] text-5xl md:text-7xl lg:text-8xl tracking-tighter animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {title}
        </h1>
        {description && (
          <p className="text-neutral-300 text-lg md:text-xl leading-relaxed max-w-2xl opacity-80 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          {primaryBtnText && (
            <a 
              href={primaryBtnHref}
              className="bg-[#e5482d] hover:bg-[#c4361e] text-white px-8 py-4 rounded font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              {primaryBtnText} <span>→</span>
            </a>
          )}
          {secondaryBtnText && (
            <a 
              href={secondaryBtnHref}
              className="bg-transparent border border-white/30 hover:bg-white/10 text-white px-8 py-4 rounded font-bold transition-all hover:scale-105 active:scale-95"
            >
              {secondaryBtnText}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

const AboutBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const {
    image = '',
    accentText = 'QUI SOMMES-NOUS?',
    title = '',
    description = '',
    linkText = 'En savoir plus',
    linkHref = '#',
    badgeText = '25+',
    badgeSub = "ANS D'EXPERTISE",
    reverse = 'false'
  } = node.props

  const isReverse = reverse === 'true'

  return (
    <div className="py-24 px-[5%] md:px-[10%] bg-white">
      <div className={`max-w-7xl mx-auto flex flex-col ${isReverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16 lg:gap-24`}>
        {/* Left: Image with Badge */}
        <div className="w-full md:w-1/2 relative">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img src={image} alt="About" className="w-full aspect-square object-cover transition-transform duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </div>
          
          {/* Characteristic Red Badge */}
          {badgeText && (
            <div className="absolute -bottom-6 -right-6 md:right-0 bg-[#e5482d] p-8 rounded-xl shadow-2xl text-white text-center min-w-[160px] animate-in zoom-in duration-500 delay-300">
              <div className="text-4xl font-black leading-none mb-1">{badgeText}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest opacity-80">{badgeSub}</div>
            </div>
          )}
        </div>

        {/* Right: Content */}
        <div className="w-full md:w-1/2 space-y-8">
          <div className="space-y-4">
            {accentText && (
              <p className="text-[#e5482d] font-black uppercase tracking-[0.2em] text-xs">
                {accentText}
              </p>
            )}
            <h2 
              className="text-4xl md:text-5xl font-black text-neutral-900 leading-tight tracking-tight"
              dangerouslySetInnerHTML={{ __html: title }}
            />
          </div>
          
          <div 
            className="text-neutral-500 text-lg leading-relaxed max-w-xl"
            dangerouslySetInnerHTML={{ __html: description }}
          />

          {linkText && (
            <div className="pt-4">
              <a 
                href={linkHref}
                className="group flex items-center gap-3 text-[#e5482d] font-black uppercase tracking-widest text-xs transition-all hover:gap-5"
              >
                {linkText}
                <span className="text-xl leading-none transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const FeaturesBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const {
    accentText = '',
    title = '',
    items = [],
    columns = 2
  } = node.props

  return (
    <div className="py-24 px-[5%] md:px-[10%] bg-neutral-50/50">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            {accentText && (
              <p className="text-[#e5482d] font-black uppercase tracking-[0.2em] text-xs animate-in fade-in duration-700">
                {accentText}
              </p>
            )}
            <h2 className="text-3xl md:text-5xl font-black text-neutral-900 tracking-tight animate-in fade-in slide-in-from-left-4 duration-1000">
              {title}
            </h2>
          </div>
          <div className="hidden md:block w-32 h-[3px] bg-[#e5482d] mb-4" />
        </div>

        {/* Grid Section */}
        <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-8`}>
          {items.map((item: any, idx: number) => (
            <div 
              key={idx} 
              className="group relative aspect-[4/5] rounded-xl overflow-hidden shadow-2xl bg-neutral-900 cursor-pointer animate-in fade-in zoom-in duration-700"
              style={{ transitionDelay: `${idx * 150}ms` }}
            >
              {/* Background Image */}
              <img 
                src={item.image} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70" 
              />
              
              {/* Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
              
              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end space-y-4">
                <h3 className="text-2xl font-black text-white tracking-tight leading-none group-hover:text-[#e5482d] transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                  {item.description}
                </p>
                
                {/* Tags / Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {(item.tags || []).map((tag: string, tIdx: number) => (
                    <span 
                      key={tIdx} 
                      className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded text-[9px] font-black uppercase tracking-widest text-white hover:bg-[#e5482d] hover:border-[#e5482d] transition-all"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const CtaSplitBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const {
    accentText = '',
    title = '',
    description = '',
    image = '',
    points = '',
    bg = '#0a0a0a',
    reverse = 'false'
  } = node.props

  const isReverse = reverse === 'true'
  const pointList = points.split(',').map(p => p.trim()).filter(p => p)

  return (
    <div className="py-12 px-[5%] md:px-[8%]">
      <div 
        style={{ backgroundColor: bg }}
        className={`max-w-7xl mx-auto rounded-[2rem] overflow-hidden flex flex-col ${isReverse ? 'md:flex-row-reverse' : 'md:flex-row'} shadow-2xl border border-white/5`}
      >
        {/* Content Side */}
        <div className="w-full md:w-1/2 p-12 md:p-20 space-y-10 flex flex-col justify-center">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#e5482d] rounded-xl flex items-center justify-center text-white shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                {accentText}
              </p>
            </div>
            
            <h2 
              className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight"
              dangerouslySetInnerHTML={{ __html: title }}
            />
            
            <div 
              className="text-neutral-400 text-lg leading-relaxed max-w-lg"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>

          {/* Checklist */}
          <div className="space-y-4">
            {pointList.map((point, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className="w-6 h-6 rounded-full bg-[#e5482d]/10 border border-[#e5482d]/20 flex items-center justify-center text-[#e5482d] group-hover:bg-[#e5482d] group-hover:text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <span className="text-sm font-bold text-neutral-300 group-hover:text-white transition-colors">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Image Side */}
        <div className="w-full md:w-1/2 relative min-h-[400px]">
          <img src={image} alt="Technical" className="absolute inset-0 w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-${isReverse ? 'left' : 'right'} from-transparent via-transparent to-[${bg}] opacity-60`} />
        </div>
      </div>
    </div>
  )
}

const ContactBannerBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const {
    title = '',
    description = '',
    btn1Text = '',
    btn1Href = '',
    btn2Text = '',
    btn2Href = '',
    bg = '#141414'
  } = node.props

  return (
    <div className="px-[5%] md:px-[8%] py-12">
      <div 
        style={{ backgroundColor: bg }}
        className="max-w-7xl mx-auto rounded-2xl overflow-hidden relative flex flex-col lg:flex-row items-center justify-between p-8 md:p-12 gap-8 shadow-xl"
      >
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#e5482d]/10 skew-x-[-20deg] translate-x-1/2 pointer-events-none" />
        
        <div className="flex-1 space-y-4 z-10">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{title}</h2>
          <p className="text-neutral-400 text-sm md:text-base max-w-xl leading-relaxed">{description}</p>
        </div>

        <div className="flex flex-wrap gap-4 z-10">
          {btn1Text && (
            <a 
              href={btn1Href}
              className="bg-white hover:bg-neutral-100 text-neutral-900 px-8 py-5 rounded-lg flex items-center gap-4 transition-all hover:scale-105"
            >
              <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-center">{btn1Text}</span>
            </a>
          )}
          {btn2Text && (
            <a 
              href={btn2Href}
              className="bg-[#e5482d] hover:bg-[#c4361e] text-white px-8 py-5 rounded-lg flex items-center gap-4 transition-all hover:scale-105 shadow-lg shadow-[#e5482d]/20"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-left leading-tight">{btn2Text}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

const InnovationBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const {
    accentText = '',
    title = '',
    image = '',
    badgeValue = '',
    badgeLabel = '',
    items = [],
    reverse = 'false'
  } = node.props

  const isReverse = reverse === 'true'

  return (
    <div className="py-24 px-[5%] md:px-[10%] bg-white overflow-hidden">
      <div className={`max-w-7xl mx-auto flex flex-col ${isReverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-20 lg:gap-32`}>
        {/* Left: Content */}
        <div className="w-full md:w-1/2 space-y-12">
          <div className="space-y-4">
            {accentText && (
              <p className="text-[#e5482d] font-black uppercase tracking-[0.2em] text-xs">
                {accentText}
              </p>
            )}
            <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
              {title}
            </h2>
          </div>

          <div className="space-y-10">
            {items.map((item: any, idx: number) => {
              return (
                <div key={idx} className="flex gap-6 group">
                  <div className="shrink-0 w-14 h-14 rounded-xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center overflow-hidden p-3 group-hover:bg-[#e5482d] transition-all duration-300">
                    {item.icon ? (
                      <img src={item.icon} alt={item.title} className="w-full h-full object-contain group-hover:brightness-0 group-hover:invert transition-all" />
                    ) : (
                      <Settings size={24} className="text-[#e5482d] group-hover:text-white" />
                    )}
                  </div>
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xl font-black text-neutral-900 tracking-tight">{item.title}</h4>
                    <div 
                      className="text-neutral-500 text-sm leading-relaxed max-w-md"
                      dangerouslySetInnerHTML={{ __html: item.description }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Image with Badge */}
        <div className="w-full md:w-1/2 relative">
          <div className="relative p-4 bg-white shadow-2xl rounded-2xl border border-neutral-50">
            <div className="rounded-xl overflow-hidden aspect-[4/3]">
              <img src={image} alt="Innovation" className="w-full h-full object-cover" />
            </div>
            
            {/* Floating Performance Badge */}
            {badgeValue && (
              <div className="absolute -bottom-8 left-8 right-auto md:-left-8 bg-[#e5482d] p-8 rounded-xl shadow-2xl text-white min-w-[200px] animate-in slide-in-from-bottom-8 duration-700">
                <div className="text-4xl font-black italic tracking-tighter mb-1">{badgeValue}</div>
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80">{badgeLabel}</div>
              </div>
            )}
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-neutral-100 rounded-full -z-10 opacity-50" />
        </div>
      </div>
    </div>
  )
}

const QualityBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const {
    title = '',
    subtitle = '',
    items = []
  } = node.props

  return (
    <div className="py-24 px-[5%] md:px-[10%] bg-white">
      <div className="max-w-7xl mx-auto space-y-20">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-neutral-500 italic text-lg opacity-80">{subtitle}</p>
          )}
        </div>

        {/* Quality Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ transitionDelay: `${idx * 150}ms` }}>
              <div className="flex items-start justify-between">
                {/* Icon Container */}
                <div className="w-14 h-14 bg-white border border-neutral-100 shadow-sm rounded-xl flex items-center justify-center p-3">
                  {item.icon ? (
                    <img src={item.icon} alt={item.title} className="w-full h-full object-contain" />
                  ) : (
                    <Shield size={24} className="text-[#e5482d]" />
                  )}
                </div>
                
                {/* Red Badge */}
                {item.tag && (
                  <span className="bg-[#e5482d]/5 text-[#e5482d] text-[8px] font-black tracking-widest px-3 py-1.5 rounded uppercase border border-[#e5482d]/10">
                    {item.tag}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-2xl font-black text-neutral-900 tracking-tight">{item.title}</h4>
                <div 
                  className="text-neutral-500 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </div>

              {/* Red Underline Decor */}
              <div className="w-12 h-1 bg-[#e5482d] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const LabBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const {
    title = '',
    description = '',
    image = '',
    items = [],
    reverse = 'false'
  } = node.props

  const isReverse = reverse === 'true'

  return (
    <div className="py-24 px-[5%] md:px-[10%] bg-neutral-50/50 overflow-hidden">
      <div className={`max-w-7xl mx-auto flex flex-col ${isReverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16 lg:gap-24`}>
        {/* Left: Content Grid */}
        <div className="w-full md:w-1/2 space-y-12">
          <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
            {title}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-12">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-4 group">
                {/* Red Border Accent */}
                <div className="w-1 bg-[#e5482d] rounded-full group-hover:w-2 transition-all duration-300" />
                <div className="space-y-1">
                  <p className="text-[#e5482d] font-black uppercase tracking-widest text-[10px]">
                    {item.label}
                  </p>
                  <p className="text-xl font-black text-neutral-900 tracking-tight">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div 
            className="text-neutral-500 text-lg leading-relaxed pt-4 border-t border-neutral-200"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>

        {/* Right: Large Image */}
        <div className="w-full md:w-1/2">
          <div className="relative rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]">
            <img src={image} alt="Lab" className="w-full aspect-[4/3] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  )
}

const NewsBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const { defaultLanguage } = useProject()
  const {
    title = 'Dernières Actualités',
    accentText = 'NEWSROOM',
    bg = '#ffffff',
    limit = 4,
    margin = '0',
    padding = '80px 48px'
  } = node.props

  const [articles, setArticles] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await client.get('/articles/public/')
        // Sort by date and limit
        const sorted = res.data
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit)
        setArticles(sorted)
      } catch (err) {
        console.error("Failed to fetch news for block", err)
      } finally {
        setLoading(false)
      }
    }
    fetchArticles()
  }, [limit])

  return (
    <div style={{ backgroundColor: bg, margin }} className="w-full">
      <div style={{ padding }} className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-4">
            {accentText && (
              <p className="text-[#e5482d] font-black uppercase tracking-[0.2em] text-[10px] animate-in fade-in duration-700">
                {accentText}
              </p>
            )}
            <h2 className="text-3xl md:text-5xl font-black text-neutral-900 tracking-tight animate-in fade-in slide-in-from-left-4 duration-1000">
              {title}
            </h2>
          </div>
          <div className="w-24 h-1 bg-[#e5482d] rounded-full hidden md:block mb-4" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="aspect-[4/3] bg-neutral-100 rounded-2xl" />
                <div className="h-4 bg-neutral-100 rounded w-1/2" />
                <div className="h-6 bg-neutral-100 rounded w-full" />
              </div>
            ))
          ) : articles.length === 0 ? (
            <div className="col-span-full py-12 text-center border border-dashed border-neutral-200 rounded-2xl text-neutral-400 text-sm uppercase tracking-widest">
              Aucun article publié
            </div>
          ) : (
            articles.map((article, idx) => (
              <a 
                key={article.id} 
                href={normalizeHref(`/articles/${article.slug || article.id}`, defaultLanguage)}
                className="group flex flex-col space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700 no-underline"
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                {/* Image Wrap */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm bg-neutral-100">
                  {article.image_url ? (
                    <img 
                      src={article.image_url} 
                      alt={article.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                      <Newspaper size={40} />
                    </div>
                  )}
                  {/* Badge Date Overlay */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                    <Calendar size={12} className="text-[#e5482d]" />
                    <span className="text-[9px] font-black uppercase text-neutral-900 tracking-tighter">
                      {new Date(article.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3 px-1">
                  <h3 className="text-xl font-black text-neutral-900 tracking-tight leading-tight group-hover:text-[#e5482d] transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <div 
                    className="text-neutral-500 text-sm leading-relaxed line-clamp-3 opacity-80"
                    dangerouslySetInnerHTML={{ __html: article.content.substring(0, 150) + '...' }}
                  />
                  <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-900 group-hover:text-[#e5482d] transition-all pt-2">
                    Lire la suite <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const HeaderBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node, mode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const { defaultLanguage } = useProject()
  const {
    logo = '',
    logoHeight = '40px',
    alignMenu = 'left',
    bg = '#ffffff',
    textColor = '#000000',
    btnBg = '#2563eb',
    btnColor = '#ffffff',
    sticky = 'true',
    menuItems = [],
    buttonLabel = '',
    buttonHref = '#',
    padding = '16px 48px'
  } = node.props

  const renderMenuItem = (item: any, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    return (
      <div key={item.label} className="relative group/item">
        <a
          href={normalizeHref(item.href, defaultLanguage)}
          style={{ color: level > 0 ? '#374151' : textColor }}
          className={`flex items-center gap-1 py-2 px-3 text-sm font-medium transition-colors hover:opacity-70`}
        >
          {item.label}
          {hasChildren && <ChevronDown size={14} className="opacity-50" />}
        </a>
        
        {hasChildren && (
          <div className={`absolute left-0 mt-0 w-48 bg-white border border-gray-100 shadow-xl rounded-lg py-2 z-[100] opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 transform origin-top-left ${level > 0 ? 'ml-full -mt-8 left-full' : ''}`}>
            {item.children.map((child: any) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderMobileMenuItem = (item: any, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    return (
      <div key={item.label} className="w-full">
        <a
          href={normalizeHref(item.href, defaultLanguage)}
          style={{ color: textColor }}
          className={`flex items-center justify-between py-3 text-lg font-bold border-b border-neutral-100`}
          onClick={() => !hasChildren && setMobileMenuOpen(false)}
        >
          {item.label}
          {hasChildren && <ChevronDown size={18} className="opacity-50" />}
        </a>
        {hasChildren && (
          <div className="ml-4 border-l-2 border-neutral-100 pl-4 space-y-1">
            {item.children.map((child: any) => renderMobileMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <header 
      style={{ backgroundColor: bg, position: (mode !== 'edit' && (sticky === 'true' || sticky === true)) ? 'fixed' : 'relative', top: 0, left: 0, right: 0, zIndex: 100 }}
      className="w-full shadow-sm"
    >
      <div 
        style={{ padding }}
        className="flex items-center justify-between mx-auto w-full relative"
      >
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <a href={normalizeHref('/', defaultLanguage)} className="hover:opacity-80 transition-opacity">
            {logo ? (
              <img src={logo} alt="Logo" style={{ height: logoHeight }} className="max-w-[150px] object-contain" />
            ) : (
              <span className="text-xl font-bold tracking-tight" style={{ color: textColor }}>Logo</span>
            )}
          </a>
        </div>
        
        {/* Menu Links */}
        <nav className={`hidden lg:flex items-center gap-4 ${
          alignMenu === 'center' 
            ? 'absolute left-1/2 -translate-x-1/2' 
            : alignMenu === 'right' 
              ? 'ml-auto mr-6' 
              : 'mr-auto ml-12'
        }`}>
          {menuItems.map((item: any) => renderMenuItem(item))}
        </nav>

        {/* CTA Button & Mobile Trigger */}
        <div className="flex items-center gap-4 shrink-0">
          {buttonLabel && (
            <a 
              href={normalizeHref(buttonHref, defaultLanguage)}
              style={{ backgroundColor: btnBg, color: btnColor }}
              className="hidden sm:block px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 hover:opacity-90"
            >
              {buttonLabel}
            </a>
          )}

          {/* Burger Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-black/5 rounded-lg transition-colors"
            style={{ color: textColor }}
          >
            <MenuIcon size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[1000] lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Content */}
          <div 
            className="absolute top-0 right-0 w-[85%] max-w-sm h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            style={{ backgroundColor: bg }}
          >
            <div className="flex justify-between items-center p-6 border-b border-neutral-100">
              {logo ? (
                <img src={logo} alt="Logo" style={{ height: '30px' }} />
              ) : (
                <span className="text-xl font-bold tracking-tight" style={{ color: textColor }}>Logo</span>
              )}
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                style={{ color: textColor }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {menuItems.map((item: any) => renderMobileMenuItem(item))}
            </div>

            <div className="p-6 border-t border-neutral-100">
              {buttonLabel && (
                <a 
                  href={normalizeHref(buttonHref, defaultLanguage)}
                  style={{ backgroundColor: btnBg, color: btnColor }}
                  className="block w-full text-center py-4 rounded-xl text-sm font-black uppercase tracking-widest"
                >
                  {buttonLabel}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

const FooterBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const { defaultLanguage } = useProject()
  const {
    logo = '',
    bg = '#111111',
    textColor = '#ffffff',
    copyright = '',
    columns = [],
    padding = '64px 48px 32px 48px'
  } = node.props

  return (
    <footer style={{ backgroundColor: bg, color: textColor, padding }} className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            {logo && <img src={logo} alt="Logo" className="h-10 object-contain" />}
            <p className="text-sm opacity-60 leading-relaxed max-w-xs">
              L'Excellence industrielle au service de vos projets les plus ambitieux.
            </p>
          </div>
          
          {columns.map((col: any, idx: number) => {
            const colTitle = col.title || col.label || 'Section'
            const colLinks = col.links || col.children || []
            return (
              <div key={idx} className="space-y-6">
                {col.href && col.href !== '#' ? (
                  <a href={normalizeHref(col.href, defaultLanguage)} className="block font-bold uppercase tracking-widest text-xs opacity-40 hover:opacity-100 hover:text-blue-500 transition-all">
                    {colTitle}
                  </a>
                ) : (
                  <h5 className="font-bold uppercase tracking-widest text-xs opacity-40">{colTitle}</h5>
                )}
                
                {colLinks.length > 0 && (
                  <ul className="space-y-4">
                    {colLinks.map((link: any, lIdx: number) => (
                      <li key={lIdx}>
                        <a href={normalizeHref(link.href, defaultLanguage)} className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-medium uppercase tracking-widest opacity-40">
          <p>{copyright || `© ${new Date().getFullYear()} CANVAS CMS. All rights reserved.`}</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Mentions Légales</a>
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

const FAQBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const { 
    title = 'Questions Fréquentes', 
    subtitle = '', 
    items = [], 
    bg = '#ffffff', 
    padding = '80px 48px' 
  } = node.props
  
  const [openIndex, setOpenIndex] = React.useState<number | null>(0)

  return (
    <section style={{ backgroundColor: bg, padding }} className="w-full">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-[1px] bg-red-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600">F.A.Q</span>
            <div className="w-10 h-[1px] bg-red-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-black leading-tight tracking-tighter mb-4 uppercase">
            {title}
          </h2>
          {subtitle && (
            <p className="text-neutral-500 max-w-xl mx-auto text-sm leading-relaxed">
              {subtitle}
            </p>
          )}
        </header>

        <div className="space-y-3">
          {items.map((item: any, idx: number) => (
            <div 
              key={idx} 
              className={`border border-neutral-100 rounded-3xl transition-all duration-300 ${
                openIndex === idx ? 'bg-neutral-50 shadow-xl shadow-neutral-100' : 'bg-white hover:border-neutral-200'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between py-4 md:py-5 px-6 md:px-8 text-left group"
              >
                <div className="flex items-center gap-6">
                  <span className={`text-[10px] font-black transition-colors ${openIndex === idx ? 'text-red-600' : 'text-neutral-300'}`}>
                    0{idx + 1}
                  </span>
                  <span className="text-sm md:text-base font-bold text-black group-hover:text-red-600 transition-colors">
                    {item.question}
                  </span>
                </div>
                <div className={`w-10 h-10 rounded-full border border-neutral-100 flex items-center justify-center transition-transform duration-500 ${openIndex === idx ? 'rotate-180 bg-red-600 border-red-600 text-white' : 'text-neutral-400 group-hover:bg-neutral-50'}`}>
                  <ChevronDown size={18} />
                </div>
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openIndex === idx ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div 
                  className="px-6 md:px-20 pb-8 text-neutral-600 text-sm md:text-base leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: item.answer }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- Registry ---

// --- Wrapper with selection outline ---

const ContactBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const { 
    title = 'Contactez-nous',
    subtitle = '',
    email = '',
    phone = '',
    address = '',
    mapUrl = '',
    buttonLabel = 'Envoyer',
    bg = '#ffffff',
    padding = '100px 48px'
  } = node.props

  return (
    <section style={{ backgroundColor: bg, padding }} className="w-full font-['Inter',sans-serif]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Info Side */}
          <div className="space-y-12">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4 block">Get in touch</span>
              <h2 className="text-4xl md:text-6xl font-black text-neutral-900 tracking-tighter uppercase leading-none">
                {title}
              </h2>
              {subtitle && <p className="mt-6 text-neutral-500 text-lg max-w-md leading-relaxed">{subtitle}</p>}
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:bg-red-600 transition-colors duration-500 shadow-xl shadow-neutral-200">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Email</h4>
                  <p className="text-xl font-bold text-neutral-900">{email}</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:bg-red-600 transition-colors duration-500 shadow-xl shadow-neutral-200">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Téléphone</h4>
                  <p className="text-xl font-bold text-neutral-900">{phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:bg-red-600 transition-colors duration-500 shadow-xl shadow-neutral-200">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Siège Social</h4>
                  <p className="text-xl font-bold text-neutral-900 leading-tight">{address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-neutral-50 p-10 md:p-16 rounded-[3rem] border border-neutral-100 shadow-2xl shadow-neutral-200/50">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 ml-2">Nom complet</label>
                  <input type="text" placeholder="John Doe" className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 text-sm font-bold focus:border-red-600 outline-none transition-all shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 ml-2">Email professionnel</label>
                  <input type="email" placeholder="john@company.com" className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 text-sm font-bold focus:border-red-600 outline-none transition-all shadow-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 ml-2">Sujet</label>
                <input type="text" placeholder="Demande de devis" className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 text-sm font-bold focus:border-red-600 outline-none transition-all shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 ml-2">Message</label>
                <textarea rows={5} placeholder="Décrivez votre projet..." className="w-full bg-white border border-neutral-200 rounded-3xl px-6 py-5 text-sm font-bold focus:border-red-600 outline-none transition-all shadow-sm resize-none"></textarea>
              </div>
              <button className="w-full bg-neutral-900 hover:bg-red-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 shadow-xl flex items-center justify-center gap-3 active:scale-95">
                {buttonLabel}
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Map Section */}
        {mapUrl && (
          <div className="mt-24 rounded-[3rem] overflow-hidden border border-neutral-200 shadow-2xl h-[500px]">
            <iframe 
              src={mapUrl.includes('<iframe') ? mapUrl.match(/src="([^"]+)"/)?.[1] || mapUrl : mapUrl}
              className="w-full h-full grayscale hover:grayscale-0 transition-all duration-1000"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
            ></iframe>
          </div>
        )}
      </div>
    </section>
  )
}

const MissionVisionBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const { 
    title = 'Notre Engagement',
    missionTitle = 'Notre Mission',
    missionText = '',
    visionTitle = 'Notre Vision',
    visionText = '',
    bg = '#f8f9fa',
    padding = '100px 48px'
  } = node.props

  return (
    <section style={{ backgroundColor: bg, padding }} className="w-full font-['Inter',sans-serif] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {title && (
          <div className="text-center mb-12 md:mb-20">
            <h1 className="text-3xl md:text-6xl font-black text-neutral-900 uppercase tracking-tighter leading-none px-4 md:px-0">
              {title}
            </h1>
            <div className="w-16 md:w-24 h-1.5 bg-red-600 mx-auto mt-6 md:mt-8 rounded-full" />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-16">
          {/* Mission Card */}
          <div className="group bg-white p-8 sm:p-10 md:p-12 lg:p-16 rounded-3xl md:rounded-[3rem] border border-neutral-100 shadow-xl shadow-neutral-200/50 hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-red-500/5 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 group-hover:scale-150 transition-transform duration-700" />
            
            <div className="w-14 h-14 md:w-16 md:h-16 bg-red-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white mb-8 md:mb-10 shadow-lg shadow-red-200 group-hover:rotate-6 transition-transform">
              <Target size={28} className="md:w-8 md:h-8" />
            </div>
            
            <h3 className="text-2xl md:text-3xl font-black text-neutral-900 uppercase tracking-tighter mb-4 md:mb-6 relative z-10">
              {missionTitle}
            </h3>
            <p className="text-neutral-500 text-base md:text-lg leading-relaxed font-medium relative z-10">
              {missionText}
            </p>
          </div>

          {/* Vision Card */}
          <div className="group bg-neutral-900 p-8 sm:p-10 md:p-12 lg:p-16 rounded-3xl md:rounded-[3rem] border border-neutral-800 shadow-2xl hover:shadow-blue-500/10 transition-all duration-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-blue-500/5 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 group-hover:scale-150 transition-transform duration-700" />
            
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white mb-8 md:mb-10 shadow-lg shadow-blue-900/50 group-hover:-rotate-6 transition-transform">
              <Eye size={28} className="md:w-8 md:h-8" />
            </div>
            
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-4 md:mb-6 relative z-10">
              {visionTitle}
            </h3>
            <p className="text-neutral-400 text-base md:text-lg leading-relaxed font-medium relative z-10">
              {visionText}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

const GlobalComponentBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const { componentId, bg = '#ffffff', padding = '0' } = node.props
  const [component, setComponent] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!componentId) {
      setLoading(false)
      return
    }
    const fetchComponent = async () => {
      try {
        const res = await client.get(`/components/${componentId}`)
        setComponent(res.data)
      } catch (err) {
        console.error("Failed to fetch global component", err)
      } finally {
        setLoading(false)
      }
    }
    fetchComponent()
  }, [componentId])

  const style: React.CSSProperties = { backgroundColor: bg, padding }

  if (!componentId) {
    return (
      <div style={style} className="w-full text-center py-12 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-400 text-sm">
        Sélectionnez un composant global dans les propriétés
      </div>
    )
  }

  if (loading) {
    return (
      <div style={style} className="w-full flex items-center justify-center py-20">
        <div className="animate-pulse text-neutral-400 text-sm uppercase tracking-widest">Chargement...</div>
      </div>
    )
  }

  if (!component) {
    return (
      <div style={style} className="w-full text-center py-12 text-red-400 text-sm">
        Composant introuvable
      </div>
    )
  }

  return (
    <div style={style} className="w-full">
      <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4 opacity-50">
        ? {component.name}
      </div>
      {component.type && component.type !== 'globalComponent' ? (
        <BlockRenderer
          mode="preview"
          node={{
            id: `global-component-render-${component.id ?? componentId}`,
            type: component.type,
            props: component.default_props || {},
            children: []
          }}
        />
      ) : (
        <div className="text-red-400 text-sm">
          Type de composant global invalide.
        </div>
      )}
    </div>
  )
}

const FormBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const { formId, bg = '#ffffff', padding = '48px' } = node.props
  const [form, setForm] = React.useState<any>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [formData, setFormData] = React.useState<Record<string, any>>({})
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!formId) { setLoading(false); return }
    const fetchForm = async () => {
      try {
        const res = await client.get(`/forms/${formId}`)
        setForm(res.data)
      } catch (err) {
        console.error("Failed to fetch form", err)
      } finally {
        setLoading(false)
      }
    }
    fetchForm()
  }, [formId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formId) return
    setSubmitting(true)
    try {
      await client.post(`/forms/${formId}/submissions`, { data: formData })
      setSubmitted(true)
      setFormData({})
    } catch (err) {
      console.error("Form submission failed", err)
      alert("Erreur lors de l'envoi")
    } finally {
      setSubmitting(false)
    }
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!formId) {
    return (
      <div style={{ backgroundColor: bg, padding }} className="w-full text-center py-12 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-400 text-sm">
        Sélectionnez un formulaire dans les propriétés
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: bg, padding }} className="w-full flex items-center justify-center py-20">
        <div className="animate-pulse text-neutral-400 text-sm uppercase tracking-widest">Chargement...</div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ backgroundColor: bg, padding }} className="w-full">
        <div className="max-w-xl mx-auto text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-green-600 uppercase tracking-tight mb-2">Merci !</h3>
          <p className="text-neutral-500 text-sm">Votre message a bien été envoyé.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 text-xs font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
          >
            Envoyer une autre réponse
          </button>
        </div>
      </div>
    )
  }

  const fields = Array.isArray(form?.fields) ? form.fields : []

  return (
    <div style={{ backgroundColor: bg, padding }} className="w-full">
      <div className="max-w-xl mx-auto">
        {form?.name && (
          <h3 className="text-lg font-black uppercase tracking-tight mb-1">{form.name}</h3>
        )}
        {form?.description && (
          <p className="text-sm text-neutral-500 mb-6">{form.description}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field: any) => (
            <div key={field.name}>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-widest mb-1.5">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.type === 'textarea' || field.type === 'richtext' ? (
                <textarea
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={e => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none"
                />
              ) : field.type === 'select' ? (
                <select
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={e => handleFieldChange(field.name, e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none"
                >
                  <option value="">{field.placeholder || 'Choisir...'}</option>
                  {(field.options || []).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[field.name] || false}
                    onChange={e => handleFieldChange(field.name, e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-800 bg-black text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-neutral-400">{field.label}</span>
                </label>
              ) : (
                <input
                  type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'number' ? 'number' : 'text'}
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={e => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none"
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
          >
            {submitting ? 'Envoi en cours...' : 'Envoyer'}
          </button>
        </form>
      </div>
    </div>
  )
}

const MapBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const {
    embedUrl = '',
    height = '400px',
    margin = '0',
    padding = '0'
  } = node.props

  if (!embedUrl) {
    return (
      <div style={{ margin, padding }} className="w-full">
        <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-8">
          <p className="text-sm text-blue-900 font-bold mb-3">📍 Pas de carte configurée</p>
          <p className="text-xs text-blue-700 mb-4">Pour ajouter une carte Google Maps:</p>
          <ol className="text-xs text-blue-700 space-y-2 ml-4 list-decimal">
            <li>Ouvrez <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Google Maps</a></li>
            <li>Trouvez votre lieu et cliquez sur "Partager"</li>
            <li>Cliquez sur "Intégrer une carte"</li>
            <li>Copiez l'URL de l'iframe (commençant par <code className="bg-white px-1 rounded">https://www.google.com/maps/embed</code>)</li>
            <li>Collez-la dans les propriétés du bloc à droite</li>
          </ol>
        </div>
      </div>
    )
  }

  // Validation basique: vérifier que c'est une URL embed sécurisée
  const isValidEmbedUrl = embedUrl.includes('google.com/maps/embed') || embedUrl.includes('maps.google.com') || embedUrl.startsWith('https://')

  if (!isValidEmbedUrl) {
    return (
      <div style={{ margin, padding }} className="w-full">
        <div className="bg-red-50 rounded-lg border-2 border-red-200 p-4">
          <p className="text-sm text-red-900 font-bold">⚠️ URL invalide</p>
          <p className="text-xs text-red-700 mt-2">L'URL doit être une URL d'embed (commençant par https://www.google.com/maps/embed)</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ margin, padding }} className="w-full">
      <div style={{ height }} className="w-full rounded-lg overflow-hidden shadow-lg border border-neutral-200">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  )
}

const GalleryBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const {
    images = [],
    columns = 3,
    gap = '24px',
    margin = '0',
    padding = '0'
  } = node.props

  const imageList = Array.isArray(images) ? images : []
  const numCols = parseInt(String(columns)) || 3

  const getGridColsClass = (cols: number) => {
    if (cols === 2) return 'grid-cols-1 md:grid-cols-2'
    if (cols === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    return 'grid-cols-1 md:grid-cols-3'
  }

  return (
    <div style={{ margin, padding }} className="w-full">
      <div className={`grid ${getGridColsClass(numCols)} gap-6 md:gap-8`} style={{ gap }}>
        {imageList.map((img: any, idx: number) => (
          <div key={idx} className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
              <img
                src={img.src || 'https://via.placeholder.com/400x400'}
                alt={img.alt || `Image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
            {img.alt && (
              <p className="mt-3 text-sm font-medium text-neutral-700 line-clamp-2">
                {img.alt}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const CircularGalleryBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const {
    items = [],
    bend = 3,
    textColor = '#ffffff',
    borderRadius = 0.05,
    scrollSpeed = 2,
    scrollEase = 0.05,
    height = '600px',
    bg = '#000000',
    margin = '0',
    padding = '0'
  } = node.props

  // Import CircularGallery dynamically to avoid SSR issues
  const CircularGallery = React.lazy(() => import('../builder/components/CircularGallery').then(m => ({ default: m.default })))

  return (
    <div style={{ backgroundColor: bg, margin, padding }} className="w-full overflow-hidden">
      <div style={{ height, position: 'relative' }} className="w-full">
        <React.Suspense fallback={
          <div className="w-full h-full flex items-center justify-center bg-neutral-900">
            <div className="animate-pulse text-neutral-400 text-sm uppercase tracking-widest">Galerie circulaire en chargement...</div>
          </div>
        }>
          <CircularGallery
            items={Array.isArray(items) && items.length > 0 ? items : undefined}
            bend={Number(bend)}
            textColor={textColor}
            borderRadius={Number(borderRadius)}
            scrollSpeed={Number(scrollSpeed)}
            scrollEase={Number(scrollEase)}
            font="bold 30px Figtree"
          />
        </React.Suspense>
      </div>
    </div>
  )
}

const TableBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const { 
    title = 'Spécifications',
    headers = [],
    rows = [],
    bg = '#ffffff',
    padding = '80px 48px'
  } = node.props

  const headerList = Array.isArray(headers) ? headers : []
  const rowList = Array.isArray(rows) ? rows : []

  return (
    <section style={{ backgroundColor: bg, padding }} className="w-full font-['Inter',sans-serif] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {title && (
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-neutral-900 uppercase tracking-tighter leading-none">
              {title}
            </h2>
            <div className="w-20 h-1.5 bg-red-600 mt-6 rounded-full" />
          </div>
        )}

        <div className="relative">
          {/* Mobile Scroll Hint */}
          <div className="md:hidden flex justify-end mb-4">
            <div className="bg-neutral-900/5 px-4 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Glisser pour voir</span>
              <ArrowRight size={12} className="text-red-500" />
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar rounded-3xl md:rounded-[2.5rem] border border-neutral-100 shadow-2xl shadow-neutral-200/40 bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-neutral-950 to-neutral-900 text-white">
                  {headerList.map((header: any, i: number) => (
                    <th key={i} className="px-6 md:px-12 py-6 md:py-8 text-left text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap border-r border-white/5 last:border-none">
                      {typeof header === 'object' ? (header.value || '-') : header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowList.map((row: any, ri: number) => (
                  <tr 
                    key={ri} 
                    className={`group border-b border-neutral-100 transition-all duration-300 hover:bg-red-50/30 last:border-none relative ${ri % 2 === 0 ? 'bg-white' : 'bg-neutral-50/40'}`}
                  >
                    {(row.cols || []).map((col: any, ci: number) => (
                      <td key={ci} className="px-6 md:px-12 py-6 md:py-8 relative align-middle">
                        {/* Hover Accent Line */}
                        {ci === 0 && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
                        )}
                        
                        <span className={`
                          ${ci === 0 ? 'font-bold text-neutral-900 uppercase tracking-wide text-sm md:text-base' : 'font-medium text-neutral-500 text-sm md:text-base leading-relaxed'}
                          block transition-colors duration-300 group-hover:text-neutral-900
                        `}>
                          {typeof col === 'object' ? (col.value || '-') : col}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ef4444;
        }
      `}</style>
    </section>
  )
}

const StatsBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const {
    items = [],
    columns = 3,
    bg = '#ffffff',
    padding = '80px 48px'
  } = node.props

  const itemList = Array.isArray(items) ? items : []

  const getLightBgColor = (hexColor: string) => {
    if (hexColor && hexColor.startsWith('#')) {
      const cleanHex = hexColor.replace('#', '')
      if (cleanHex.length === 6) {
        const r = parseInt(cleanHex.substring(0, 2), 16)
        const g = parseInt(cleanHex.substring(2, 4), 16)
        const b = parseInt(cleanHex.substring(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, 0.03)`
      } else if (cleanHex.length === 3) {
        const r = parseInt(cleanHex.substring(0, 1).repeat(2), 16)
        const g = parseInt(cleanHex.substring(1, 2).repeat(2), 16)
        const b = parseInt(cleanHex.substring(2, 3).repeat(2), 16)
        return `rgba(${r}, ${g}, ${b}, 0.03)`
      }
    }
    return hexColor ? `${hexColor}0b` : 'rgba(0, 0, 0, 0.02)'
  }

  const getGridColsClass = (cols: number | string) => {
    const num = Number(cols)
    if (num === 1) return 'grid-cols-1'
    if (num === 2) return 'grid-cols-1 md:grid-cols-2'
    if (num === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    return 'grid-cols-1 md:grid-cols-3'
  }

  return (
    <section style={{ backgroundColor: bg, padding }} className="w-full font-['Inter',sans-serif] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className={`grid ${getGridColsClass(columns)} gap-8`}>
          {itemList.map((item: any, i: number) => {
            const cardColor = item.color || '#2563eb'
            const lightBg = getLightBgColor(cardColor)
            return (
              <div 
                key={i} 
                style={{ 
                  borderColor: cardColor, 
                  backgroundColor: lightBg,
                  boxShadow: `0 10px 30px -10px ${cardColor}15`
                }}
                className="flex flex-col justify-between p-8 rounded-[1.8rem] border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div>
                  <span 
                    style={{ color: cardColor }} 
                    className="text-4xl md:text-5xl font-black tracking-tight block mb-4"
                  >
                    {item.number || ''}
                  </span>
                  <p className="text-neutral-900 font-bold text-base md:text-lg leading-snug mb-6">
                    {item.label || ''}
                  </p>
                </div>
                {item.source && (
                  <span className="text-[11px] font-medium tracking-wide uppercase text-neutral-400 mt-auto block pt-4 border-t border-neutral-100">
                    {item.source}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/**
 * Resolve i18n props for a node given a language code.
 * Returns a new props object with translated values merged in.
 */
function resolveI18nProps(node: BlockNode, lang: string): Record<string, any> {
  if (!node.props?.i18n?.[lang]) return node.props
  const translations = node.props.i18n[lang]
  return { ...node.props, ...translations }
}

const BlockRenderer: React.FC<{ node: BlockNode; mode?: 'edit' | 'preview'; lang?: string }> = ({ node, mode = 'edit', lang }) => {
  const selectBlock = useBuilderStore((state) => state.selectBlock)
  const deleteBlock = useBuilderStore((state) => state.deleteBlock)
  const selectedId = useBuilderStore((state) => state.selectedId)
  const storeLang = useBuilderStore((state) => state.currentLang)

  const activeLang = lang || storeLang
  const isEdit = mode === 'edit'
  const localizedNode = isEdit ? node : { ...node, props: resolveI18nProps(node, activeLang) }

  const COMPONENTS: Record<string, React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }>> = {
    heading: (props) => <HeadingBlock {...props} />,
    text: (props) => <TextBlock {...props} />,
    image: (props) => <ImageBlock {...props} />,
    button: (props) => <ButtonBlock {...props} />,
    section: (props) => <SectionBlock {...props} />,
    columns: (props) => <ColumnsBlock {...props} />,
    banner: (props) => <BannerBlock {...props} />,
    hero: (props) => <HeroBlock {...props} />,
    about: (props) => <AboutBlock {...props} />,
    features: (props) => <FeaturesBlock {...props} />,
    cta_split: (props) => <CtaSplitBlock {...props} />,
    contact_banner: (props) => <ContactBannerBlock {...props} />,
    innovation: (props) => <InnovationBlock {...props} />,
    quality: (props) => <QualityBlock {...props} />,
    lab: (props) => <LabBlock {...props} />,
    header: (props) => <HeaderBlock {...props} />,
    footer: (props) => <FooterBlock {...props} />,
    news: (props) => <NewsBlock {...props} />,
    faq: (props) => <FAQBlock {...props} />,
    contact: (props) => <ContactBlock {...props} />,
    mission_vision: (props) => <MissionVisionBlock {...props} />,
    table: (props) => <TableBlock {...props} />,
    globalComponent: (props) => <GlobalComponentBlock {...props} />,
	    form: (props) => <FormBlock {...props} />,
    gallery: (props) => <GalleryBlock {...props} />,
    map: (props) => <MapBlock {...props} />,
    circular_gallery: (props) => <CircularGalleryBlock {...props} />,
    stats: (props) => <StatsBlock {...props} />,
  }

  const Component = COMPONENTS[node.type]

  if (!Component) return <div className="text-red-500 text-xs p-2">Bloc inconnu : {node.type}</div>

  return (
    <div
      onClick={(e) => {
        if (!isEdit) return
        e.stopPropagation()
        selectBlock(localizedNode.id)
      }}
      className={`relative transition-all ${
        isEdit
          ? `cursor-pointer group rounded ${selectedId === localizedNode.id ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:ring-1 hover:ring-blue-300'}`
          : ''
      }`}
    >
      {/* Delete Button Overlay */}
      {isEdit && (
        <div className={`absolute -right-2 -top-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity ${selectedId === localizedNode.id ? 'opacity-100' : ''}`}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteBlock(localizedNode.id)
            }}
            className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg border border-red-700 transition-colors"
            title="Supprimer ce bloc"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      <Component node={localizedNode} mode={mode} />
    </div>
  )
}

export default BlockRenderer


