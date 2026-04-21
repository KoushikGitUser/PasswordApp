package com.koushikdev.passwordmanager.autofill

import android.content.Context
import com.koushikdev.passwordmanager.vault.VaultStorage
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

object VaultWriter {
  private const val KEY = "passwords"

  /**
   * Appends a brand new record to the vault (e.g. after an onSaveRequest
   * capture). Always generates a fresh uuid; domains/packageNames are stored
   * in canonical lowercase form.
   */
  fun addRecord(
    context: Context,
    passName: String,
    username: String,
    password: String,
    category: String,
    packageName: String?,
    webDomain: String?,
  ) {
    val raw = VaultStorage.getItem(context, KEY) ?: "[]"
    val arr = try {
      JSONArray(raw)
    } catch (t: Throwable) {
      JSONArray()
    }

    val pkg = packageName?.lowercase()?.takeIf { it.isNotBlank() }
    val dom = VaultReader.canonicalDomain(webDomain)

    val obj = JSONObject().apply {
      put("id", UUID.randomUUID().toString())
      put("passName", passName)
      put("username", username)
      put("password", password)
      put("category", category)
      put("pin", "")
      put("domains", JSONArray(listOfNotNull(dom)))
      put("packageNames", JSONArray(listOfNotNull(pkg)))
      put("lastUsedAt", System.currentTimeMillis())
    }
    arr.put(obj)
    VaultStorage.setItem(context, KEY, arr.toString())
  }

  /**
   * Appends a packageName and/or webDomain to the record with the given id,
   * and updates lastUsedAt. No-op if the record can't be found or values are
   * already present.
   */
  fun autoLinkAndTouch(
    context: Context,
    recordId: String,
    packageName: String?,
    webDomain: String?,
  ) {
    val raw = VaultStorage.getItem(context, KEY) ?: return
    val arr = try {
      JSONArray(raw)
    } catch (t: Throwable) {
      return
    }
    var modified = false
    for (i in 0 until arr.length()) {
      val obj = arr.optJSONObject(i) ?: continue
      if (obj.optString("id") != recordId) continue

      val pkg = packageName?.lowercase()
      if (!pkg.isNullOrBlank()) {
        val existing = ensureStringArray(obj, "packageNames")
        if (!containsIgnoreCase(existing, pkg)) {
          existing.put(pkg)
          obj.put("packageNames", existing)
          modified = true
        }
      }
      val dom = VaultReader.canonicalDomain(webDomain)
      if (!dom.isNullOrBlank()) {
        val existing = ensureStringArray(obj, "domains")
        if (!containsIgnoreCase(existing, dom)) {
          existing.put(dom)
          obj.put("domains", existing)
          modified = true
        }
      }

      obj.put("lastUsedAt", System.currentTimeMillis())
      modified = true
      break
    }
    if (modified) {
      VaultStorage.setItem(context, KEY, arr.toString())
    }
  }

  private fun ensureStringArray(obj: JSONObject, key: String): JSONArray {
    val existing = obj.optJSONArray(key)
    return existing ?: JSONArray()
  }

  private fun containsIgnoreCase(arr: JSONArray, value: String): Boolean {
    for (i in 0 until arr.length()) {
      val s = arr.optString(i, null) ?: continue
      if (s.equals(value, ignoreCase = true)) return true
    }
    return false
  }
}
