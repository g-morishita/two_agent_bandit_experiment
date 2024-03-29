export const saveJsonData = (data) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/write_data');
    xhr.setRequestHeader('Content-Type', 'application/json');
    // xhr.send(JSON.stringify({test: "test"}));
    xhr.send(JSON.stringify({filedata: data}));
};

export const putS3 = (file, fileName) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/putS3`);
    xhr.setRequestHeader('Content-Type', "application/json");
    const sentData = {fileName: fileName, data: file};
    xhr.send(JSON.stringify(sentData));
};

export const download = (filename, text) => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};

export const choiceImageCandidates = [...Array(16).keys()].map(x => 'choice' + (x+1) + '.png');