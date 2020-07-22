console.log("WebAppPassword Admin");

document.querySelector("#webapppassword-store-origins").onclick = (e) => {
    console.log(document.querySelector("#webapppassword-origins").value);
    const data = {
        origins: document.querySelector("#webapppassword-origins").value,
    };

    console.log(data);

    const apiUrl = OC.generateUrl('/apps/webapppassword/admin');

    console.log("apiUrl", apiUrl);

    $.ajax({
        type: 'PUT',
        contentType: 'application/json; charset=utf-8',
        url: apiUrl,
        data: JSON.stringify(data),
        dataType: 'json'
    }).then(function (data) {
        console.log("data1", data);
        // saved();
        // autoPurgeMinimumIntervalInput
        //     .val(data.autoPurgeMinimumInterval);
        // autoPurgeCountInput.val(data.autoPurgeCount);
        // maxRedirectsInput.val(data.maxRedirects);
        // maxSizeInput.val(data.maxSize);
        // feedFetcherTimeoutInput.val(data.feedFetcherTimeout);
        // useCronUpdatesInput.prop('checked', data.useCronUpdates);
        // exploreUrlInput.val(data.exploreUrl);
    });

    // fetch(apiUrl, {
    //     method: 'PUT',
    //     contentType: 'application/json; charset=utf-8',
    //     body: JSON.stringify(data),
    //     headers: {
    //         'requesttoken': oc_requesttoken
    //     }
    // })
    //     .then(response => response.json())
    //     .then((data) => {
    //         console.log("data2", data);
    //
    //     });

};
