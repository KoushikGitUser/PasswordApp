package com.koushikdev.passwordmanager.vault

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Encrypted key/value store shared between the React Native layer and the
 * native AutofillService. Backed by AndroidX EncryptedSharedPreferences
 * (AES-256-GCM values, AES-256-GCM key wrap, Android Keystore master key).
 *
 * Same-process access — both the RN bridge and the AutofillService open
 * the same SharedPreferences file via this class and see identical data.
 */
object VaultStorage {
  private const val FILE_NAME = "passwordszip_vault"

  @Volatile
  private var prefs: SharedPreferences? = null

  private fun getPrefs(context: Context): SharedPreferences {
    val existing = prefs
    if (existing != null) return existing
    synchronized(this) {
      val again = prefs
      if (again != null) return again
      val masterKey = MasterKey.Builder(context.applicationContext)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
      val created = EncryptedSharedPreferences.create(
        context.applicationContext,
        FILE_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
      )
      prefs = created
      return created
    }
  }

  fun getItem(context: Context, key: String): String? {
    return getPrefs(context).getString(key, null)
  }

  fun setItem(context: Context, key: String, value: String) {
    getPrefs(context).edit().putString(key, value).apply()
  }

  fun deleteItem(context: Context, key: String) {
    getPrefs(context).edit().remove(key).apply()
  }

  fun contains(context: Context, key: String): Boolean {
    return getPrefs(context).contains(key)
  }
}
