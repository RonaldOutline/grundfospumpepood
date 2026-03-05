export type Alignment = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'center' | 'bottom'
export type WidthType = 'boxed' | 'full'
export type BackgroundType = 'color' | 'image'
export type PaddingSize = 'small' | 'medium' | 'large' | 'custom'

export interface HeadingBlock {
  id: string
  type: 'heading'
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  text: string
  alignment: Alignment
  color: string
}

export interface TextBlock {
  id: string
  type: 'text'
  content: string
  alignment: Alignment
  color: string
}

export interface ImageBlock {
  id: string
  type: 'image'
  url: string
  alt: string
  link_url: string | null
  link_target: '_self' | '_blank'
  object_fit: 'cover' | 'contain'
}

export interface ButtonBlock {
  id: string
  type: 'button'
  text: string
  url: string
  target: '_self' | '_blank'
  style: 'filled' | 'outline' | 'text'
  color: string
  alignment: Alignment
}

export interface VideoBlock {
  id: string
  type: 'video'
  url: string
  alignment: Alignment
}

export interface DividerBlock {
  id: string
  type: 'divider'
  color: string
  thickness: number
}

export interface SpacerBlock {
  id: string
  type: 'spacer'
  height: number
}

export type ContentBlock =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | VideoBlock
  | DividerBlock
  | SpacerBlock

export interface Column {
  id: string
  width: number
  vertical_align: VerticalAlign
  blocks: ContentBlock[]
}

export interface SectionSettings {
  width: WidthType
  background_type: BackgroundType
  background_color: string
  background_image_url: string | null
  background_overlay: number
  padding_top: PaddingSize
  padding_bottom: PaddingSize
  padding_top_custom?: number
  padding_bottom_custom?: number
}

export interface Section {
  id: string
  type: 'section'
  order: number
  settings: SectionSettings
  columns: Column[]
}

export interface PageFormData {
  title: string
  slug: string
  short_description: string
  status: 'draft' | 'published'
  visibility: 'public' | 'private'
  show_in_nav: boolean
  nav_label: string
  meta_title: string
  meta_description: string
  og_image_url: string
  blocks: Section[]
}
