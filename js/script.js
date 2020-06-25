
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
        const url = new URL(window.location.href);
        const targetOrigin = decodeURIComponent(url.searchParams.get('target-origin'));
        window.opener.postMessage(message, targetOrigin);
        // console.log("targetOrigin", targetOrigin);
        // console.log("message", message);
    });
