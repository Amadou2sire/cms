import React from 'react'
import { type BlockNode } from './store/builderStore'
import { useBuilderStore } from './store/builderStore'
import { useDroppable } from '@dnd-kit/core'
import { Trash2, ChevronDown, Menu as MenuIcon, X, Monitor, Layers, Activity, Shield, Settings, Cpu } from 'lucide-react'

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
    text = 'Nouveau titre', 
    level = 1, 
    color = '#000000', 
    align = 'left', 
    weight = '700',
    lineHeight = '1.2',
    letterSpacing = '0px',
    margin = '0', 
    padding = '0' 
  } = node.props
  const Tag = `h${level}` as any
  return (
    <div style={{ margin, padding }}>
      <Tag style={{ 
        color, 
        textAlign: align as any, 
        fontWeight: weight,
        lineHeight: lineHeight,
        letterSpacing: letterSpacing,
        margin: 0,
        wordBreak: 'break-word'
      }} className="text-dynamic-heading">
        {text}
      </Tag>
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
    overlayOpacity = '0.6',
    title = 'Titre Hero',
    subtitle = 'Sous-titre',
    description = '',
    primaryBtnText = 'Bouton 1',
    primaryBtnHref = '#',
    secondaryBtnText = 'Bouton 2',
    secondaryBtnHref = '#',
    height = '80vh',
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
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: height,
        padding: '5% 10%'
      }}
    >
      <div 
        className="absolute inset-0 bg-black z-0" 
        style={{ opacity: parseFloat(overlayOpacity) }}
      />
      
      <div className="relative z-10 max-w-4xl space-y-6">
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

const HeaderBlock: React.FC<{ node: BlockNode; mode: 'edit' | 'preview' }> = ({ node }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const { 
    logo = '', 
    logoHeight = '40px', 
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
          href={item.href} 
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
          href={item.href} 
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
      style={{ backgroundColor: bg, position: sticky === 'true' ? 'sticky' : 'relative', top: 0, zIndex: 100 }}
      className="w-full shadow-sm"
    >
      <div 
        style={{ padding }}
        className="flex items-center justify-between mx-auto"
      >
        <div className="flex items-center gap-12">
          <a href="/" className="hover:opacity-80 transition-opacity">
            <img src={logo} alt="Logo" style={{ height: logoHeight }} className="max-w-[150px] object-contain" />
          </a>
          
          <nav className="hidden lg:flex items-center gap-4">
            {menuItems.map((item: any) => renderMenuItem(item))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {buttonLabel && (
            <a 
              href={buttonHref}
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
              <img src={logo} alt="Logo" style={{ height: '30px' }} />
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
                  href={buttonHref}
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
          
          {columns.map((col: any, idx: number) => (
            <div key={idx} className="space-y-6">
              <h5 className="font-bold uppercase tracking-widest text-xs opacity-40">{col.title || 'Section'}</h5>
              <ul className="space-y-4">
                {(col.links || col.children || []).map((link: any, lIdx: number) => (
                  <li key={lIdx}>
                    <a href={link.href} className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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

// --- Registry ---

// --- Wrapper with selection outline ---

const BlockRenderer: React.FC<{ node: BlockNode; mode?: 'edit' | 'preview' }> = ({ node, mode = 'edit' }) => {
  const selectBlock = useBuilderStore((state) => state.selectBlock)
  const deleteBlock = useBuilderStore((state) => state.deleteBlock)
  const selectedId = useBuilderStore((state) => state.selectedId)
  
  const isEdit = mode === 'edit'

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
  }

  const Component = COMPONENTS[node.type]

  if (!Component) return <div className="text-red-500 text-xs p-2">Bloc inconnu : {node.type}</div>

  return (
    <div
      onClick={(e) => {
        if (!isEdit) return
        e.stopPropagation()
        selectBlock(node.id)
      }}
      className={`relative transition-all ${
        isEdit 
          ? `cursor-pointer group rounded ${selectedId === node.id ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:ring-1 hover:ring-blue-300'}`
          : ''
      }`}
    >
      {/* Delete Button Overlay */}
      {isEdit && (
        <div className={`absolute -right-2 -top-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity ${selectedId === node.id ? 'opacity-100' : ''}`}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteBlock(node.id)
            }}
            className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg border border-red-700 transition-colors"
            title="Supprimer ce bloc"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      <Component node={node} mode={mode} />
    </div>
  )
}

export default BlockRenderer
