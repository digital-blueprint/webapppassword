
const apiUrl = OC.generateUrl('/apps/webapppassword/create');

console.log("apiUrl", apiUrl);

fetch(apiUrl, {
    method: 'POST',
    headers: {
        'requesttoken': oc_requesttoken
    }
})
    .then(response => response.json())
    .then((data) => {
        // console.log("data", data);

        const message = {"type": "webapppassword", "loginName": data.loginName, "token": data.token};
        window.opener.postMessage(message, document.referrer);
        // console.log("message", message);
    });
