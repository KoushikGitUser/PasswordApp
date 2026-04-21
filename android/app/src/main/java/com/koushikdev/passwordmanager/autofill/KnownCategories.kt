package com.koushikdev.passwordmanager.autofill

/**
 * Best-effort category guesser for common apps / domains. Used to pre-select
 * a category chip in the SaveActivity. Falls back to "Mail or ID" when
 * unknown — the user can change it.
 */
object KnownCategories {
  private val PACKAGE_MAP = mapOf(
    // Social
    "com.instagram.android" to "Social",
    "com.instagram.lite" to "Social",
    "com.facebook.katana" to "Social",
    "com.facebook.lite" to "Social",
    "com.whatsapp" to "Social",
    "com.whatsapp.w4b" to "Social",
    "com.twitter.android" to "Social",
    "com.reddit.frontpage" to "Social",
    "com.linkedin.android" to "Social",
    "com.snapchat.android" to "Social",
    "com.pinterest" to "Social",
    "com.zhiliaoapp.musically" to "Social", // TikTok
    "com.discord" to "Social",
    "org.telegram.messenger" to "Social",
    "com.tumblr" to "Social",
    "com.quora.android" to "Social",

    // Mail or ID
    "com.google.android.gm" to "Mail or ID",
    "com.microsoft.office.outlook" to "Mail or ID",
    "com.yahoo.mobile.client.android.mail" to "Mail or ID",
    "ch.protonmail.android" to "Mail or ID",

    // Developer
    "com.github.android" to "Developer",
    "com.gitlab.gitlab" to "Developer",
    "com.stackexchange.stackexchange" to "Developer",

    // Banking (India-heavy since app is India-focused, plus common global)
    "com.paytm" to "Banking",
    "net.one97.paytm" to "Banking",
    "com.phonepe.app" to "Banking",
    "com.google.android.apps.nbu.paisa.user" to "Banking",
    "in.org.npci.upiapp" to "Banking",
    "com.amazon.mShop.android.shopping" to "Banking",
    "com.hdfcbank.hdfc" to "Banking",
    "com.sbi.lotusintouch" to "Banking",
    "com.sbi.SBIFreedomPlus" to "Banking",
    "com.csam.icici.bank.imobile" to "Banking",
    "com.axis.mobile" to "Banking",
    "com.snapwork.hdfc" to "Banking",
    "com.paypal.android.p2pmobile" to "Banking",
    "com.chase.sig.android" to "Banking",
    "com.wf.wellsfargomobile" to "Banking",

    // Wifi
    "com.jio.jiohotspot" to "Wifi",
  )

  private val DOMAIN_MAP = mapOf(
    // Social
    "instagram.com" to "Social",
    "facebook.com" to "Social",
    "twitter.com" to "Social",
    "x.com" to "Social",
    "linkedin.com" to "Social",
    "reddit.com" to "Social",
    "snapchat.com" to "Social",
    "tiktok.com" to "Social",
    "pinterest.com" to "Social",
    "discord.com" to "Social",
    "telegram.org" to "Social",
    "tumblr.com" to "Social",
    "quora.com" to "Social",
    "whatsapp.com" to "Social",

    // Mail or ID
    "gmail.com" to "Mail or ID",
    "outlook.com" to "Mail or ID",
    "live.com" to "Mail or ID",
    "yahoo.com" to "Mail or ID",
    "icloud.com" to "Mail or ID",
    "protonmail.com" to "Mail or ID",
    "zoho.com" to "Mail or ID",
    "google.com" to "Mail or ID",
    "accounts.google.com" to "Mail or ID",

    // Developer
    "github.com" to "Developer",
    "gitlab.com" to "Developer",
    "bitbucket.org" to "Developer",
    "stackoverflow.com" to "Developer",
    "npmjs.com" to "Developer",
    "pypi.org" to "Developer",
    "docker.com" to "Developer",
    "heroku.com" to "Developer",
    "vercel.com" to "Developer",
    "netlify.com" to "Developer",
    "digitalocean.com" to "Developer",

    // Banking
    "paypal.com" to "Banking",
    "chase.com" to "Banking",
    "bankofamerica.com" to "Banking",
    "wellsfargo.com" to "Banking",
    "hdfcbank.com" to "Banking",
    "sbi.co.in" to "Banking",
    "onlinesbi.sbi" to "Banking",
    "icicibank.com" to "Banking",
    "axisbank.com" to "Banking",
    "kotak.com" to "Banking",
    "paytm.com" to "Banking",
    "phonepe.com" to "Banking",
  )

  fun guess(packageName: String?, webDomain: String?): String {
    val pkg = packageName?.lowercase()
    if (pkg != null) {
      PACKAGE_MAP[pkg]?.let { return it }
    }
    val dom = canonical(webDomain)
    if (dom != null) {
      DOMAIN_MAP[dom]?.let { return it }
    }
    return "Mail or ID"
  }

  private fun canonical(raw: String?): String? {
    if (raw.isNullOrBlank()) return null
    var d = raw.trim().lowercase()
    d = d.removePrefix("https://").removePrefix("http://").removePrefix("www.")
    d = d.substringBefore('/').substringBefore('?')
    return d.ifBlank { null }
  }
}
