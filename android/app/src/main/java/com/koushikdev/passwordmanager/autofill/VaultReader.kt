package com.koushikdev.passwordmanager.autofill

import android.content.Context
import com.koushikdev.passwordmanager.vault.VaultStorage
import org.json.JSONArray
import org.json.JSONObject

/**
 * Reads password records from VaultStorage and provides matching helpers
 * for the AutofillService.
 */
data class VaultRecord(
  val id: String,
  val passName: String,
  val username: String,
  val password: String,
  val category: String,
  val domains: List<String>,
  val packageNames: List<String>,
  val lastUsedAt: Long,
)

object VaultReader {
  private const val KEY = "passwords"

  fun readAll(context: Context): List<VaultRecord> {
    val raw = VaultStorage.getItem(context, KEY) ?: return emptyList()
    return try {
      val arr = JSONArray(raw)
      val out = ArrayList<VaultRecord>(arr.length())
      for (i in 0 until arr.length()) {
        val obj = arr.optJSONObject(i) ?: continue
        out.add(toRecord(obj))
      }
      out
    } catch (t: Throwable) {
      emptyList()
    }
  }

  fun matchFor(
    context: Context,
    packageName: String?,
    webDomain: String?,
  ): List<VaultRecord> {
    val all = readAll(context)
    if (all.isEmpty()) return emptyList()

    val pkg = packageName?.lowercase()
    val domain = canonicalDomain(webDomain)

    val matches = all.filter { record ->
      val pkgMatch = pkg != null && record.packageNames.any { it.equals(pkg, ignoreCase = true) }
      val domainMatch = domain != null && record.domains.any { canonicalDomain(it) == domain }
      pkgMatch || domainMatch
    }

    // Sort most-recently-used first
    return matches.sortedByDescending { it.lastUsedAt }
  }

  fun canonicalDomain(raw: String?): String? {
    if (raw.isNullOrBlank()) return null
    var d = raw.trim().lowercase()
    d = d.removePrefix("https://").removePrefix("http://")
    d = d.removePrefix("www.")
    d = d.substringBefore('/')
    d = d.substringBefore('?')
    if (d.isBlank()) return null
    return d
  }

  private fun toRecord(obj: JSONObject): VaultRecord {
    return VaultRecord(
      id = obj.optString("id", ""),
      passName = obj.optString("passName", ""),
      username = obj.optString("username", ""),
      password = obj.optString("password", ""),
      category = obj.optString("category", ""),
      domains = jsonStringList(obj.optJSONArray("domains")),
      packageNames = jsonStringList(obj.optJSONArray("packageNames")),
      lastUsedAt = obj.optLong("lastUsedAt", 0L),
    )
  }

  private fun jsonStringList(arr: JSONArray?): List<String> {
    if (arr == null) return emptyList()
    val out = ArrayList<String>(arr.length())
    for (i in 0 until arr.length()) {
      val s = arr.optString(i, null)
      if (!s.isNullOrBlank()) out.add(s)
    }
    return out
  }
}
