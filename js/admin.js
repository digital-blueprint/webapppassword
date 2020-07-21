console.log("WebAppPassword Admin");

const apiUrl = OC.generateUrl('/apps/webapppassword/admin');

console.log("apiUrl", apiUrl);

fetch(apiUrl, {
    method: 'GET',
    headers: {
        'requesttoken': oc_requesttoken
    }
})
    .then(response => response.json())
    .then((data) => {
        console.log("data", data);

    });

document.querySelector("#webapppassword-store-origins").onclick = (e) => {
    console.log("click");
    console.log(e);
    console.log(document.querySelector("#webapppassword-origins").value);
};
