export default async function renderthyreport(inputmsg) {
    let returnmsg = "Unavailable, sorry :(";
    // POST request using fetch with error handling
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputmsg })
    };
    const requested = await fetch('api/ability_6d/read', requestOptions)
        .then(async response => {
            const isJson = response.headers.get('content-type')?.includes('application/json');
            const data = isJson && await response.json();
            //console.log(data);

            // check for error response
            if (!response.ok) {
                // get error message from body or default to response status
                const error = (data && data.message) || response.status;
                returnmsg = error;
                return Promise.reject(error);
            }
            
            //console.log(data.content);
            returnmsg = data.content;
        })
        .catch(error => {
            console.error('There was an error!', error);
            returnmsg = "Sorry, our service is temporarily unavailable :(";
            console.log(returnmsg);
            console.log("Welp");
        });
    //console.log("Carry on...");
    //console.log(returnmsg);
    console.log(requested);
    return returnmsg;
}