package com.koushikdev.passwordmanager.autofill

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.service.autofill.Dataset
import android.view.autofill.AutofillId
import android.view.autofill.AutofillManager
import android.view.autofill.AutofillValue
import android.widget.RemoteViews
import androidx.annotation.RequiresApi
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.koushikdev.passwordmanager.R

@RequiresApi(Build.VERSION_CODES.O)
class AuthActivity : FragmentActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // No content view — the biometric prompt is a modal overlay.

    val recordId = intent.getStringExtra(EXTRA_RECORD_ID)
    val usernameId = readParcelable(EXTRA_USERNAME_ID)
    val passwordId = readParcelable(EXTRA_PASSWORD_ID)

    if (recordId.isNullOrBlank()) {
      setResult(RESULT_CANCELED)
      finish()
      return
    }

    val record = VaultReader.readAll(this).firstOrNull { it.id == recordId }
    if (record == null) {
      setResult(RESULT_CANCELED)
      finish()
      return
    }

    val bm = BiometricManager.from(this)
    val allowed = BiometricManager.Authenticators.BIOMETRIC_WEAK or
      BiometricManager.Authenticators.DEVICE_CREDENTIAL
    val status = bm.canAuthenticate(allowed)
    if (status != BiometricManager.BIOMETRIC_SUCCESS) {
      // Nothing we can authenticate against — accept the tap without biometric.
      returnDataset(record, usernameId, passwordId)
      return
    }

    val executor = ContextCompat.getMainExecutor(this)
    val prompt = BiometricPrompt(
      this,
      executor,
      object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
          returnDataset(record, usernameId, passwordId)
        }

        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
          setResult(RESULT_CANCELED)
          finish()
        }

        override fun onAuthenticationFailed() {
          // Let the user retry — only onAuthenticationError finishes.
        }
      },
    )

    val info = BiometricPrompt.PromptInfo.Builder()
      .setTitle("Unlock password")
      .setSubtitle(record.passName.ifBlank { "Saved login" })
      .setAllowedAuthenticators(allowed)
      .setConfirmationRequired(false)
      .build()

    prompt.authenticate(info)
  }

  private fun returnDataset(
    record: VaultRecord,
    usernameId: AutofillId?,
    passwordId: AutofillId?,
  ) {
    val dataset = buildDataset(record, usernameId, passwordId)
    if (dataset == null) {
      setResult(RESULT_CANCELED)
      finish()
      return
    }
    val result = Intent()
    result.putExtra(AutofillManager.EXTRA_AUTHENTICATION_RESULT, dataset)
    setResult(RESULT_OK, result)
    finish()
  }

  private fun buildDataset(
    record: VaultRecord,
    usernameId: AutofillId?,
    passwordId: AutofillId?,
  ): Dataset? {
    val builder = Dataset.Builder()
    var any = false
    val primary = record.username.ifBlank { record.passName.ifBlank { "Saved login" } }
    val secondary = if (record.passName.isNotBlank()) record.passName else record.category

    usernameId?.let {
      builder.setValue(it, AutofillValue.forText(record.username), presentation(primary, secondary))
      any = true
    }
    passwordId?.let {
      builder.setValue(it, AutofillValue.forText(record.password), presentation(primary, secondary))
      any = true
    }
    if (!any) return null
    return builder.build()
  }

  private fun presentation(primary: String, secondary: String): RemoteViews {
    val views = RemoteViews(packageName, R.layout.autofill_suggestion)
    views.setTextViewText(R.id.autofill_primary, primary)
    views.setTextViewText(R.id.autofill_secondary, secondary)
    return views
  }

  @Suppress("DEPRECATION")
  private fun readParcelable(name: String): AutofillId? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      intent.getParcelableExtra(name, AutofillId::class.java)
    } else {
      intent.getParcelableExtra(name) as AutofillId?
    }
  }

  companion object {
    const val EXTRA_RECORD_ID = "extra_record_id"
    const val EXTRA_USERNAME_ID = "extra_username_id"
    const val EXTRA_PASSWORD_ID = "extra_password_id"
  }
}
