package com.koushikdev.passwordmanager.autofill

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.service.autofill.Dataset
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.autofill.AutofillId
import android.view.autofill.AutofillManager
import android.view.autofill.AutofillValue
import android.widget.BaseAdapter
import android.widget.EditText
import android.widget.ImageView
import android.widget.ListView
import android.widget.RemoteViews
import android.widget.TextView
import androidx.annotation.RequiresApi
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.koushikdev.passwordmanager.R

@RequiresApi(Build.VERSION_CODES.O)
class SearchActivity : FragmentActivity() {

  private var usernameId: AutofillId? = null
  private var passwordId: AutofillId? = null
  private var requestPackage: String? = null
  private var requestDomain: String? = null

  private lateinit var allRecords: List<VaultRecord>
  private lateinit var filtered: MutableList<VaultRecord>
  private lateinit var adapter: RecordAdapter

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_autofill_search)

    usernameId = readParcelable(EXTRA_USERNAME_ID)
    passwordId = readParcelable(EXTRA_PASSWORD_ID)
    requestPackage = intent.getStringExtra(EXTRA_PACKAGE)
    requestDomain = intent.getStringExtra(EXTRA_DOMAIN)

    val title = findViewById<TextView>(R.id.search_title)
    val subtitle = findViewById<TextView>(R.id.search_subtitle)
    title.text = "Select a password"
    subtitle.text = resolveAppLabel()

    findViewById<ImageView>(R.id.search_close).setOnClickListener {
      setResult(RESULT_CANCELED)
      finish()
    }

    allRecords = VaultReader.readAll(this)
    filtered = allRecords.toMutableList()

    val listView = findViewById<ListView>(R.id.search_list)
    val emptyView = findViewById<TextView>(R.id.search_empty)
    listView.emptyView = emptyView

    adapter = RecordAdapter(this, filtered)
    listView.adapter = adapter
    listView.setOnItemClickListener { _, _, position, _ ->
      handlePick(filtered[position])
    }

    val searchInput = findViewById<EditText>(R.id.search_input)
    searchInput.addTextChangedListener(object : TextWatcher {
      override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
      override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
        applyFilter(s?.toString() ?: "")
      }

      override fun afterTextChanged(s: Editable?) {}
    })
  }

  private fun resolveAppLabel(): String {
    val pkg = requestPackage
    val dom = requestDomain
    val pkgLabel = if (!pkg.isNullOrBlank()) {
      try {
        val appInfo = packageManager.getApplicationInfo(pkg, 0)
        packageManager.getApplicationLabel(appInfo).toString()
      } catch (e: PackageManager.NameNotFoundException) {
        pkg
      }
    } else null
    return when {
      !dom.isNullOrBlank() && !pkgLabel.isNullOrBlank() -> "for $pkgLabel ($dom)"
      !pkgLabel.isNullOrBlank() -> "for $pkgLabel"
      !dom.isNullOrBlank() -> "for $dom"
      else -> "Pick a record to fill"
    }
  }

  private fun applyFilter(query: String) {
    val q = query.trim().lowercase()
    filtered.clear()
    if (q.isEmpty()) {
      filtered.addAll(allRecords)
    } else {
      for (r in allRecords) {
        if (r.passName.lowercase().contains(q) || r.username.lowercase().contains(q)) {
          filtered.add(r)
        }
      }
    }
    adapter.notifyDataSetChanged()
  }

  private fun handlePick(record: VaultRecord) {
    val bm = BiometricManager.from(this)
    val allowed = BiometricManager.Authenticators.BIOMETRIC_WEAK or
      BiometricManager.Authenticators.DEVICE_CREDENTIAL
    if (bm.canAuthenticate(allowed) != BiometricManager.BIOMETRIC_SUCCESS) {
      finishPick(record)
      return
    }
    val prompt = BiometricPrompt(
      this,
      ContextCompat.getMainExecutor(this),
      object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
          finishPick(record)
        }

        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
          // Don't finish — user stays on the search list to retry or pick another.
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

  private fun finishPick(record: VaultRecord) {
    VaultWriter.autoLinkAndTouch(
      context = this,
      recordId = record.id,
      packageName = requestPackage,
      webDomain = requestDomain,
    )

    val dataset = buildDataset(record)
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

  private fun buildDataset(record: VaultRecord): Dataset? {
    val builder = Dataset.Builder()
    var any = false

    val primary = record.username.ifBlank { record.passName.ifBlank { "Saved login" } }
    val secondary = if (record.passName.isNotBlank()) record.passName else record.category

    usernameId?.let {
      val presentation = buildRowPresentation(primary, secondary)
      builder.setValue(it, AutofillValue.forText(record.username), presentation)
      any = true
    }
    passwordId?.let {
      val presentation = buildRowPresentation(primary, secondary)
      builder.setValue(it, AutofillValue.forText(record.password), presentation)
      any = true
    }
    if (!any) return null
    return builder.build()
  }

  private fun buildRowPresentation(primary: String, secondary: String): RemoteViews {
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

  private class RecordAdapter(
    val activity: Activity,
    val items: MutableList<VaultRecord>,
  ) : BaseAdapter() {
    override fun getCount(): Int = items.size
    override fun getItem(position: Int): Any = items[position]
    override fun getItemId(position: Int): Long = position.toLong()

    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
      val view = convertView ?: LayoutInflater.from(activity)
        .inflate(R.layout.item_autofill_record, parent, false)
      val record = items[position]
      val avatar = view.findViewById<TextView>(R.id.record_avatar)
      val title = view.findViewById<TextView>(R.id.record_title)
      val subtitle = view.findViewById<TextView>(R.id.record_subtitle)

      val letter = record.passName.firstOrNull()?.uppercaseChar()?.toString() ?: "?"
      avatar.text = letter

      title.text = record.passName.ifBlank { "Untitled" }
      subtitle.text = maskForBanking(record)
      return view
    }

    private fun maskForBanking(record: VaultRecord): String {
      if (record.username.isBlank()) return record.category
      if (record.category == "Banking" && record.username.length > 5) {
        val visible = record.username.take(5)
        val hidden = "•".repeat(record.username.length - 5)
        return visible + hidden
      }
      return record.username
    }
  }

  companion object {
    const val EXTRA_PACKAGE = "extra_package"
    const val EXTRA_DOMAIN = "extra_domain"
    const val EXTRA_USERNAME_ID = "extra_username_id"
    const val EXTRA_PASSWORD_ID = "extra_password_id"
  }
}
