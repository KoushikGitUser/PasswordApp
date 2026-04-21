package com.koushikdev.passwordmanager.autofill

import android.app.assist.AssistStructure
import android.os.Build
import android.text.InputType
import android.util.Log
import android.view.View
import android.view.autofill.AutofillId
import androidx.annotation.RequiresApi

/**
 * Walks an AssistStructure and identifies candidate username / password fields
 * based on Android autofill hints, HTML autocomplete hints, inputType bits,
 * resource ids, and placeholder/hint text.
 */
@RequiresApi(Build.VERSION_CODES.O)
data class ClassifiedFields(
  val usernameId: AutofillId?,
  val passwordId: AutofillId?,
  val webDomain: String?,
  val packageName: String?,
) {
  val hasAny: Boolean
    get() = usernameId != null || passwordId != null
}

@RequiresApi(Build.VERSION_CODES.O)
object FieldClassifier {
  private val USERNAME_HINT_TOKENS = listOf(
    "username",
    "user_name",
    "login",
    "email",
    "e_mail",
    "phone",
    "mobile",
    "account",
    "userid",
    "user_id",
  )

  private val PASSWORD_HINT_TOKENS = listOf(
    "password",
    "passwd",
    "pwd",
    "pin",
    "passcode",
  )

  private val ANDROID_USERNAME_HINTS = listOf(
    View.AUTOFILL_HINT_USERNAME,
    View.AUTOFILL_HINT_EMAIL_ADDRESS,
    View.AUTOFILL_HINT_PHONE,
  )

  private val ANDROID_PASSWORD_HINTS = listOf(
    View.AUTOFILL_HINT_PASSWORD,
  )

  // W3C autocomplete tokens commonly seen in HTML
  private val HTML_USERNAME_HINTS = listOf(
    "username",
    "email",
    "tel",
    "tel-national",
  )
  private val HTML_PASSWORD_HINTS = listOf(
    "current-password",
    "new-password",
  )

  fun debugDump(structure: AssistStructure, tag: String) {
    Log.i(tag, "  AssistStructure windowCount=${structure.windowNodeCount} pkg=${structure.activityComponent?.packageName}")
    for (i in 0 until structure.windowNodeCount) {
      val root = structure.getWindowNodeAt(i).rootViewNode ?: continue
      dumpNode(root, tag, depth = 0)
    }
  }

  private fun dumpNode(node: AssistStructure.ViewNode, tag: String, depth: Int) {
    if (depth > 15) return
    val autofillId = node.autofillId
    val autofillType = node.autofillType
    val isText = autofillType == View.AUTOFILL_TYPE_TEXT
    if (isText && autofillId != null) {
      val hints = node.autofillHints?.joinToString(",") ?: "null"
      val idEntry = node.idEntry ?: "null"
      val hintText = node.hint?.toString() ?: "null"
      val inputType = node.inputType
      val html = node.htmlInfo
      val htmlStr = if (html != null) {
        val t = html.tag ?: "?"
        val attrs = html.attributes?.joinToString(";") { "${it.first}=${it.second}" } ?: ""
        "html[$t;$attrs]"
      } else "noHtml"
      val importantForAutofill = node.importantForAutofill
      val webDomain = node.webDomain ?: ""
      Log.i(
        tag,
        "    ${"  ".repeat(depth)}FIELD id=$autofillId idEntry=$idEntry " +
          "hints=[$hints] inputType=0x${Integer.toHexString(inputType)} " +
          "hint=\"$hintText\" iFa=$importantForAutofill web=\"$webDomain\" $htmlStr"
      )
    }
    for (i in 0 until node.childCount) {
      val child = node.getChildAt(i) ?: continue
      dumpNode(child, tag, depth + 1)
    }
  }

  fun classify(structure: AssistStructure): ClassifiedFields {
    var username: AutofillId? = null
    var password: AutofillId? = null
    var webDomain: String? = null
    var packageName: String? = null

    for (i in 0 until structure.windowNodeCount) {
      val win = structure.getWindowNodeAt(i)
      val root = win.rootViewNode ?: continue
      if (packageName == null) {
        packageName = root.idPackage ?: structure.activityComponent?.packageName
      }
      val result = walk(root)
      if (username == null && result.usernameId != null) username = result.usernameId
      if (password == null && result.passwordId != null) password = result.passwordId
      if (webDomain == null && result.webDomain != null) webDomain = result.webDomain
    }

    return ClassifiedFields(
      usernameId = username,
      passwordId = password,
      webDomain = webDomain,
      packageName = packageName,
    )
  }

  private fun walk(node: AssistStructure.ViewNode): ClassifiedFields {
    var usernameId: AutofillId? = null
    var passwordId: AutofillId? = null
    var webDomain: String? = null

    // Web domain for browser-based fills (API 28+ exposes it on ViewNode)
    webDomain = node.webDomain?.takeIf { it.isNotEmpty() }

    val autofillId = node.autofillId
    if (autofillId != null && isAutofillable(node)) {
      val kind = classifyNode(node)
      when (kind) {
        FieldKind.USERNAME -> if (usernameId == null) usernameId = autofillId
        FieldKind.PASSWORD -> if (passwordId == null) passwordId = autofillId
        FieldKind.UNKNOWN -> {}
      }
    }

    for (i in 0 until node.childCount) {
      val child = node.getChildAt(i) ?: continue
      val childResult = walk(child)
      if (usernameId == null) usernameId = childResult.usernameId
      if (passwordId == null) passwordId = childResult.passwordId
      if (webDomain == null) webDomain = childResult.webDomain
    }

    return ClassifiedFields(usernameId, passwordId, webDomain, null)
  }

  private fun isAutofillable(node: AssistStructure.ViewNode): Boolean {
    return node.autofillType == View.AUTOFILL_TYPE_TEXT
  }

  private enum class FieldKind { USERNAME, PASSWORD, UNKNOWN }

  private fun classifyNode(node: AssistStructure.ViewNode): FieldKind {
    // 1. Android autofill hints (strongest signal)
    val hints = node.autofillHints
    if (hints != null) {
      for (hint in hints) {
        val h = hint.lowercase()
        if (ANDROID_PASSWORD_HINTS.any { it.lowercase() == h }) return FieldKind.PASSWORD
        if (ANDROID_USERNAME_HINTS.any { it.lowercase() == h }) return FieldKind.USERNAME
        if (HTML_PASSWORD_HINTS.any { it == h }) return FieldKind.PASSWORD
        if (HTML_USERNAME_HINTS.any { it == h }) return FieldKind.USERNAME
      }
    }

    // 2. HTML input attributes (for browsers)
    val html = node.htmlInfo
    if (html != null) {
      val tag = html.tag?.lowercase() ?: ""
      if (tag == "input") {
        val attrs = html.attributes ?: emptyList()
        val typeAttr = attrs.firstOrNull { it.first.equals("type", true) }?.second?.lowercase()
        val nameAttr = attrs.firstOrNull { it.first.equals("name", true) }?.second?.lowercase() ?: ""
        val idAttr = attrs.firstOrNull { it.first.equals("id", true) }?.second?.lowercase() ?: ""
        val ac = attrs.firstOrNull { it.first.equals("autocomplete", true) }?.second?.lowercase() ?: ""

        if (typeAttr == "password") return FieldKind.PASSWORD
        if (HTML_PASSWORD_HINTS.any { ac.contains(it) }) return FieldKind.PASSWORD
        if (PASSWORD_HINT_TOKENS.any { nameAttr.contains(it) || idAttr.contains(it) }) return FieldKind.PASSWORD

        if (HTML_USERNAME_HINTS.any { ac.contains(it) }) return FieldKind.USERNAME
        if (USERNAME_HINT_TOKENS.any { nameAttr.contains(it) || idAttr.contains(it) }) return FieldKind.USERNAME

        if (typeAttr == "email" || typeAttr == "tel") return FieldKind.USERNAME
      }
    }

    // 3. inputType flags
    val inputType = node.inputType
    if (inputType and InputType.TYPE_CLASS_TEXT != 0) {
      val variation = inputType and InputType.TYPE_MASK_VARIATION
      if (variation == InputType.TYPE_TEXT_VARIATION_PASSWORD ||
        variation == InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD ||
        variation == InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD
      ) {
        return FieldKind.PASSWORD
      }
      if (variation == InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS ||
        variation == InputType.TYPE_TEXT_VARIATION_WEB_EMAIL_ADDRESS
      ) {
        return FieldKind.USERNAME
      }
    }
    if (inputType and InputType.TYPE_CLASS_PHONE != 0) {
      return FieldKind.USERNAME
    }

    // 4. Resource id name + hint text (heuristic fallback)
    val idEntry = node.idEntry?.lowercase() ?: ""
    val hintText = node.hint?.toString()?.lowercase() ?: ""

    if (PASSWORD_HINT_TOKENS.any { idEntry.contains(it) || hintText.contains(it) }) {
      return FieldKind.PASSWORD
    }
    if (USERNAME_HINT_TOKENS.any { idEntry.contains(it) || hintText.contains(it) }) {
      return FieldKind.USERNAME
    }

    return FieldKind.UNKNOWN
  }
}
