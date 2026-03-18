import { supabaseAdmin } from './supabase-admin'
import { getResend } from './resend'
import {
  buildOrderConfirmationHtml,
  buildStatusUpdateHtml,
  buildNewOrderAdminHtml,
} from './email-templates'

type EmailType = 'orderConfirmation' | 'statusUpdate' | 'newOrderAdmin'

interface StatusUpdateOptions {
  newStatus: string
  note?: string
}

async function getSetting(key: string, fallback: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value ?? fallback
}

async function isNotifEnabled(key: string): Promise<boolean> {
  const val = await getSetting(key, 'true')
  return val !== 'false' && val !== '0'
}

export async function sendOrderEmail(
  orderId: string,
  type: EmailType,
  options?: StatusUpdateOptions,
): Promise<void> {
  const logEntry: Record<string, unknown> = { order_id: orderId, type }

  try {
    // Load order with items
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      throw new Error(`Order not found: ${orderErr?.message}`)
    }

    const sa: Record<string, string> = order.shipping_address ?? {}

    // Resolve customer email and name
    let customerEmail: string | null = sa.customer_email ?? null
    let customerName: string | null =
      sa.full_name ?? sa.customer_name ?? null

    if (order.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', order.user_id)
        .single()
      if (profile) {
        customerEmail ??= profile.email
        customerName  ??= profile.full_name
      }
    }

    const orderRef = (order.montonio_order_id ?? order.id).toString().slice(-8).toUpperCase()
    const items = (order.order_items ?? []) as Array<{
      product_name: string
      quantity: number
      unit_price: number
    }>

    const fromName    = await getSetting('company_name', 'iPumps')
    const fromAddress = await getSetting('email_from', 'info@ipumps.ee')
    const adminEmail  = await getSetting('email_admin', 'info@ipumps.ee')
    const from        = `${fromName} <${fromAddress}>`

    if (type === 'orderConfirmation') {
      if (!(await isNotifEnabled('notif_order_confirmation'))) return
      if (!customerEmail) throw new Error('No customer email')

      const html = buildOrderConfirmationHtml({
        orderRef,
        customerName,
        order: {
          total: order.total,
          created_at: order.created_at,
          shipping_address: sa,
        },
        items,
        companyName: fromName,
      })

      const { data, error } = await getResend().emails.send({
        from,
        to: customerEmail,
        subject: `Tellimus #${orderRef} vastu võetud — iPumps`,
        html,
      })

      if (error) throw new Error(error.message)
      logEntry.status = 'sent'
      logEntry.recipient = customerEmail
      logEntry.resend_id = (data as { id?: string })?.id

    } else if (type === 'statusUpdate') {
      if (!(await isNotifEnabled('notif_status_update'))) return
      if (!customerEmail) throw new Error('No customer email')
      if (!options?.newStatus) throw new Error('newStatus required')

      const html = buildStatusUpdateHtml({
        orderRef,
        customerName,
        newStatus: options.newStatus,
        note: options.note,
      })

      const { data, error } = await getResend().emails.send({
        from,
        to: customerEmail,
        subject: `Tellimus #${orderRef} — staatuse uuendus`,
        html,
      })

      if (error) throw new Error(error.message)
      logEntry.status = 'sent'
      logEntry.recipient = customerEmail
      logEntry.resend_id = (data as { id?: string })?.id

    } else if (type === 'newOrderAdmin') {
      if (!(await isNotifEnabled('notif_new_order_admin'))) return

      const html = buildNewOrderAdminHtml({
        orderRef,
        order: { total: order.total, created_at: order.created_at },
        items,
        customerName,
        customerEmail,
        shippingAddress: sa,
      })

      const { data, error } = await getResend().emails.send({
        from,
        to: adminEmail,
        subject: `Uus tellimus #${orderRef}`,
        html,
      })

      if (error) throw new Error(error.message)
      logEntry.status = 'sent'
      logEntry.recipient = adminEmail
      logEntry.resend_id = (data as { id?: string })?.id
    }

  } catch (err) {
    logEntry.status = 'error'
    logEntry.error = err instanceof Error ? err.message : String(err)
    console.error('[sendOrderEmail]', type, orderId, logEntry.error)
  } finally {
    // Log regardless of success/failure
    try { await supabaseAdmin.from('email_logs').insert(logEntry) } catch {}
  }
}
