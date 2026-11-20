const APP_ID = "webapppassword";

// Origins are inserted as plain text, so the placeholders must not be HTML escaped
const translate = (text, vars) =>
  t(APP_ID, text, vars, undefined, { escape: false });

// Mirrors lib/Security/OriginValidator.php, keep both in sync
const normalizeOrigin = (value) => {
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)/i.exec(value.trim());
  if (!match) {
    return { error: t(APP_ID, "Add a scheme, e.g. https://example.com") };
  }

  const scheme = match[1].toLowerCase();
  const authority = match[2];
  if (authority.includes("@")) {
    return { error: t(APP_ID, "Usernames and passwords are not allowed") };
  }

  const hostMatch = /^(\[[^\]]*\]|[^:]*)(?::(.*))?$/.exec(authority);
  const isValidHost = (host) =>
    /^\[[0-9a-f:.]+\]$/.test(host) ||
    /^[a-z0-9_-]+(\.[a-z0-9_-]+)*$/.test(host);
  const invalidHost = { error: t(APP_ID, "The host name is invalid") };
  if (!hostMatch) {
    return invalidHost;
  }

  const host = hostMatch[1].toLowerCase();
  let port = hostMatch[2];

  if (host.includes("*")) {
    if (!host.startsWith("*.") || host.slice(2).includes("*")) {
      return {
        error: t(
          APP_ID,
          "Only a leading wildcard like https://*.example.com is supported",
        ),
      };
    }
    if (!isValidHost(host.slice(2))) {
      return invalidHost;
    }
  } else if (!isValidHost(host)) {
    return invalidHost;
  }

  if (port !== undefined) {
    if (!/^\d{1,5}$/.test(port) || +port < 1 || +port > 65535) {
      return {
        error: t(APP_ID, "The port must be a number between 1 and 65535"),
      };
    }
    port = String(+port);
  }

  return {
    origin: `${scheme}://${host}${port !== undefined ? `:${port}` : ""}`,
  };
};

const splitOrigins = (value) =>
  value
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");

class OriginPicker {
  constructor(root, onChange) {
    this.root = root;
    this.onChange = onChange;
    this.hidden = root.querySelector('input[type="hidden"]');
    this.chips = root.querySelector(".webapppassword-origin-picker__chips");
    this.entry = root.querySelector(".webapppassword-origin-picker__entry");
    this.errorElement = root.querySelector(
      ".webapppassword-origin-picker__error",
    );
    this.suggestions = root.querySelector(
      ".webapppassword-origin-picker__suggestions",
    );
    this.setValue(this.hidden.value);

    root
      .querySelector(".webapppassword-origin-picker__field")
      .addEventListener("click", (e) => {
        if (e.target === e.currentTarget || e.target === this.chips) {
          this.entry.focus();
        }
      });

    this.entry.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        this.commitEntry();
      } else if (
        e.key === "Backspace" &&
        this.entry.value === "" &&
        this.items.length > 0
      ) {
        this.remove(this.items.length - 1);
      }
    });
    this.entry.addEventListener("input", () => {
      if (/[\s,]/.test(this.entry.value)) {
        this.commitEntry({ keepLast: true });
      } else {
        this.showError("");
      }
    });
    this.entry.addEventListener("blur", () => this.commitEntry());
  }

  get origins() {
    return this.items.filter((item) => item.origin).map((item) => item.origin);
  }

  get hasInvalid() {
    return this.items.some((item) => item.error);
  }

  setValue(value) {
    // Existing entries are shown as stored, invalid ones get flagged
    this.items = splitOrigins(value).map((entry) => ({
      value: entry,
      ...normalizeOrigin(entry),
    }));
    this.showItemErrors();
    this.render();
  }

  // Adds the typed origins as chips, invalid ones stay in the text field
  commitEntry({ keepLast = false } = {}) {
    const entries = splitOrigins(this.entry.value);
    let rest = "";
    if (keepLast && !/[\s,]$/.test(this.entry.value)) {
      rest = entries.pop() ?? "";
    }
    // Avoid re-rendering (and shifting the layout) when there is nothing to add
    if (entries.length === 0) {
      return true;
    }

    const rejected = [];
    const errors = [];
    for (const entry of entries) {
      const result = normalizeOrigin(entry);
      if (result.error) {
        rejected.push(entry);
        errors.push(`${entry}: ${result.error}`);
      } else if (this.origins.includes(result.origin)) {
        errors.push(
          translate("{origin} is already in the list", {
            origin: result.origin,
          }),
        );
      } else {
        this.items.push({ value: result.origin, origin: result.origin });
      }
    }

    this.entry.value = [...rejected, rest].filter((v) => v !== "").join(", ");
    this.showError(errors.join("\n"));
    this.render();

    return rejected.length === 0;
  }

  add(origin) {
    this.entry.value = origin;
    this.commitEntry();
    this.entry.focus();
  }

  remove(index) {
    this.items.splice(index, 1);
    this.showItemErrors();
    this.render();
    this.entry.focus();
  }

  markInvalid(entries) {
    for (const { value, message } of entries) {
      const item = this.items.find((item) => item.value === value);
      if (item) {
        item.origin = undefined;
        item.error = message;
      }
    }
    this.showItemErrors();
    this.render();
  }

  showItemErrors() {
    this.showError(
      this.items
        .filter((item) => item.error)
        .map((item) => `${item.value}: ${item.error}`)
        .join("\n"),
    );
  }

  showError(message) {
    this.errorElement.textContent = message;
    this.errorElement.hidden = message === "";
    this.entry.setAttribute("aria-invalid", message === "" ? "false" : "true");
  }

  render() {
    this.hidden.value = this.items.map((item) => item.value).join(",");
    this.chips.replaceChildren(
      ...this.items.map((item, index) => {
        const chip = document.createElement("li");
        chip.className = "webapppassword-origin-picker__chip";
        chip.classList.toggle("invalid", !!item.error);
        chip.title = item.error ?? "";

        const label = document.createElement("span");
        label.textContent = item.value;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "×";
        removeButton.setAttribute(
          "aria-label",
          translate("Remove {origin}", { origin: item.value }),
        );
        removeButton.addEventListener("click", () => this.remove(index));

        chip.append(label, removeButton);
        return chip;
      }),
    );
    this.onChange();
  }

  renderSuggestions(candidates) {
    const own = this.origins;
    const suggestions = candidates.filter(
      ({ origin }) => !own.includes(origin),
    );
    const key = JSON.stringify(suggestions);
    if (key === this.suggestionsKey) {
      return;
    }
    this.suggestionsKey = key;

    const buttons = suggestions.map(({ origin, label }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "webapppassword-origin-picker__suggestion";
      button.textContent = `+ ${label}`;
      button.title = translate("Add {origin}", { origin });
      button.addEventListener("click", () => this.add(origin));
      return button;
    });

    this.suggestions.replaceChildren(
      this.suggestions.firstElementChild,
      ...buttons,
    );
    this.suggestions.hidden = buttons.length === 0;
  }
}

const pickers = [];

const updateSuggestions = () => {
  const ownOrigin = normalizeOrigin(window.location.origin).origin;
  for (const picker of pickers) {
    const candidates = [];
    if (ownOrigin) {
      candidates.push({
        origin: ownOrigin,
        label: translate("{origin} (this Nextcloud)", { origin: ownOrigin }),
      });
    }
    for (const other of pickers) {
      if (other === picker) {
        continue;
      }
      for (const origin of other.origins) {
        if (!candidates.some((candidate) => candidate.origin === origin)) {
          candidates.push({ origin, label: origin });
        }
      }
    }
    picker.renderSuggestions(candidates);
  }
};

document
  .querySelectorAll(".webapppassword-origin-picker")
  .forEach((root) =>
    pickers.push(new OriginPicker(root, () => updateSuggestions())),
  );
updateSuggestions();

const errorMessage = document.querySelector("#webapppassword-error-message");
const showSaveError = (message) => {
  errorMessage.textContent = message;
  errorMessage.hidden = message === "";
};

// Store origins on click
document.querySelector("#webapppassword-store-origins").onclick = (e) => {
  showSaveError("");

  // Also store origins that were typed but not confirmed yet
  const committed = pickers.map((picker) => picker.commitEntry());
  if (committed.includes(false) || pickers.some((p) => p.hasInvalid)) {
    showSaveError(
      t(APP_ID, "Please fix or remove the invalid origins before saving."),
    );
    return;
  }

  const data = {
    origins: document.querySelector("#webapppassword-origins").value,
    files_sharing_origins: document.querySelector(
      "#files-sharing-webapppassword-origins",
    ).value,
    preview_origins: document.querySelector("#preview-webapppassword-origins")
      .value,
  };

  const apiUrl = OC.generateUrl("/apps/webapppassword/admin");

  // Store origins
  fetch(apiUrl, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      requesttoken: OC.requestToken,
    },
  })
    .then((response) =>
      response.json().then((data) => ({ ok: response.ok, data })),
    )
    .then(({ ok, data }) => {
      if (!ok) {
        const fieldIds = {
          origins: "webapppassword-origins",
          files_sharing_origins: "files-sharing-webapppassword-origins",
          preview_origins: "preview-webapppassword-origins",
        };
        for (const [field, entries] of Object.entries(data.invalid ?? {})) {
          pickers
            .find((picker) => picker.hidden.id === fieldIds[field])
            ?.markInvalid(entries);
        }
        showSaveError(data.message ?? t(APP_ID, "Saving failed."));
        return;
      }

      pickers.forEach((picker) => {
        const field = {
          "webapppassword-origins": "origins",
          "files-sharing-webapppassword-origins": "files_sharing_origins",
          "preview-webapppassword-origins": "preview_origins",
        }[picker.hidden.id];
        picker.setValue(data[field]);
      });
      const successIndicator = document.querySelector(
        "#webapppassword-saved-message",
      );
      successIndicator.classList.add("show");

      setTimeout(() => {
        successIndicator.classList.remove("show");
      }, 2000);
    })
    .catch(() => showSaveError(t(APP_ID, "Saving failed.")));
};
