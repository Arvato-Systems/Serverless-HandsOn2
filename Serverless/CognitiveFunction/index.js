const request = require('request');
const uuidv4 = require('uuid/v4');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    try {
        if (req.query.text || (req.body && req.body.text)) {
            var translatedText = await translate(req.query.text || req.body.text);
            var sentiment = await getSentiment(translatedText);

            context.res = {
                status: 201,
                body: JSON.stringify({ 'text': translatedText, 'sentiment': sentiment }),
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            context.done();
        }
        else {
            throw new Error("Please pass a name on the query string or in the request body");
        };
    }
    catch (e) {
        context.res = {
            status: 400,
            body: e.message
        };
    }
};

async function translate(text) {
    const subscriptionKey = process.env.TRANSLATOR_TEXT_KEY;
    if (!subscriptionKey) {
        throw new Error('Environment variable for your subscription key is not set.')
    };

    let options = {
        method: 'POST',
        baseUrl: 'https://api.cognitive.microsofttranslator.com/',
        url: 'translate',
        qs: {
            'api-version': '3.0',
            'to': 'de'
        },
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Content-type': 'application/json',
            'X-ClientTraceId': uuidv4().toString()
        },
        body: [{
            'text': text
        }],
        json: true,
    };

    return new Promise(function (resolve, reject) {
        request(options, function (error, res, body) {
            console.log(JSON.stringify(body, null, 4));
            if (!error && res.statusCode === 200) {
                resolve(body[0].translations[0].text)
            } else {
                reject(new Error(error));
            }
        });
    });
}

async function getSentiment(text) {
    const subscriptionKey = process.env.ANALYTICS_TEXT_KEY;
    if (!subscriptionKey) {
        throw new Error('Environment variable for your subscription key is not set.')
    };

    var reqBody = {
        "documents": [
            {
                "language": "de",
                "id": "1",
                "text": text
            }
        ]
    };

    let options = {
        method: 'POST',        
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Content-Type': 'application/json',
        },
        body: reqBody,
        json: true
    };
    var url= 'https://westeurope.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment';

    return new Promise(function (resolve, reject) {
        request(url, options, function (error, res, body) {
            console.log(JSON.stringify(body, null, 4));
            if (!error && res.statusCode === 200) {
                resolve(body.documents[0].score)
            } else {
                if (error !== null)
                    reject(new Error(error));
                else
                    reject(new Error(body.message));
            }
        });
    });
}