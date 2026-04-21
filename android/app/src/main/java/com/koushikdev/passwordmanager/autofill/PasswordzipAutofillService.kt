package com.koushikdev.passwordmanager.autofill

import android.app.PendingIntent
import android.app.assist.AssistStructure
import android.content.Intent
import android.os.Build
import android.os.CancellationSignal
import android.service.autofill.AutofillService
import android.service.autofill.Dataset
import android.service.autofill.FillCallback
import android.service.autofill.FillRequest
import android.service.autofill.FillResponse
import android.service.autofill.SaveCallback
import android.service.autofill.SaveInfo
import android.service.autofill.SaveRequest
import android.util.Log
import android.view.autofill.AutofillId
import android.view.autofill.AutofillValue
import android.widget.RemoteViews
import androidx.annotation.RequiresApi
import com.koushikdev.passwordmanager.R

@RequiresApi(Build.VERSION_CODES.O)
class PasswordzipAutofillService : AutofillService() {

  override fun onFillRequest(
    request: FillRequest,
    cancellationSignal: CancellationSignal,
    callback: FillCallback,
  ) {
    try {
      Log.i(TAG, "onFillRequest fired: contexts=${request.fillContexts.size}")
      val structure = request.fillContexts.lastOrNull()?.structure
      if (structure == null) {
        Log.w(TAG, "  no structure — returning null")
        callback.onSuccess(null)
        return
      }

      FieldClassifier.debugDump(structure, TAG)

      val fields = FieldClassifier.classify(structure)
      Log.i(
        TAG,
        "  classified -> username=${fields.usernameId} password=${fields.passwordId} " +
          "pkg=${fields.packageName} domain=${fields.webDomain}"
      )

      if (!fields.hasAny) {
        Log.w(TAG, "  no classifiable fields — returning null")
        callback.onSuccess(null)
        return
      }

      val matches = VaultReader.matchFor(
        context = this,
        packageName = fields.packageName,
        webDomain = fields.webDomain,
      )
      Log.i(TAG, "  vault matches: ${matches.size}")

      val responseBuilder = FillResponse.Builder()
      var addedCount = 0

      for (record in matches) {
        val dataset = buildDataset(record, fields) ?: continue
        responseBuilder.addDataset(dataset)
        addedCount += 1
      }

      // Always include a "Search in passwordszip" fallback so the user has
      // a way to pick manually (and auto-link) or choose a different record.
      val searchDataset = buildSearchFallbackDataset(fields)
      if (searchDataset != null) {
        responseBuilder.addDataset(searchDataset)
        addedCount += 1
      }

      if (addedCount == 0) {
        Log.w(TAG, "  no datasets built — returning null")
        callback.onSuccess(null)
        return
      }

      // Declare which fields we care about when the form is submitted.
      val saveIds = listOfNotNull(fields.usernameId, fields.passwordId).toTypedArray()
      if (saveIds.isNotEmpty() && fields.passwordId != null) {
        val saveType = when {
          fields.usernameId != null -> SaveInfo.SAVE_DATA_TYPE_USERNAME or SaveInfo.SAVE_DATA_TYPE_PASSWORD
          else -> SaveInfo.SAVE_DATA_TYPE_PASSWORD
        }
        responseBuilder.setSaveInfo(SaveInfo.Builder(saveType, saveIds).build())
      }

      Log.i(TAG, "  returning FillResponse with $addedCount dataset(s)")
      callback.onSuccess(responseBuilder.build())
    } catch (t: Throwable) {
      Log.e(TAG, "onFillRequest failed", t)
      callback.onSuccess(null)
    }
  }

  override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
    try {
      val contexts = request.fillContexts
      Log.i(TAG, "onSaveRequest fired: contexts=${contexts.size}")
      if (contexts.isEmpty()) {
        callback.onSuccess()
        return
      }

      // Merge field discovery across ALL fill contexts — multi-step logins
      // (Instagram/Google/bank apps) split username and password over
      // separate screens, each of which produced its own context.
      var usernameId: AutofillId? = null
      var passwordId: AutofillId? = null
      var packageName: String? = null
      var webDomain: String? = null
      for (ctx in contexts) {
        val f = FieldClassifier.classify(ctx.structure)
        if (usernameId == null && f.usernameId != null) usernameId = f.usernameId
        if (passwordId == null && f.passwordId != null) passwordId = f.passwordId
        if (packageName == null && f.packageName != null) packageName = f.packageName
        if (webDomain == null && f.webDomain != null) webDomain = f.webDomain
      }
      Log.i(
        TAG,
        "  merged -> username=$usernameId password=$passwordId pkg=$packageName domain=$webDomain",
      )

      val structures = contexts.map { it.structure }
      val username = usernameId?.let { extractTextAcross(structures, it) }.orEmpty()
      val password = passwordId?.let { extractTextAcross(structures, it) }.orEmpty()

      if (password.isBlank()) {
        Log.w(TAG, "  no password captured — skipping save UI")
        callback.onSuccess()
        return
      }

      val intent = Intent(this, SaveActivity::class.java).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        putExtra(SaveActivity.EXTRA_USERNAME, username)
        putExtra(SaveActivity.EXTRA_PASSWORD, password)
        packageName?.let { putExtra(SaveActivity.EXTRA_PACKAGE, it) }
        webDomain?.let { putExtra(SaveActivity.EXTRA_DOMAIN, it) }
      }
      startActivity(intent)
      callback.onSuccess()
    } catch (t: Throwable) {
      Log.e(TAG, "onSaveRequest failed", t)
      callback.onSuccess()
    }
  }

  private fun extractTextAcross(
    structures: List<AssistStructure>,
    target: AutofillId,
  ): String? {
    for (s in structures) {
      val v = extractText(s, target)
      if (!v.isNullOrEmpty()) return v
    }
    return null
  }

  private fun extractText(structure: AssistStructure, target: AutofillId): String? {
    for (i in 0 until structure.windowNodeCount) {
      val root = structure.getWindowNodeAt(i).rootViewNode ?: continue
      val found = findNode(root, target) ?: continue
      val v = found.autofillValue ?: return null
      if (v.isText) return v.textValue?.toString()
    }
    return null
  }

  private fun findNode(
    node: AssistStructure.ViewNode,
    target: AutofillId,
  ): AssistStructure.ViewNode? {
    if (node.autofillId == target) return node
    for (i in 0 until node.childCount) {
      val child = node.getChildAt(i) ?: continue
      val r = findNode(child, target)
      if (r != null) return r
    }
    return null
  }

  private fun buildDataset(
    record: VaultRecord,
    fields: ClassifiedFields,
  ): Dataset? {
    if (fields.usernameId == null && fields.passwordId == null) return null

    val primary = record.username.ifBlank { record.passName.ifBlank { "Saved login" } }
    val secondary = if (record.passName.isNotBlank()) record.passName else record.category
    val presentation = buildPresentation(primary, secondary)

    val authIntent = Intent(this, AuthActivity::class.java).apply {
      putExtra(AuthActivity.EXTRA_RECORD_ID, record.id)
      fields.usernameId?.let { putExtra(AuthActivity.EXTRA_USERNAME_ID, it) }
      fields.passwordId?.let { putExtra(AuthActivity.EXTRA_PASSWORD_ID, it) }
    }
    val requestCode = (record.id.hashCode() and 0x7FFFFFFF)
    val pending = PendingIntent.getActivity(
      this,
      requestCode,
      authIntent,
      PendingIntent.FLAG_CANCEL_CURRENT or PendingIntent.FLAG_MUTABLE,
    )

    val builder = Dataset.Builder()
    // Placeholder values — Android uses the auth-returned Dataset for the real fill.
    fields.usernameId?.let {
      builder.setValue(it, AutofillValue.forText(""), presentation)
    }
    fields.passwordId?.let {
      builder.setValue(it, AutofillValue.forText(""), presentation)
    }
    builder.setAuthentication(pending.intentSender)
    return builder.build()
  }

  private fun buildSearchFallbackDataset(fields: ClassifiedFields): Dataset? {
    if (fields.usernameId == null && fields.passwordId == null) return null

    val searchIntent = Intent(this, SearchActivity::class.java).apply {
      fields.packageName?.let { putExtra(SearchActivity.EXTRA_PACKAGE, it) }
      fields.webDomain?.let { putExtra(SearchActivity.EXTRA_DOMAIN, it) }
      fields.usernameId?.let { putExtra(SearchActivity.EXTRA_USERNAME_ID, it) }
      fields.passwordId?.let { putExtra(SearchActivity.EXTRA_PASSWORD_ID, it) }
    }
    val pending = PendingIntent.getActivity(
      this,
      SEARCH_REQ_CODE,
      searchIntent,
      PendingIntent.FLAG_CANCEL_CURRENT or PendingIntent.FLAG_MUTABLE,
    )

    val presentation = buildPresentation(
      primary = "Search in Passwords",
      secondary = "Pick a password to use here",
    )

    val builder = Dataset.Builder()
    // Android requires at least one setValue() call before setAuthentication().
    // The actual values are ignored — the authentication flow returns a real
    // Dataset via EXTRA_AUTHENTICATION_RESULT.
    fields.usernameId?.let {
      builder.setValue(it, AutofillValue.forText(""), presentation)
    } ?: fields.passwordId?.let {
      builder.setValue(it, AutofillValue.forText(""), presentation)
    }
    builder.setAuthentication(pending.intentSender)
    return builder.build()
  }

  private fun buildPresentation(primary: String, secondary: String): RemoteViews {
    val views = RemoteViews(packageName, R.layout.autofill_suggestion)
    views.setTextViewText(R.id.autofill_primary, primary)
    views.setTextViewText(R.id.autofill_secondary, secondary)
    return views
  }

  companion object {
    private const val TAG = "PasswordzipAutofill"
    private const val SEARCH_REQ_CODE = 0x5EA4
  }
}
