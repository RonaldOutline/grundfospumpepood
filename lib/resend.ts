import { Resend } from 'resend'

// RESEND_API_KEY saad resend.com dashboardist → API Keys → Create API Key
// Saatja domeen peab olema Resendis verifitseeritud: resend.com → Domains → Add Domain
export const resend = new Resend(process.env.RESEND_API_KEY)
