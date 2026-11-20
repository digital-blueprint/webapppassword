const apiUrl = OC.generateUrl("/apps/webapppassword/create");
const url = new URL(window.location.href);
const targetOrigin = url.searchParams.get("target-origin");
const uidKey = "expected-uid";
const expectedUids = url.searchParams.getAll(uidKey);
const body = new URLSearchParams();
if (expectedUids.length > 0) {
  // Reject ambiguous requests instead of silently picking one account.
  body.set(uidKey, expectedUids.length === 1 ? expectedUids[0] : "");
}

fetch(apiUrl, {
  method: "POST",
  headers: {
    "target-origin": targetOrigin,
    requesttoken: OC.requestToken,
  },
  body,
})
  .then(async (response) => {
    const data = await response.json();
    if (response.status === 409 && data.error === "account_mismatch") {
      document.querySelector("#app-content").textContent = t(
        "webapppassword",
        "Switch to the expected Nextcloud account and retry.",
      );
      window.opener?.postMessage(
        { type: "webapppassword-error", error: "account_mismatch" },
        targetOrigin,
      );
      return;
    }
    if (
      !response.ok ||
      !data.token ||
      (body.has(uidKey) && data.uid !== body.get(uidKey))
    ) {
      throw new Error("App password request failed");
    }

    const message = {
      type: "webapppassword",
      loginName: data.loginName,
      token: data.token,
      webdavUrl: data.webdavUrl,
    };
    if (body.has(uidKey)) {
      message.uid = data.uid;
    }
    window.opener?.postMessage(message, targetOrigin);
  })
  .catch(() => {
    document.querySelector("#app-content").textContent = t(
      "webapppassword",
      "Could not create a temporary app password.",
    );
  });
