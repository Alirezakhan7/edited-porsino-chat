// app/pardakht/redirect-payment/page.tsx
export const dynamic = "force-dynamic"

export default function RedirectPaymentPage({
  searchParams
}: {
  searchParams: { [k: string]: string | undefined }
}) {
  const token = searchParams.token
  const psp = searchParams.psp

  if (!token || !psp) {
    return (
      <html dir="rtl">
        <body>
          <p>پارامترهای ورودی ناقص است.</p>
        </body>
      </html>
    )
  }

  const hidden = (name: string, value?: string) =>
    value ? `<input type="hidden" name="${name}" value="${value}" />` : ""

  const forms: Record<string, string> = {
    Sepehr: `
      <form id="f" method="post" action="https://sepehr.shaparak.ir:8080/Pay">
        ${hidden("TerminalID", searchParams.terminalID)}
        ${hidden("token", token)}
        ${hidden("getMethod", "0")}
        ${hidden("nationalCode", searchParams.nationalCode)}
      </form>`,
    Asanpardakht: `
      <form id="f" method="post" action="https://asan.shaparak.ir">
        ${hidden("RefId", token)}
        ${hidden("mobileap", searchParams.mobileNo)}
      </form>`,
    Irankish: `
      <form id="f" method="post" action="https://ikc.shaparak.ir/iuiv3/IPG/Index/">
        ${hidden("tokenIdentity", token)}
      </form>`,
    Mellat: `
      <form id="f" method="post" action="https://bpm.shaparak.ir/pgwchannel/startpay.mellat">
        ${hidden("refId", token)}
        ${hidden("mobileNo", searchParams.mobileNo)}
      </form>`,
    Novin: `
      <form id="f" method="post" action="https://pna.shaparak.ir/mhui/home/index/${token}">
        ${hidden("language", "fa")}
      </form>`,
    Pasargad: `
      <form id="f" method="post" action="https://pep.shaparak.ir/dorsa1/${token}">
        ${hidden("Token", token)}
      </form>`,
    Saman: `
      <form id="f" method="post" action="https://sep.shaparak.ir/OnlinePG/onlinePG">
        ${hidden("Token", token)}
      </form>`,
    Parsian: `
      <form id="f" method="post" action="https://pec.shaparak.ir/NewIPG/?token=${token}"></form>`
  }

  const form = forms[psp] ?? ""
  const submitJs = form ? "document.getElementById('f')?.submit();" : ""

  return (
    <html dir="rtl">
      <head>
        <title>انتقال به صفحه پرداخت</title>
      </head>
      <body>
        {form ? (
          <div dangerouslySetInnerHTML={{ __html: form }} />
        ) : (
          <p>PSP نامعتبر است.</p>
        )}
        {/* اجرای اتو‌سابمیت بعد از اینکه فرم داخل DOM قرار گرفت */}
        <script dangerouslySetInnerHTML={{ __html: submitJs }} />
        <noscript>
          <p>برای ادامه، جاوااسکریپت را فعال کنید.</p>
        </noscript>
      </body>
    </html>
  )
}
