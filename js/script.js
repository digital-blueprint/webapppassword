
const apiUrl = OC.generateUrl('/apps/webapppassword/create');
const url = new URL(window.location.href);
const targetOrigin = decodeURIComponent(url.searchParams.get('target-origin'));
const sessionName = decodeURIComponent(url.searchParams.get('session-name'));

fetch(apiUrl, {
    method: 'POST',
    headers: {
        'target-origin': targetOrigin,
        'target-origin': sessionName,
        'requesttoken': OC.requestToken
    }
})
    .then(response => response.json())
    .then((data) => {
        // console.log("data", data);
        const message = { "type": "webapppassword", "loginName": data.loginName, "token": data.token, "webdavUrl": data.webdavUrl };
        window.opener.postMessage(message, targetOrigin);
        // console.log("targetOrigin", targetOrigin);
        // console.log("message", message);
    });
