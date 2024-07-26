const axios = require('axios');

exports.handler = async function(event, context) {
  try {
    const question = event.queryStringParameters.question;
    const response = await axios.get(`https://rosterai-fresh-function.azurewebsites.net/api/HttpTrigger?question=${encodeURIComponent(question)}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch response from AI' })
    };
  }
};
