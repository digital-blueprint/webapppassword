
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
        console.log("data", data);

        const message = {"type": "webapppassword", "token": data.token};
        window.parent.postMessage(message, '*');
        console.log("message", message);
    });
