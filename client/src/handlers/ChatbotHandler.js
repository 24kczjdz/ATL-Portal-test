import axios from 'axios';

export const sendnsee = async (message, chatId, analysisId = null) => {
    try {
        console.log('sendnsee called with:', { message, chatId, analysisId });
        
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            throw new Error('No authentication token found');
        }

        const url = `/api/chat/${chatId}/message`;
        const data = { Text: message };
        console.log('Making POST request to:', url, 'with data:', data);
        
        // Send message to chat
        const response = await axios.post(
            url,
            data,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        
        if (response.status !== 200) {
            console.error('Bad response status:', response.status);
            throw new Error('Failed to send message');
        }

        // Return the last bot message (the response from ATL Chatbot API)
        const messages = response.data.Messages;
        const lastMessage = messages[messages.length - 1];
        console.log('Returning bot response:', lastMessage.Text);
        return lastMessage.Text;
    } catch (error) {
        console.error('Error in sendnsee:', error);
        console.error('Error details:', error.response?.data);
        throw error;
    }
};

export const getAvailableAnalyses = async (chatId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.get(
            `/api/chat/${chatId}/analyses`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status !== 200) {
            throw new Error('Failed to fetch analyses');
        }

        return response.data;
    } catch (error) {
        console.error('Error in getAvailableAnalyses:', error);
        throw error;
    }
};

/*async function fr (inputmsg) {
  // POST request using fetch with async/await
  const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: inputmsg
  };
  try {
    const response = await fetch('api/chatbot/test', requestOptions).then(console.log("Connected!")).catch(error => {
        this.setState({ errorMessage: error.toString() });
        console.error('There was an error!', error);
    });
    const data = await response.json();
    console.log(data.body);
    if (response.ok) return data.body;
    else return "Sorry, our service is temporarily unavailable :(";
  } catch (err) {
    console.log("Welp");
    return "Sorry, our service is temporarily unavailable :(";
  }
}*/