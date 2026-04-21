package com.koushikdev.passwordmanager.vault

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class VaultStorageModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  override fun getName(): String = "VaultStorage"

  @ReactMethod
  fun getItem(key: String, promise: Promise) {
    try {
      val value = VaultStorage.getItem(context, key)
      promise.resolve(value)
    } catch (t: Throwable) {
      promise.reject("VAULT_GET_ERROR", t)
    }
  }

  @ReactMethod
  fun setItem(key: String, value: String, promise: Promise) {
    try {
      VaultStorage.setItem(context, key, value)
      promise.resolve(true)
    } catch (t: Throwable) {
      promise.reject("VAULT_SET_ERROR", t)
    }
  }

  @ReactMethod
  fun deleteItem(key: String, promise: Promise) {
    try {
      VaultStorage.deleteItem(context, key)
      promise.resolve(true)
    } catch (t: Throwable) {
      promise.reject("VAULT_DELETE_ERROR", t)
    }
  }

  @ReactMethod
  fun contains(key: String, promise: Promise) {
    try {
      val has = VaultStorage.contains(context, key)
      promise.resolve(has)
    } catch (t: Throwable) {
      promise.reject("VAULT_CONTAINS_ERROR", t)
    }
  }
}
