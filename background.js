function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

function listener(details) {
	let filter = browser.webRequest.filterResponseData(details.requestId);

	let data = [];
	filter.ondata = (event) => {
		data.push(event.data);
	};
	filter.onstop = async (event) => {
		let blob = new Blob(data, {type: 'text/html'});
    	let buffer = await blob.arrayBuffer();
    	const hash = await crypto.subtle.digest('SHA-256',buffer);
    	const hex = buf2hex(hash);
    	const seen = await browser.storage.local.get(details.url);
    	if(hex!==seen[details.url]) {
        const toSet = {};
        toSet[details.url] = hex;
    		await browser.storage.local.set({[details.url]:hex});
        await browser.notifications.create({
          type:"basic",
          message:`Hash: ${hex}`,
          title:`WARNING: page modified!`
        });
    	}
    	filter.write(buffer);
    	filter.close();
	};
}

browser.webRequest.onBeforeRequest.addListener(
  listener,
  {urls: ["<all_urls>"], types: ["main_frame"]},
  ["blocking"]
);