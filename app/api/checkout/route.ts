import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendOrderEmail } from '@/lib/send-email'

// ─── JWT ─────────────────────────────────────────────────────────────────────

function b64url(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function createMontonioJWT(payload: object, secret: string): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body   = b64url(JSON.stringify(payload))
  const sig    = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${header}.${body}.${sig}`
}

// ─── TÜÜBID ──────────────────────────────────────────────────────────────────

interface CartItem {
  id: number
  slug: string
  name: string
  price: number
  qty: number
}

interface CheckoutBody {
  customer: {
    first_name: string
    last_name:  string
    email:      string
    phone:      string
    company?:   string
  }
  shipping: {
    carrier:              string
    carrier_name:         string
    country:              string
    pickup_point_uuid:    string
    pickup_point_name:    string
    pickup_point_address: string
    pickup_point_city:    string
    pickup_point_postal:  string
  }
  notes?:     string
  coupon_id?: string
  items: CartItem[]
}

// ─── POST /api/checkout ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const sandbox   = process.env.MONTONIO_SANDBOX === 'true'
  const accessKey = sandbox
    ? process.env.MONTONIO_ACCESS_KEY
    : process.env.MONTONIO_LIVE_ACCESS_KEY
  const secretKey = sandbox
    ? process.env.MONTONIO_SECRET_KEY
    : process.env.MONTONIO_LIVE_SECRET_KEY
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL || 'https://ipumps.ee'

  if (!accessKey || !secretKey) {
    return NextResponse.json({ error: 'Montonio API võtmed puuduvad' }, { status: 500 })
  }

  let body: CheckoutBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const { customer, shipping, notes, coupon_id, items } = body

  if (!customer?.first_name || !customer?.last_name || !customer?.email ||
      !customer?.phone || !items?.length ||
      !shipping?.pickup_point_uuid || !shipping?.carrier) {
    return NextResponse.json({ error: 'Puuduvad kohustuslikud väljad' }, { status: 422 })
  }

  const VAT_RATE = 0.22
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)

  // ── Kupong ──────────────────────────────────────────────────────────────────
  let discountAmount = 0
  let couponCode: string | null = null

  if (coupon_id) {
    const { data: coupon } = await supabaseAdmin
      .from('coupons')
      .select('id, code, type, value, min_order_amount, usage_limit, used_count, valid_from, valid_until, active')
      .eq('id', coupon_id)
      .single()

    if (coupon && coupon.active) {
      const now = Date.now()
      const fromOk  = !coupon.valid_from  || new Date(coupon.valid_from).getTime()  <= now
      const untilOk = !coupon.valid_until || new Date(coupon.valid_until).getTime() >= now
      const limitOk = coupon.usage_limit === null || coupon.used_count < coupon.usage_limit
      const minOk   = subtotal >= (coupon.min_order_amount ?? 0)

      if (fromOk && untilOk && limitOk && minOk) {
        discountAmount = coupon.type === 'percent'
          ? Number((subtotal * coupon.value / 100).toFixed(2))
          : Math.min(Number(coupon.value), subtotal)
        couponCode = coupon.code
      }
    }
  }

  const grandTotal  = Number(((subtotal - discountAmount) * (1 + VAT_RATE)).toFixed(2))
  const merchantRef = `IPUMPS-${Date.now()}`

  // ── 1. Salvesta tellimus DB-sse ────────────────────────────────────────────

  const shippingAddress = {
    carrier:         shipping.carrier,
    carrier_name:    shipping.carrier_name,
    country:         shipping.country,
    pickup_uuid:     shipping.pickup_point_uuid,
    pickup_name:     shipping.pickup_point_name,
    pickup_address:  shipping.pickup_point_address,
    pickup_city:     shipping.pickup_point_city,
    pickup_postal:   shipping.pickup_point_postal,
    customer_name:   `${customer.first_name} ${customer.last_name}`,
    customer_email:  customer.email,
    customer_phone:  customer.phone,
    ...(customer.company && { company: customer.company }),
    ...(notes && { notes }),
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id:          null,
      status:           'pending',
      total:            grandTotal,
      montonio_order_id: merchantRef,
      shipping_address: shippingAddress,
      ...(couponCode && { coupon_code: couponCode, discount_amount: discountAmount }),
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('Tellimuse salvestamine ebaõnnestus:', orderError)
    return NextResponse.json({ error: 'Tellimuse salvestamine ebaõnnestus' }, { status: 500 })
  }

  const orderId = order.id

  // Salvesta tooted
  const orderItems = items.map(item => ({
    order_id:     orderId,
    product_id:   item.id,
    product_name: item.name,
    quantity:     item.qty,
    unit_price:   item.price,
  }))

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Toodete salvestamine ebaõnnestus:', itemsError)
    // Jätka sellegipoolest — põhitellimus on salvestatud
  }

  // Staatuse ajalugu: ootel
  await supabaseAdmin.from('order_status_history').insert({
    order_id:   orderId,
    status:     'pending',
    note:       'Tellimus loodud, ootan makset',
    changed_by: 'system',
  })

  // Kupong — salvesta kasutus + uuenda loendur
  if (coupon_id && couponCode) {
    await supabaseAdmin.from('coupon_usage').insert({
      coupon_id,
      order_id: orderId,
      user_id:  null,
    })
    const { data: couponRow } = await supabaseAdmin
      .from('coupons').select('used_count').eq('id', coupon_id).single()
    if (couponRow) {
      await supabaseAdmin.from('coupons')
        .update({ used_count: couponRow.used_count + 1 })
        .eq('id', coupon_id)
    }
  }

  // ── 2. Loo Montonio makselink ──────────────────────────────────────────────

  const payload = {
    access_key:         accessKey,
    merchant_reference: merchantRef,
    return_url:         `${siteUrl}/checkout/success?ref=${merchantRef}`,
    notification_url:   `${siteUrl}/api/montonio-webhook`,
    currency:           'EUR',
    grand_total:        grandTotal,
    locale:             'et',
    exp:                Math.floor(Date.now() / 1000) + 600,

    payment: {
      method:        'paymentInitiation',
      currency:      'EUR',
      amount:        grandTotal,
      methodDisplay: 'paymentInitiation',
      region:        shipping.country,
    },

    billing_address: {
      first_name: customer.first_name,
      last_name:  customer.last_name,
      email:      customer.email,
      phone:      customer.phone,
    },

    shipping_address: {
      first_name:    customer.first_name,
      last_name:     customer.last_name,
      email:         customer.email,
      phone:         customer.phone,
      address_line1: `${shipping.carrier_name}: ${shipping.pickup_point_name}`,
      address_line2: shipping.pickup_point_address,
      city:          shipping.pickup_point_city,
      country:       shipping.country,
      postal_code:   shipping.pickup_point_postal,
    },

    line_items: items.map(item => ({
      product_code: String(item.id),
      name:         item.name,
      price:        Number((item.price * (1 + VAT_RATE)).toFixed(2)),
      quantity:     item.qty,
      final_price:  Number((item.price * item.qty * (1 + VAT_RATE)).toFixed(2)),
    })),
  }

  const token  = createMontonioJWT(payload, secretKey)
  const apiUrl = 'https://stargate.montonio.com/orders'

  try {
    const res = await fetch(apiUrl, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ data: token }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Montonio orders API viga (status %d):', res.status, err)
      await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', orderId)
      return NextResponse.json({ error: 'Makselingi loomine ebaõnnestus', detail: err }, { status: 502 })
    }

    const data = await res.json() as { payment_url?: string }

    if (!data.payment_url) {
      await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', orderId)
      return NextResponse.json({ error: 'Montonio ei tagastanud makselinki' }, { status: 502 })
    }

    // Send confirmation emails (fire-and-forget)
    sendOrderEmail(orderId, 'orderConfirmation').catch(console.error)
    sendOrderEmail(orderId, 'newOrderAdmin').catch(console.error)

    return NextResponse.json({ payment_url: data.payment_url, ref: merchantRef })
  } catch (err) {
    console.error('Checkout viga:', err)
    await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', orderId)
    return NextResponse.json({ error: 'Serveri viga, proovi uuesti' }, { status: 500 })
  }
}
