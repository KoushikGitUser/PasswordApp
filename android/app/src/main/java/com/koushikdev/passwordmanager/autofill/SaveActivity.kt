package com.koushikdev.passwordmanager.autofill

import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.TypedValue
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.koushikdev.passwordmanager.R

@RequiresApi(Build.VERSION_CODES.O)
class SaveActivity : FragmentActivity() {

  private val categories = listOf("Banking", "Mail or ID", "Social", "Developer", "Wifi")

  private var selectedCategory: String = "Mail or ID"
  private var capturedUsername: String = ""
  private var capturedPassword: String = ""
  private var capturedPackage: String? = null
  private var capturedDomain: String? = null
  private var passwordRevealed: Boolean = false
  private val chipViews = mutableListOf<TextView>()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_autofill_save)

    capturedUsername = intent.getStringExtra(EXTRA_USERNAME) ?: ""
    capturedPassword = intent.getStringExtra(EXTRA_PASSWORD) ?: ""
    capturedPackage = intent.getStringExtra(EXTRA_PACKAGE)
    capturedDomain = intent.getStringExtra(EXTRA_DOMAIN)

    val appLabel = resolveAppLabel()
    val subtitle = findViewById<TextView>(R.id.save_subtitle)
    subtitle.text = "for $appLabel"

    findViewById<TextView>(R.id.save_username).text = capturedUsername.ifBlank { "(empty)" }
    findViewById<TextView>(R.id.save_password).text = maskedPassword()
    findViewById<TextView>(R.id.save_source).text =
      capturedPackage ?: capturedDomain ?: "Unknown source"

    val toggle = findViewById<ImageView>(R.id.save_password_toggle)
    toggle.setOnClickListener {
      passwordRevealed = !passwordRevealed
      findViewById<TextView>(R.id.save_password).text = maskedPassword()
    }

    val labelInput = findViewById<EditText>(R.id.save_label_input)
    labelInput.setText(appLabel)

    // Pre-select category via known-categories map
    selectedCategory = KnownCategories.guess(capturedPackage, capturedDomain)

    val chipRow = findViewById<LinearLayout>(R.id.save_category_row)
    categories.forEach { cat ->
      val chip = buildChip(cat)
      chipRow.addView(chip)
      chipViews.add(chip)
    }
    refreshChipSelection()

    findViewById<TextView>(R.id.save_button).setOnClickListener {
      val label = labelInput.text.toString().trim().ifBlank { appLabel }
      if (isDuplicate(label)) {
        Toast.makeText(
          this,
          "A password for this account already exists. Change the label or cancel.",
          Toast.LENGTH_LONG,
        ).show()
        return@setOnClickListener
      }
      runSaveWithBiometric(label)
    }

    findViewById<TextView>(R.id.save_cancel).setOnClickListener {
      setResult(RESULT_CANCELED)
      finish()
    }
    findViewById<ImageView>(R.id.save_close).setOnClickListener {
      setResult(RESULT_CANCELED)
      finish()
    }
  }

  private fun maskedPassword(): String {
    if (capturedPassword.isEmpty()) return "(empty)"
    return if (passwordRevealed) capturedPassword else "•".repeat(capturedPassword.length.coerceAtMost(16))
  }

  private fun resolveAppLabel(): String {
    val pkg = capturedPackage
    if (!pkg.isNullOrBlank()) {
      try {
        val info = packageManager.getApplicationInfo(pkg, 0)
        return packageManager.getApplicationLabel(info).toString()
      } catch (e: PackageManager.NameNotFoundException) {
        // fall through
      }
    }
    if (!capturedDomain.isNullOrBlank()) {
      return capturedDomain!!
    }
    return "this app"
  }

  private fun buildChip(category: String): TextView {
    val chip = TextView(this)
    val params = LinearLayout.LayoutParams(
      ViewGroup.LayoutParams.WRAP_CONTENT,
      ViewGroup.LayoutParams.WRAP_CONTENT,
    )
    params.rightMargin = dp(8)
    chip.layoutParams = params
    chip.text = category
    chip.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
    chip.setTextColor(0xFFFFFFFF.toInt())
    chip.setPadding(dp(16), dp(10), dp(16), dp(10))
    chip.setBackgroundResource(R.drawable.autofill_category_chip_bg)
    chip.setOnClickListener {
      selectedCategory = category
      refreshChipSelection()
    }
    return chip
  }

  private fun refreshChipSelection() {
    chipViews.forEachIndexed { index, tv ->
      val cat = categories[index]
      val selected = cat == selectedCategory
      tv.isSelected = selected
      tv.setTextColor(if (selected) 0xFF00C76B.toInt() else 0xFFFFFFFF.toInt())
    }
  }

  private fun dp(n: Int): Int {
    return (n * resources.displayMetrics.density).toInt()
  }

  private fun runSaveWithBiometric(label: String) {
    val bm = BiometricManager.from(this)
    val allowed = BiometricManager.Authenticators.BIOMETRIC_WEAK or
      BiometricManager.Authenticators.DEVICE_CREDENTIAL
    if (bm.canAuthenticate(allowed) != BiometricManager.BIOMETRIC_SUCCESS) {
      commitSave(label)
      return
    }
    val prompt = BiometricPrompt(
      this,
      ContextCompat.getMainExecutor(this),
      object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
          commitSave(label)
        }

        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
          // stay on screen
        }
      },
    )
    val info = BiometricPrompt.PromptInfo.Builder()
      .setTitle("Save password")
      .setSubtitle(label)
      .setAllowedAuthenticators(allowed)
      .setConfirmationRequired(false)
      .build()
    prompt.authenticate(info)
  }

  private fun isDuplicate(label: String): Boolean {
    val normalizedDomain = VaultReader.canonicalDomain(capturedDomain)
    val normalizedPkg = capturedPackage?.lowercase()
    val u = capturedUsername.trim()

    return VaultReader.readAll(this).any { r ->
      val sameUsername = r.username.trim().equals(u, ignoreCase = true) && u.isNotEmpty()
      val samePackage = normalizedPkg != null &&
        r.packageNames.any { it.equals(normalizedPkg, ignoreCase = true) }
      val sameDomain = normalizedDomain != null &&
        r.domains.any { VaultReader.canonicalDomain(it) == normalizedDomain }
      val sameLabel = r.passName.trim().equals(label.trim(), ignoreCase = true)

      sameUsername && (samePackage || sameDomain || sameLabel)
    }
  }

  private fun commitSave(label: String) {
    VaultWriter.addRecord(
      context = this,
      passName = label,
      username = capturedUsername,
      password = capturedPassword,
      category = selectedCategory,
      packageName = capturedPackage,
      webDomain = capturedDomain,
    )
    setResult(RESULT_OK)
    finish()
  }

  companion object {
    const val EXTRA_USERNAME = "extra_username"
    const val EXTRA_PASSWORD = "extra_password"
    const val EXTRA_PACKAGE = "extra_package"
    const val EXTRA_DOMAIN = "extra_domain"
  }
}
