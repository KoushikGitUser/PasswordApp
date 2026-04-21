package com.koushikdev.passwordmanager.autofill

import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Base64
import android.view.autofill.AutofillManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import java.io.ByteArrayOutputStream

class AutofillModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  override fun getName(): String = "AutofillBridge"

  @ReactMethod
  fun isSupported(promise: Promise) {
    promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
  }

  @ReactMethod
  fun isEnabled(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.resolve(false)
      return
    }
    try {
      val afm = context.getSystemService(AutofillManager::class.java)
      promise.resolve(afm?.hasEnabledAutofillServices() == true)
    } catch (t: Throwable) {
      promise.reject("AUTOFILL_STATUS_ERROR", t)
    }
  }

  @ReactMethod
  fun listInstalledApps(promise: Promise) {
    try {
      val pm = context.packageManager
      val launcherIntent = Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
      val resolveInfos = pm.queryIntentActivities(launcherIntent, 0)

      val items = resolveInfos
        .asSequence()
        .mapNotNull { info ->
          val pkg = info.activityInfo?.packageName ?: return@mapNotNull null
          if (pkg == context.packageName) return@mapNotNull null // skip ourselves
          val label = try {
            pm.getApplicationLabel(info.activityInfo.applicationInfo).toString()
          } catch (t: Throwable) {
            pkg
          }
          val iconBase64 = try {
            drawableToBase64(info.loadIcon(pm))
          } catch (t: Throwable) {
            null
          }
          Triple(pkg, label, iconBase64)
        }
        .distinctBy { it.first }
        .sortedBy { it.second.lowercase() }
        .toList()

      val arr: WritableArray = Arguments.createArray()
      for ((pkg, label, icon) in items) {
        val obj: WritableMap = Arguments.createMap()
        obj.putString("packageName", pkg)
        obj.putString("label", label)
        if (icon != null) obj.putString("iconBase64", icon)
        arr.pushMap(obj)
      }
      promise.resolve(arr)
    } catch (t: Throwable) {
      promise.reject("LIST_APPS_ERROR", t)
    }
  }

  private fun drawableToBase64(drawable: Drawable): String {
    val bmp = when (drawable) {
      is BitmapDrawable -> scaleBitmap(drawable.bitmap, 96, 96)
      else -> {
        val target = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(target)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        target
      }
    }
    val out = ByteArrayOutputStream()
    bmp.compress(Bitmap.CompressFormat.PNG, 90, out)
    return Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
  }

  private fun scaleBitmap(src: Bitmap, w: Int, h: Int): Bitmap {
    if (src.width == w && src.height == h) return src
    return Bitmap.createScaledBitmap(src, w, h, true)
  }

  @ReactMethod
  fun openAutofillPicker(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.reject(
        "AUTOFILL_UNSUPPORTED",
        "Autofill requires Android 8 (API 26) or higher."
      )
      return
    }
    try {
      val intent = Intent(Settings.ACTION_REQUEST_SET_AUTOFILL_SERVICE)
      intent.data = Uri.parse("package:${context.packageName}")
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      promise.resolve(true)
    } catch (t: Throwable) {
      try {
        val fallback = Intent(Settings.ACTION_SETTINGS)
        fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(fallback)
        promise.resolve(true)
      } catch (inner: Throwable) {
        promise.reject("AUTOFILL_OPEN_ERROR", inner)
      }
    }
  }
}
