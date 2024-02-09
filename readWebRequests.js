//This file automates reading the responses of the web requests made to the API in the background.
const LS = browser.storage.local;

function listener(details) {
    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();

    filter.ondata = (event) => {
        let res = JSON.parse(decoder.decode(event.data, { stream: true }));
        filter.write(event.data);
        filter.disconnect();
        console.log(res);
        if(res.result=="Nothing") return; //In case the items don't merge
        const first = findGetParameter("first",details.url);
        const second = findGetParameter("second",details.url);
        LS.get(res.result).then((res2) => {
            /*
                Adds the result of the fusion into the add-on's localStorage
            */
            if(res2[res.result] == undefined){
                LS.set({ [`${res.result}`]: JSON.stringify({ emoji: res.emoji, text: res.result, fusions: [{first: first, second: second}] }) });
            }else{
                let item = JSON.parse(res2[res.result]);
                if(!item.fusions.some(fusion => fusion.first == first && fusion.second == second)){
                    item.fusions.push({first: first, second: second});
                    LS.set({ [`${res.result}`]: JSON.stringify(item) });
                }
            }
            
        });
    };

    return {};
}
function findGetParameter(parameterName, myUrl) {
    /*
        Utility function to extract the GET parameters to the API (to know what both items are being fused)
    */
    let result = null,
        tmp = [];
    myUrl
        .substr(myUrl.indexOf("?") + 1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

browser.webRequest.onBeforeRequest.addListener(
    listener,
    { urls: ["https://neal.fun/api/infinite-craft/*"]},
    ["blocking"],
);
