import { redirect } from 'next/navigation'

export default function PaymentPortalRedirect() {
  redirect('/seller/plans')
}
