export type PropType = 'string' | 'number' | 'color' | 'select' | 'richtext' | 'media' | 'spacing' | 'menu' | 'list'
export interface PropDefinition {
  type: PropType
  label: string
  default: any
  options?: string[]
  itemSchema?: Record<string, Omit<PropDefinition, 'itemSchema'>>
}

export interface BlockDefinition {
  type: string
  label: string
  icon: string
  defaultProps: Record<string, any>
  propSchema: Record<string, PropDefinition>
  canHaveChildren: boolean
}

export const BLOCK_REGISTRY: Record<string, BlockDefinition> = {
  heading: {
    type: 'heading',
    label: 'Titre',
    icon: 'Heading',
    canHaveChildren: false,
    defaultProps: { 
      text: 'Nouveau titre', 
      level: 1, 
      color: '#111111', 
      align: 'left',
      margin: '0px 0px 0px 0px',
      padding: '0px 0px 0px 0px'
    },
    propSchema: {
      text:  { type: 'string', label: 'Texte', default: 'Nouveau titre' },
      level: { type: 'select', label: 'Niveau', default: 1, options: ['1','2','3','4','5','6'] },
      color: { type: 'color',  label: 'Couleur', default: '#111111' },
      align: { type: 'select', label: 'Alignement', default: 'left', options: ['left','center','right'] },
      weight: { type: 'select', label: 'Graisse', default: '700', options: ['300','400','500','600','700','800','900'] },
      lineHeight: { type: 'select', label: 'Interligne', default: '1.2', options: ['1','1.2','1.4','1.6'] },
      letterSpacing: { type: 'select', label: 'Espacement lettres', default: '0px', options: ['-2px','-1px','0px','1px','2px','4px'] },
      margin: { type: 'spacing', label: 'Marges (T R B L)', default: '0px 0px 0px 0px' },
      padding: { type: 'spacing', label: 'Padding (T R B L)', default: '0px 0px 0px 0px' },
    }
  },
  text: {
    type: 'text',
    label: 'Texte',
    icon: 'AlignLeft',
    canHaveChildren: false,
    defaultProps: { 
      content: 'Votre texte ici...', 
      color: '#333333', 
      fontSize: '16px', 
      align: 'left',
      margin: '0px 0px 0px 0px',
      padding: '0px 0px 0px 0px'
    },
    propSchema: {
      content:  { type: 'richtext', label: 'Contenu', default: '' },
      color:    { type: 'color',    label: 'Couleur', default: '#333333' },
      fontSize: { type: 'select',   label: 'Taille', default: '16px', options: ['12px','14px','16px','18px','20px','24px','32px'] },
      align:    { type: 'select',   label: 'Alignement', default: 'left', options: ['left','center','right','justify'] },
      weight:   { type: 'select',   label: 'Graisse', default: '400', options: ['300','400','500','600','700'] },
      lineHeight: { type: 'select', label: 'Interligne', default: '1.6', options: ['1.2','1.4','1.6','1.8','2'] },
      margin: { type: 'spacing', label: 'Marges (T R B L)', default: '0px 0px 0px 0px' },
      padding: { type: 'spacing', label: 'Padding (T R B L)', default: '0px 0px 0px 0px' },
    }
  },
  image: {
    type: 'image',
    label: 'Image',
    icon: 'Image',
    canHaveChildren: false,
    defaultProps: { 
      src: '', 
      alt: '', 
      width: '100%', 
      borderRadius: '0px',
      margin: '0px 0px 0px 0px',
      padding: '0px 0px 0px 0px'
    },
    propSchema: {
      src:          { type: 'media',  label: 'Source', default: '' },
      alt:          { type: 'string', label: 'Alt text', default: '' },
      width:        { type: 'select', label: 'Largeur', default: '100%', options: ['25%','50%','75%','100%'] },
      borderRadius: { type: 'select', label: 'Arrondi', default: '0px', options: ['0px','4px','8px','16px','50%'] },
      margin: { type: 'spacing', label: 'Marges (T R B L)', default: '0px 0px 0px 0px' },
      padding: { type: 'spacing', label: 'Padding (T R B L)', default: '0px 0px 0px 0px' },
    }
  },
  button: {
    type: 'button',
    label: 'Bouton',
    icon: 'MousePointerClick',
    canHaveChildren: false,
    defaultProps: { 
      label: 'Cliquer ici', 
      href: '#', 
      variant: 'primary', 
      color: '#ffffff', 
      bg: '#0070f3',
      margin: '0px 0px 0px 0px',
      padding: '10px 20px 10px 20px'
    },
    propSchema: {
      label:   { type: 'string', label: 'Texte', default: 'Cliquer ici' },
      href:    { type: 'string', label: 'Lien', default: '#' },
      variant: { type: 'select', label: 'Style', default: 'primary', options: ['primary','secondary','ghost'] },
      color:   { type: 'color',  label: 'Couleur texte', default: '#ffffff' },
      bg:      { type: 'color',  label: 'Fond', default: '#0070f3' },
      margin: { type: 'spacing', label: 'Marges (T R B L)', default: '0px 0px 0px 0px' },
      padding: { type: 'spacing', label: 'Padding (T R B L)', default: '10px 20px 10px 20px' },
    }
  },
  section: {
    type: 'section',
    label: 'Section',
    icon: 'Square',
    canHaveChildren: true,
    defaultProps: { 
      bg: '#ffffff', 
      maxWidth: '100%', 
      direction: 'column',
      margin: '0px 0px 0px 0px',
      padding: '48px 48px 48px 48px'
    },
    propSchema: {
      bg:        { type: 'color',  label: 'Fond', default: '#ffffff' },
      maxWidth:  { type: 'select', label: 'Largeur max', default: '100%', options: ['640px','768px','1024px','1200px','1440px','100%'] },
      direction: { type: 'select', label: 'Direction', default: 'column', options: ['column','row'] },
      margin: { type: 'spacing', label: 'Marges (T R B L)', default: '0px 0px 0px 0px' },
      padding: { type: 'spacing', label: 'Padding (T R B L)', default: '48px 48px 48px 48px' },
    }
  },
  columns: {
    type: 'columns',
    label: 'Colonnes',
    icon: 'Columns',
    canHaveChildren: true,
    defaultProps: { 
      count: 2, 
      gap: '48px',
      alignItems: 'center',
      margin: '0px 0px 0px 0px',
      padding: '0px 0px 0px 0px'
    },
    propSchema: {
      count: { type: 'select', label: 'Nombre de colonnes', default: 2, options: ['2','3','4'] },
      gap:   { type: 'select', label: 'Espacement', default: '48px', options: ['8px','16px','24px','32px','48px','64px'] },
      alignItems: { type: 'select', label: 'Alignement vertical', default: 'center', options: ['flex-start', 'center', 'flex-end'] },
      margin: { type: 'spacing', label: 'Marges (T R B L)', default: '0px 0px 0px 0px' },
      padding: { type: 'spacing', label: 'Padding (T R B L)', default: '0px 0px 0px 0px' },
    }
  },
  banner: {
    type: 'banner',
    label: 'Bannière',
    icon: 'MonitorPlay',
    canHaveChildren: true,
    defaultProps: { 
      bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072', 
      overlayColor: '#000000', 
      overlayOpacity: '0.6', 
      height: '100vh',
      justify: 'center'
    },
    propSchema: {
      bgImage: { type: 'media', label: 'Image de fond', default: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072' },
      overlayColor: { type: 'color', label: 'Couleur calque', default: '#000000' },
      overlayOpacity: { type: 'select', label: 'Opacité calque', default: '0.6', options: ['0', '0.2', '0.4', '0.6', '0.8', '0.9'] },
      height: { type: 'select', label: 'Hauteur', default: '100vh', options: ['300px', '400px', '500px', '600px', '800px', '100vh'] },
      justify: { type: 'select', label: 'Alignement vertical', default: 'center', options: ['flex-start', 'center', 'flex-end'] },
      margin: { type: 'spacing', label: 'Marges (T R B L)', default: '0px 0px 0px 0px' },
      padding: { type: 'spacing', label: 'Padding (T R B L)', default: '0px 0px 0px 0px' },
    }
  },
  hero: {
    type: 'hero',
    label: 'Hero Section',
    icon: 'LayoutTemplate',
    canHaveChildren: false,
    defaultProps: {
      bgImage: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070',
      overlayOpacity: '0.6',
      title: 'Fonderie de précision',
      subtitle: 'Fonte & Aluminium — 100% export',
      description: 'Depuis 1976, Fondinor conçoit et produit des pièces de fonderie de haute qualité pour l’automobile, l’hydraulique et l’industrie.',
      primaryBtnText: 'Découvrir nos produits',
      primaryBtnHref: '#',
      secondaryBtnText: 'Nous contacter',
      secondaryBtnHref: '#',
      height: '80vh',
      textAlign: 'left'
    },
    propSchema: {
      bgImage: { type: 'media', label: 'Image de fond', default: '' },
      overlayOpacity: { type: 'select', label: 'Opacité calque', default: '0.6', options: ['0.2', '0.4', '0.6', '0.8'] },
      title: { type: 'string', label: 'Titre Principal', default: 'Titre Hero' },
      subtitle: { type: 'string', label: 'Sous-titre (Rouge)', default: 'Sous-titre' },
      description: { type: 'richtext', label: 'Description', default: '' },
      primaryBtnText: { type: 'string', label: 'Bouton Principal', default: 'Bouton 1' },
      primaryBtnHref: { type: 'string', label: 'Lien Bouton 1', default: '#' },
      secondaryBtnText: { type: 'string', label: 'Bouton Secondaire', default: 'Bouton 2' },
      secondaryBtnHref: { type: 'string', label: 'Lien Bouton 2', default: '#' },
      height: { type: 'select', label: 'Hauteur', default: '80vh', options: ['60vh', '70vh', '80vh', '90vh', '100vh'] },
      textAlign: { type: 'select', label: 'Alignement', default: 'left', options: ['left', 'center', 'right'] }
    }
  },
  about: {
    type: 'about',
    label: 'Section À Propos',
    icon: 'Info',
    canHaveChildren: false,
    defaultProps: {
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070',
      accentText: 'QUI SOMMES-NOUS?',
      title: 'Un Pilier Industriel du <span style="color: #e5482d">Groupe Mokhtar</span>.',
      description: 'Située au cœur de la zone industrielle, Fondinor est l’un des fleurons de la fonderie moderne. Notre mission est de fournir des solutions de fonderie et d’usinage haute performance pour les industries les plus exigeantes.',
      linkText: 'En savoir plus sur notre histoire',
      linkHref: '#',
      badgeText: '25+',
      badgeSub: "ANS D'EXPERTISE",
      reverse: false
    },
    propSchema: {
      image: { type: 'media', label: 'Image', default: '' },
      accentText: { type: 'string', label: 'Texte Accent (Rouge)', default: 'QUI SOMMES-NOUS?' },
      title: { type: 'richtext', label: 'Titre Principal', default: '' },
      description: { type: 'richtext', label: 'Description', default: '' },
      linkText: { type: 'string', label: 'Texte Lien', default: 'En savoir plus' },
      linkHref: { type: 'string', label: 'Lien', default: '#' },
      badgeText: { type: 'string', label: 'Chiffre Badge', default: '25+' },
      badgeSub: { type: 'string', label: 'Texte Badge', default: "ANS D'EXPERTISE" },
      reverse: { type: 'select', label: 'Inverser', default: 'false', options: ['true', 'false'] }
    }
  },
  features: {
    type: 'features',
    label: 'Grille d\'Excellence',
    icon: 'LayoutGrid',
    canHaveChildren: false,
    defaultProps: {
      accentText: 'NOS PÔLES D’EXCELLENCE',
      title: 'Maîtrise des Alliages & Procédés',
      items: [
        {
          title: 'Fonderie de Fonte',
          description: 'Production de pièces en fonte à graphite sphéroïdal (FGS) et fonte à graphite lamellaire (FGL) pour l’automobile et l’hydraulique.',
          image: 'https://images.unsplash.com/photo-1534312527009-56c7016453e6?q=80&w=2070',
          tags: ['CAPACITÉ 10,000T/AN', 'FONTE FGS/FGL']
        },
        {
          title: 'Fonderie Aluminium',
          description: 'Moulage sous pression et en coquille gravité pour des composants légers et structurels de haute précision.',
          image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2069',
          tags: ['EXPLORER']
        }
      ],
      columns: 2
    },
    propSchema: {
      accentText: { type: 'string', label: 'Texte Accent (Rouge)', default: 'NOS PÔLES D’EXCELLENCE' },
      title: { type: 'string', label: 'Titre Section', default: 'Titre de la grille' },
      items: { 
        type: 'list', 
        label: 'Cartes d\'Excellence', 
        default: [],
        itemSchema: {
          image: { type: 'media', label: 'Image de fond', default: '' },
          title: { type: 'string', label: 'Titre', default: 'Titre' },
          description: { type: 'richtext', label: 'Description', default: '' },
          tags: { type: 'string', label: 'Tags (séparés par des virgules)', default: '' }
        }
      },
      columns: { type: 'select', label: 'Colonnes', default: 2, options: ['2', '3', '4'] }
    }
  },
  cta_split: {
    type: 'cta_split',
    label: 'Section Bureau d’Études',
    icon: 'Component',
    canHaveChildren: false,
    defaultProps: {
      accentText: 'BUREAU D’ÉTUDES & SIMULATION',
      title: 'Optimisez vos conceptions avant la <span style="color: #e5482d">coulée</span>.',
      description: 'Grâce à nos logiciels de simulation de pointe (ProCAST/Magma), nous anticipons les défauts de fonderie et optimisons le design de vos pièces.',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=2026',
      points: 'Analyse thermique et solidification, Modélisation 3D avancée, Prototypage rapide',
      bg: '#0a0a0a',
      reverse: false
    },
    propSchema: {
      accentText: { type: 'string', label: 'Texte Accent', default: 'BUREAU D’ÉTUDES' },
      title: { type: 'richtext', label: 'Titre Principal', default: '' },
      description: { type: 'richtext', label: 'Description', default: '' },
      image: { type: 'media', label: 'Image latérale', default: '' },
      points: { type: 'string', label: 'Points clés (séparés par des virgules)', default: '' },
      bg: { type: 'color', label: 'Fond Section', default: '#0a0a0a' },
      reverse: { type: 'select', label: 'Inverser', default: 'false', options: ['true', 'false'] }
    }
  },
  contact_banner: {
    type: 'contact_banner',
    label: 'Bannière de Contact',
    icon: 'MessageSquare',
    canHaveChildren: false,
    defaultProps: {
      title: 'Besoin d’une pièce sur-mesure ?',
      description: 'Consultez notre catalogue technique complet ou demandez une étude personnalisée par nos ingénieurs.',
      btn1Text: 'CATALOGUE PDF',
      btn1Href: '#',
      btn2Text: 'DEVIS PERSONNALISÉ',
      btn2Href: '#',
      bg: '#141414'
    },
    propSchema: {
      title: { type: 'string', label: 'Titre', default: 'Titre' },
      description: { type: 'string', label: 'Description', default: '' },
      btn1Text: { type: 'string', label: 'Bouton 1 (Blanc)', default: 'Bouton 1' },
      btn1Href: { type: 'string', label: 'Lien Bouton 1', default: '#' },
      btn2Text: { type: 'string', label: 'Bouton 2 (Rouge)', default: 'Bouton 2' },
      btn2Href: { type: 'string', label: 'Lien Bouton 2', default: '#' },
      bg: { type: 'color', label: 'Fond', default: '#141414' }
    }
  },
  innovation: {
    type: 'innovation',
    label: 'Section Innovation',
    icon: 'Cpu',
    canHaveChildren: false,
    defaultProps: {
      accentText: 'PÔLE INNOVATION',
      title: 'Bureau d’Ingénierie Intégré',
      image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=2070',
      badgeValue: '-0.02mm',
      badgeLabel: 'TOLÉRANCE MAXIMALE GARANTIE',
      items: [
        {
          icon: 'Monitor',
          title: 'MAGMASoft Simulation',
          description: 'Simulation avancée de remplissage et de solidification pour éliminer les défauts avant la production.'
        },
        {
          icon: 'Layers',
          title: 'CAD-CAM Solutions',
          description: 'Intégration fluide de la conception à la fabrication avec des environnements de modélisation 3D haute fidélité.'
        }
      ],
      reverse: false
    },
    propSchema: {
      accentText: { type: 'string', label: 'Texte Accent (Rouge)', default: 'INNOVATION' },
      title: { type: 'string', label: 'Titre Section', default: 'Titre' },
      image: { type: 'media', label: 'Image Principale', default: '' },
      badgeValue: { type: 'string', label: 'Valeur Badge (Blanc)', default: '-0.02mm' },
      badgeLabel: { type: 'string', label: 'Libellé Badge', default: 'TOLÉRANCE GARANTIE' },
      items: {
        type: 'list',
        label: 'Services / Points',
        default: [],
        itemSchema: {
          icon: { type: 'media', label: 'Icône (Image)', default: '' },
          title: { type: 'string', label: 'Titre', default: 'Service' },
          description: { type: 'richtext', label: 'Description', default: '' }
        }
      },
      reverse: { type: 'select', label: 'Inverser', default: 'false', options: ['true', 'false'] }
    }
  },
  quality: {
    type: 'quality',
    label: 'Section Qualité',
    icon: 'ShieldCheck',
    canHaveChildren: false,
    defaultProps: {
      title: 'QUALITÉ & CERTIFICATION',
      subtitle: '"La qualité n’est pas un acte, c’est une habitude industrielle."',
      items: [
        {
          icon: '',
          tag: 'CERTIFIED',
          title: 'IATF 16949',
          description: 'Standard mondial pour la gestion de la qualité automobile. Fondinor assure une traçabilité totale.'
        },
        {
          icon: '',
          tag: 'NON-DESTRUCTIVE',
          title: 'Radioscopie X-Ray',
          description: 'Contrôle interne non destructif pour détecter les inclusions et porosités invisibles.'
        },
        {
          icon: '',
          tag: 'PRECISION',
          title: 'Contrôle 3D',
          description: 'Mesure tridimensionnelle par scan laser et palpage pour valider la conformité géométrique.'
        }
      ]
    },
    propSchema: {
      title: { type: 'string', label: 'Titre Section', default: 'QUALITÉ' },
      subtitle: { type: 'string', label: 'Sous-titre / Citation', default: '' },
      items: {
        type: 'list',
        label: 'Certifications / Contrôles',
        default: [],
        itemSchema: {
          icon: { type: 'media', label: 'Icône', default: '' },
          tag: { type: 'string', label: 'Petit Badge (Rouge)', default: '' },
          title: { type: 'string', label: 'Titre', default: '' },
          description: { type: 'richtext', label: 'Description', default: '' }
        }
      }
    }
  },
  lab: {
    type: 'lab',
    label: 'Section Laboratoire',
    icon: 'Microscope',
    canHaveChildren: false,
    defaultProps: {
      title: 'Métallurgie de pointe',
      description: 'Notre laboratoire interne est équipé des dernières technologies d’analyse physico-chimique pour garantir que chaque alliage coulé répond aux spécifications les plus strictes.',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=2080',
      items: [
        { label: 'DURETÉ', value: 'Brinell / Rockwell' },
        { label: 'ANALYSE', value: 'Spectrométrie' },
        { label: 'STRUCTURE', value: 'Micrographie' },
        { label: 'RÉSISTANCE', value: 'Essais Traction' }
      ],
      reverse: false
    },
    propSchema: {
      title: { type: 'string', label: 'Titre Section', default: 'Laboratoire' },
      items: {
        type: 'list',
        label: 'Points d\'expertise',
        default: [],
        itemSchema: {
          label: { type: 'string', label: 'Catégorie (Rouge)', default: 'TYPE' },
          value: { type: 'string', label: 'Valeur', default: 'Détail' }
        }
      },
      description: { type: 'richtext', label: 'Description Footer', default: '' },
      image: { type: 'media', label: 'Image latérale', default: '' },
      reverse: { type: 'select', label: 'Inverser', default: 'false', options: ['true', 'false'] }
    }
  },
  header: {
    type: 'header',
    label: 'En-tête (Header)',
    icon: 'PanelTop',
    canHaveChildren: false,
    defaultProps: {
      logo: 'https://via.placeholder.com/150x50?text=LOGO',
      logoHeight: '40px',
      bg: '#ffffff',
      textColor: '#000000',
      btnBg: '#2563eb',
      btnColor: '#ffffff',
      sticky: true,
      menuItems: [
        { label: 'Accueil', href: '/', children: [] },
        { 
          label: 'Services', 
          href: '/services', 
          children: [
            { 
              label: 'Design', 
              href: '/design', 
              children: [
                { label: 'Web Design', href: '/web-design' },
                { label: 'UI/UX', href: '/ui-ux' }
              ] 
            },
            { label: 'Développement', href: '/dev' }
          ] 
        },
        { label: 'Contact', href: '/contact', children: [] }
      ],
      buttonLabel: 'Démarrer',
      buttonHref: '/start',
      padding: '16px 48px 16px 48px'
    },
    propSchema: {
      logo: { type: 'media', label: 'Logo', default: '' },
      logoHeight: { type: 'string', label: 'Hauteur Logo', default: '40px' },
      bg: { type: 'color', label: 'Fond', default: '#ffffff' },
      textColor: { type: 'color', label: 'Couleur Menu', default: '#000000' },
      btnBg: { type: 'color', label: 'Fond Bouton', default: '#2563eb' },
      btnColor: { type: 'color', label: 'Texte Bouton', default: '#ffffff' },
      sticky: { type: 'select', label: 'Collant', default: true, options: ['true', 'false'] },
      menuItems: { type: 'menu', label: 'Menu (3 niveaux)', default: [] },
      buttonLabel: { type: 'string', label: 'Texte Bouton', default: 'Démarrer' },
      buttonHref: { type: 'string', label: 'Lien Bouton', default: '/start' },
      padding: { type: 'spacing', label: 'Padding (T R B L)', default: '16px 48px 16px 48px' }
    }
  },
  footer: {
    type: 'footer',
    label: 'Pied de page (Footer)',
    icon: 'PanelBottom',
    canHaveChildren: false,
    defaultProps: {
      logo: '',
      bg: '#111111',
      textColor: '#ffffff',
      copyright: '© 2024 Votre Entreprise. Tous droits réservés.',
      columns: [
        {
          title: 'Produits',
          links: [
            { label: 'Lien 1', href: '#' },
            { label: 'Lien 2', href: '#' }
          ]
        },
        {
          title: 'Société',
          links: [
            { label: 'À propos', href: '#' },
            { label: 'Contact', href: '#' }
          ]
        }
      ],
      socials: [
        { platform: 'facebook', href: '#' },
        { platform: 'linkedin', href: '#' }
      ],
      padding: '64px 48px 32px 48px'
    },
    propSchema: {
      logo: { type: 'media', label: 'Logo', default: '' },
      bg: { type: 'color', label: 'Fond', default: '#111111' },
      textColor: { type: 'color', label: 'Couleur Texte', default: '#ffffff' },
      copyright: { type: 'string', label: 'Copyright', default: '' },
      columns: { type: 'menu', label: 'Colonnes de liens', default: [] },
      padding: { type: 'spacing', label: 'Padding (T R B L)', default: '64px 48px 32px 48px' }
    }
  }
};
