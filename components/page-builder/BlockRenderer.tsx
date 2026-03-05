import FeaturedProductsSlider from '@/components/FeaturedProductsSlider'
import PumpCalculator from '@/components/PumpCalculator'
import ContactForm from '@/components/ContactForm'
import type { Section, ContentBlock, HeadingBlock, TextBlock, ImageBlock, ButtonBlock, VideoBlock, DividerBlock, SpacerBlock, SliderBlock } from './types'

// ─── Video URL parser ──────────────────────────────────────────────────────

function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

// ─── Padding helper ────────────────────────────────────────────────────────

function getPadding(size: string, custom?: number): { paddingTop?: string; paddingBottom?: string } {
  switch (size) {
    case 'small':  return {}  // handled by className
    case 'medium': return {}
    case 'large':  return {}
    case 'custom': return { paddingTop: `${custom ?? 0}px`, paddingBottom: `${custom ?? 0}px` }
    default: return {}
  }
}

const PAD_TOP: Record<string, string> = {
  small: 'pt-4', medium: 'pt-12', large: 'pt-24', custom: '',
}
const PAD_BOT: Record<string, string> = {
  small: 'pb-4', medium: 'pb-12', large: 'pb-24', custom: '',
}

// ─── Single block renderer ─────────────────────────────────────────────────

function RenderBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading': {
      const b = block as HeadingBlock
      const Tag = b.level as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      const alignClass = b.alignment === 'center' ? 'text-center' : b.alignment === 'right' ? 'text-right' : 'text-left'
      const weightClass = ['h1','h2'].includes(b.level) ? 'font-bold' : 'font-semibold'
      const sizeClass = b.custom_size ? '' : {
        h1: 'text-4xl',
        h2: 'text-3xl',
        h3: 'text-2xl',
        h4: 'text-xl',
        h5: 'text-lg',
        h6: 'text-base',
      }[b.level]
      const style: React.CSSProperties = { color: b.color }
      if (b.custom_size) style.fontSize = `${b.custom_size}${b.custom_unit ?? 'px'}`
      return (
        <Tag className={`${sizeClass} ${weightClass} leading-tight ${alignClass}`} style={style}>
          {b.text}
        </Tag>
      )
    }
    case 'text': {
      const b = block as TextBlock
      const alignClass = b.alignment === 'center' ? 'text-center' : b.alignment === 'right' ? 'text-right' : 'text-left'
      const isHtml = /<[a-z][\s\S]*>/i.test(b.content)
      if (isHtml) {
        return (
          <div
            className={`text-[16px] leading-relaxed ${alignClass}
              [&_b]:font-bold [&_strong]:font-bold
              [&_i]:italic [&_em]:italic
              [&_a]:text-[#003366] [&_a]:underline [&_a:hover]:text-[#01a0dc]
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
              [&_li]:my-0.5`}
            style={{ color: b.color }}
            dangerouslySetInnerHTML={{ __html: b.content }}
          />
        )
      }
      return (
        <p className={`text-[16px] leading-relaxed whitespace-pre-line ${alignClass}`} style={{ color: b.color }}>
          {b.content}
        </p>
      )
    }
    case 'image': {
      const b = block as ImageBlock
      const img = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={b.url}
          alt={b.alt}
          className="w-full h-auto rounded"
          style={{ objectFit: b.object_fit }}
        />
      )
      if (b.link_url) {
        return (
          <a href={b.link_url} target={b.link_target} rel={b.link_target === '_blank' ? 'noopener noreferrer' : undefined}>
            {img}
          </a>
        )
      }
      return img
    }
    case 'button': {
      const b = block as ButtonBlock
      const alignClass = b.alignment === 'center' ? 'text-center' : b.alignment === 'right' ? 'text-right' : 'text-left'
      let btnCls = 'inline-block px-6 py-3 rounded-xl font-semibold text-[15px] transition-opacity hover:opacity-80'
      if (b.style === 'filled') {
        btnCls += ' text-white'
      } else if (b.style === 'outline') {
        btnCls += ' bg-transparent border-2'
      } else {
        btnCls += ' bg-transparent underline'
      }
      const btnStyle: React.CSSProperties =
        b.style === 'filled'
          ? { backgroundColor: b.color }
          : b.style === 'outline'
          ? { color: b.color, borderColor: b.color }
          : { color: b.color }
      return (
        <div className={alignClass}>
          <a href={b.url} target={b.target} rel={b.target === '_blank' ? 'noopener noreferrer' : undefined}
             className={btnCls} style={btnStyle}>
            {b.text}
          </a>
        </div>
      )
    }
    case 'video': {
      const b = block as VideoBlock
      const embed = getEmbedUrl(b.url)
      if (!embed) return null
      const alignClass = b.alignment === 'center' ? 'mx-auto' : b.alignment === 'right' ? 'ml-auto' : ''
      return (
        <div className={`w-full max-w-2xl ${alignClass}`}>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embed}
              className="absolute inset-0 w-full h-full rounded-xl"
              allowFullScreen
              title="Video"
            />
          </div>
        </div>
      )
    }
    case 'divider': {
      const b = block as DividerBlock
      return <hr style={{ borderColor: b.color, borderTopWidth: b.thickness }} className="border-0 border-t" />
    }
    case 'spacer': {
      const b = block as SpacerBlock
      return <div style={{ height: b.height }} />
    }
    case 'slider':
      return <FeaturedProductsSlider />
    case 'calculator':
      return <PumpCalculator />
    case 'contact_form':
      return <ContactForm />
    default:
      return null
  }
}

// ─── Section renderer ──────────────────────────────────────────────────────

function RenderSection({ section }: { section: Section }) {
  const { settings, columns } = section
  const isBoxed = settings.width === 'boxed'

  const sectionStyle: React.CSSProperties = {}
  if (settings.background_type === 'color') {
    sectionStyle.backgroundColor = settings.background_color
  } else if (settings.background_image_url) {
    sectionStyle.backgroundImage = `url(${settings.background_image_url})`
    sectionStyle.backgroundSize = 'cover'
    sectionStyle.backgroundPosition = 'center'
    sectionStyle.position = 'relative'
  }

  const ptClass = PAD_TOP[settings.padding_top] ?? ''
  const pbClass = PAD_BOT[settings.padding_bottom] ?? ''
  const ptStyle = settings.padding_top === 'custom' ? settings.padding_top_custom ?? 0 : undefined
  const pbStyle = settings.padding_bottom === 'custom' ? settings.padding_bottom_custom ?? 0 : undefined

  const paddingStyle: React.CSSProperties = {}
  if (ptStyle !== undefined) paddingStyle.paddingTop = `${ptStyle}px`
  if (pbStyle !== undefined) paddingStyle.paddingBottom = `${pbStyle}px`

  const colAlignMap: Record<string, string> = { top: 'start', center: 'center', bottom: 'end' }

  const inner = (
    <div
      className={`grid gap-6 md:gap-8 ${ptClass} ${pbClass}`}
      style={{
        gridTemplateColumns: columns.map(c => `${c.width}fr`).join(' '),
        ...paddingStyle,
      }}
    >
      {columns.map(col => (
        <div
          key={col.id}
          className="flex flex-col gap-4 min-w-0"
          style={{ alignItems: 'stretch', justifyContent: colAlignMap[col.vertical_align] ?? 'start' }}
        >
          {col.blocks.map(block => (
            <RenderBlock key={block.id} block={block} />
          ))}
        </div>
      ))}
    </div>
  )

  return (
    <section style={sectionStyle} className="w-full">
      {settings.background_type === 'image' && settings.background_image_url && settings.background_overlay > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: `rgba(0,0,0,${settings.background_overlay})` }}
        />
      )}
      {isBoxed ? (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">{inner}</div>
      ) : (
        <div className="px-4 md:px-6 relative z-10">{inner}</div>
      )}
    </section>
  )
}

// ─── Public export ─────────────────────────────────────────────────────────

export default function BlockRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map(section => (
        <RenderSection key={section.id} section={section} />
      ))}
    </>
  )
}
