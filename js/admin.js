
// Store origins on click
document.querySelector("#webapppassword-store-origins").onclick = (e) => {
    const data = {
        origins: document.querySelector("#webapppassword-origins").value,
        files_sharing_origins: document.querySelector("#files-sharing-webapppassword-origins").value,
        preview_origins: document.querySelector("#preview-webapppassword-origins").value,
    };

    const apiUrl = OC.generateUrl('/apps/webapppassword/admin');

    // Store origins
    fetch(apiUrl, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'requesttoken': OC.requestToken
        }
    })
        .then(response => response.json())
        .then((data) => {
            document.querySelector("#webapppassword-origins").value = data.origins;
            document.querySelector("#files-sharing-webapppassword-origins").value = data.files_sharing_origins;
            document.querySelector("#preview-webapppassword-origins").value = data.preview_origins;
            const successIndicator = document.querySelector("#webapppassword-saved-message");
            successIndicator.classList.add('show');

            setTimeout(() => {
                successIndicator.classList.remove('show');
            }, 2000);
        });
};
