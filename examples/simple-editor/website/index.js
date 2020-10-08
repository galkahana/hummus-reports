function handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText)
    }
    return response
}

function feche() {
    return fetch.apply(null,arguments).then(handleErrors)
}

function handleGenerateClick() {
    const txtDocument = document.getElementById('txtDocument')
    const documentText = txtDocument.value
    
    let documentOK  = true
    try {
        jsonDocument =  JSON.parse(documentText)
    }
    catch(ex) {
        documentOK = false
        alert(ex.message)
    }

    if(!documentOK)
        return

    fetch('/previews', {
        method: 'post',
        body: documentText,
        headers: {
            'Content-Type': 'application/json'        
        }
    })
        .then(function(response) {
            return response.blob()
        })
        .then(function(blob) {
            const reader = new FileReader()
            reader.addEventListener("load", function () {
                const objResult = document.getElementById('objResult')
                objResult.data = reader.result
            }, false)
            reader.readAsDataURL(blob);
        })
        .catch(function(ex) {
            console.log('error in producing pdf', ex)
        })

}

function setup() {
    console.log('setting up page...')

    const btnGenerate = document.getElementById('btnGenerate')
    btnGenerate.onclick = handleGenerateClick

    const scrDocument = document.getElementById('scrDocument')
    const txtDocument = document.getElementById('txtDocument')
    txtDocument.value = scrDocument.textContent

    console.log('...done page setup')
}


setup()

